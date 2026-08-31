"""
Job Card Ingestion — parse and store Maximo job-card data.

Source: CSV/JSON upload or Maximo API export.

Schema per record:
  train_id   : str
  job_id     : str  (unique)
  severity   : LOW | MEDIUM | HIGH | CRITICAL
  status     : OPEN | CLOSED
  timestamp  : datetime
  description: str (optional)

Business effects:
  CRITICAL + OPEN  → force train to IBL (inspection bay line)
  HIGH + OPEN      → reduce service priority in optimizer

ML features produced:
  open_critical_jobs  — count of CRITICAL+OPEN per train
  open_high_jobs      — count of HIGH+OPEN per train
"""

from __future__ import annotations

import csv
import io
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from db import JobCard, JobSeverity, JobStatus, AuditLog, AuditEvent

logger = logging.getLogger(__name__)


# ── Parse job cards from CSV ──────────────────────────────────────

def parse_job_cards_csv(csv_content: str) -> list[dict]:
    """
    Parse job cards from CSV text.

    Expected columns: train_id, job_id, severity, status, timestamp [, description]
    """
    reader = csv.DictReader(io.StringIO(csv_content))
    records = []
    errors = []

    for i, row in enumerate(reader, start=2):  # row 1 is header
        try:
            severity = row["severity"].strip().upper()
            status = row["status"].strip().upper()

            if severity not in JobSeverity.__members__:
                errors.append(f"Row {i}: invalid severity '{severity}'")
                continue
            if status not in JobStatus.__members__:
                errors.append(f"Row {i}: invalid status '{status}'")
                continue

            records.append({
                "train_id": row["train_id"].strip(),
                "job_id": row["job_id"].strip(),
                "severity": severity,
                "status": status,
                "timestamp": _parse_datetime(row["timestamp"].strip()),
                "description": row.get("description", "").strip(),
            })
        except KeyError as e:
            errors.append(f"Row {i}: missing column {e}")
        except ValueError as e:
            errors.append(f"Row {i}: {e}")

    if errors:
        logger.warning("Job card parse errors: %s", errors[:10])

    return records


def parse_job_cards_json(json_content: str) -> list[dict]:
    """Parse job cards from JSON (array of objects)."""
    data = json.loads(json_content)
    if not isinstance(data, list):
        data = [data]

    records = []
    for item in data:
        records.append({
            "train_id": str(item["train_id"]).strip(),
            "job_id": str(item["job_id"]).strip(),
            "severity": str(item["severity"]).strip().upper(),
            "status": str(item["status"]).strip().upper(),
            "timestamp": _parse_datetime(str(item["timestamp"])),
            "description": str(item.get("description", "")),
        })
    return records


def _parse_datetime(s: str) -> datetime:
    """Try multiple datetime formats."""
    for fmt in (
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y",
    ):
        try:
            dt = datetime.strptime(s, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    raise ValueError(f"Cannot parse datetime: '{s}'")


# ── Ingest to database ───────────────────────────────────────────

async def ingest_job_cards(
    db: AsyncSession,
    records: list[dict],
    ingested_by: Optional[str] = None,
) -> dict:
    """
    Upsert job card records into the database.

    Returns summary: {inserted, updated, errors, total}
    """
    inserted = 0
    updated = 0
    errors = []

    for rec in records:
        try:
            # Check if job_id already exists
            existing = await db.execute(
                select(JobCard).where(JobCard.job_id == rec["job_id"])
            )
            existing_card = existing.scalar_one_or_none()

            if existing_card:
                # Update existing
                existing_card.severity = JobSeverity(rec["severity"])
                existing_card.status = JobStatus(rec["status"])
                existing_card.timestamp = rec["timestamp"]
                existing_card.description = rec.get("description", "")
                updated += 1
            else:
                # Insert new
                card = JobCard(
                    train_id=rec["train_id"],
                    job_id=rec["job_id"],
                    severity=JobSeverity(rec["severity"]),
                    status=JobStatus(rec["status"]),
                    timestamp=rec["timestamp"],
                    description=rec.get("description", ""),
                    ingested_by=ingested_by,
                )
                db.add(card)
                inserted += 1

        except Exception as e:
            errors.append(f"job_id={rec.get('job_id', '?')}: {e}")

    # Audit log
    db.add(AuditLog(
        event=AuditEvent.JOB_CARD_INGEST,
        employee_id=ingested_by,
        detail=f"Ingested {inserted} new, {updated} updated, {len(errors)} errors from {len(records)} records",
    ))

    await db.commit()

    summary = {
        "inserted": inserted,
        "updated": updated,
        "errors": errors[:20],
        "total": len(records),
    }
    logger.info("Job card ingestion: %s", summary)
    return summary


# ── Query helpers for business rules ──────────────────────────────

async def get_open_critical_jobs(db: AsyncSession, train_id: str) -> int:
    """Count CRITICAL+OPEN jobs for a train → force IBL."""
    result = await db.execute(
        select(func.count(JobCard.id))
        .where(
            JobCard.train_id == train_id,
            JobCard.severity == JobSeverity.CRITICAL,
            JobCard.status == JobStatus.OPEN,
        )
    )
    return result.scalar() or 0


async def get_open_high_jobs(db: AsyncSession, train_id: str) -> int:
    """Count HIGH+OPEN jobs for a train → reduce service priority."""
    result = await db.execute(
        select(func.count(JobCard.id))
        .where(
            JobCard.train_id == train_id,
            JobCard.severity == JobSeverity.HIGH,
            JobCard.status == JobStatus.OPEN,
        )
    )
    return result.scalar() or 0


async def get_train_job_summary(db: AsyncSession, train_id: str) -> dict:
    """
    Full job card summary for a train.

    Returns:
      {
        "train_id": ...,
        "open_total": ...,
        "open_critical": ...,
        "open_high": ...,
        "open_medium": ...,
        "open_low": ...,
        "force_ibl": bool,
        "reduce_priority": bool,
      }
    """
    counts = {}
    for sev in JobSeverity:
        result = await db.execute(
            select(func.count(JobCard.id))
            .where(
                JobCard.train_id == train_id,
                JobCard.severity == sev,
                JobCard.status == JobStatus.OPEN,
            )
        )
        counts[sev.value] = result.scalar() or 0

    open_total = sum(counts.values())

    return {
        "train_id": train_id,
        "open_total": open_total,
        "open_critical": counts.get("CRITICAL", 0),
        "open_high": counts.get("HIGH", 0),
        "open_medium": counts.get("MEDIUM", 0),
        "open_low": counts.get("LOW", 0),
        "force_ibl": counts.get("CRITICAL", 0) > 0,
        "reduce_priority": counts.get("HIGH", 0) > 0,
    }


async def get_all_trains_job_features(db: AsyncSession) -> list[dict]:
    """
    ML feature export: open_critical_jobs and open_high_jobs per train.
    """
    result = await db.execute(
        select(
            JobCard.train_id,
            JobCard.severity,
            func.count(JobCard.id).label("count"),
        )
        .where(JobCard.status == JobStatus.OPEN)
        .group_by(JobCard.train_id, JobCard.severity)
    )

    features: dict[str, dict] = {}
    for row in result:
        train_id = row.train_id
        if train_id not in features:
            features[train_id] = {
                "train_id": train_id,
                "open_critical_jobs": 0,
                "open_high_jobs": 0,
            }
        if row.severity == JobSeverity.CRITICAL:
            features[train_id]["open_critical_jobs"] = row.count
        elif row.severity == JobSeverity.HIGH:
            features[train_id]["open_high_jobs"] = row.count

    return list(features.values())
