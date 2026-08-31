"""
Cleaning Slot Ingestion — parse and store depot cleaning schedule data.

Source: CSV/JSON upload from depot cleaning schedule.

Schema per record:
  train_id      : str
  cleaning_type : LIGHT | DEEP
  slot_start    : datetime
  slot_end      : datetime
  assigned      : boolean

Business effects:
  deep_clean due         → penalize service (train needs cleaning)
  cleaning scheduled     → avoid assignment conflict with slot window

ML features produced:
  cleaning_due_flag       — 1 if a DEEP clean is overdue or due within 24h
  cleaning_conflict_flag  — 1 if train has a cleaning slot overlapping a service window
"""

from __future__ import annotations

import csv
import io
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from db import CleaningSlot, CleaningType, AuditLog, AuditEvent

logger = logging.getLogger(__name__)


# ── Parse cleaning slots from CSV ─────────────────────────────────

def parse_cleaning_slots_csv(csv_content: str) -> list[dict]:
    """
    Parse cleaning slots from CSV text.

    Expected columns: train_id, cleaning_type, slot_start, slot_end, assigned
    """
    reader = csv.DictReader(io.StringIO(csv_content))
    records = []
    errors = []

    for i, row in enumerate(reader, start=2):
        try:
            cleaning_type = row["cleaning_type"].strip().upper()
            if cleaning_type not in CleaningType.__members__:
                errors.append(f"Row {i}: invalid cleaning_type '{cleaning_type}'")
                continue

            assigned_raw = row["assigned"].strip().lower()
            assigned = assigned_raw in ("true", "1", "yes", "y")

            records.append({
                "train_id": row["train_id"].strip(),
                "cleaning_type": cleaning_type,
                "slot_start": _parse_datetime(row["slot_start"].strip()),
                "slot_end": _parse_datetime(row["slot_end"].strip()),
                "assigned": assigned,
            })
        except KeyError as e:
            errors.append(f"Row {i}: missing column {e}")
        except ValueError as e:
            errors.append(f"Row {i}: {e}")

    if errors:
        logger.warning("Cleaning slot parse errors: %s", errors[:10])

    return records


def parse_cleaning_slots_json(json_content: str) -> list[dict]:
    """Parse cleaning slots from JSON (array of objects)."""
    data = json.loads(json_content)
    if not isinstance(data, list):
        data = [data]

    records = []
    for item in data:
        records.append({
            "train_id": str(item["train_id"]).strip(),
            "cleaning_type": str(item["cleaning_type"]).strip().upper(),
            "slot_start": _parse_datetime(str(item["slot_start"])),
            "slot_end": _parse_datetime(str(item["slot_end"])),
            "assigned": bool(item.get("assigned", False)),
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

async def ingest_cleaning_slots(
    db: AsyncSession,
    records: list[dict],
    ingested_by: Optional[str] = None,
) -> dict:
    """
    Insert cleaning slot records into the database.

    Returns summary: {inserted, errors, total}
    """
    inserted = 0
    errors = []

    for rec in records:
        try:
            slot = CleaningSlot(
                train_id=rec["train_id"],
                cleaning_type=CleaningType(rec["cleaning_type"]),
                slot_start=rec["slot_start"],
                slot_end=rec["slot_end"],
                assigned=rec["assigned"],
                ingested_by=ingested_by,
            )
            db.add(slot)
            inserted += 1
        except Exception as e:
            errors.append(f"train_id={rec.get('train_id', '?')}: {e}")

    # Audit log
    db.add(AuditLog(
        event=AuditEvent.CLEANING_SLOT_INGEST,
        employee_id=ingested_by,
        detail=f"Ingested {inserted} slots, {len(errors)} errors from {len(records)} records",
    ))

    await db.commit()

    summary = {
        "inserted": inserted,
        "errors": errors[:20],
        "total": len(records),
    }
    logger.info("Cleaning slot ingestion: %s", summary)
    return summary


# ── Query helpers for business rules ──────────────────────────────

async def is_deep_clean_due(db: AsyncSession, train_id: str) -> bool:
    """
    Check if a DEEP clean is due (no completed deep clean in last 7 days)
    or a deep clean slot is scheduled within 24 hours.
    """
    now = datetime.now(timezone.utc)
    cutoff_7d = now - timedelta(days=7)
    cutoff_24h = now + timedelta(hours=24)

    # Check for recent completed deep clean
    result = await db.execute(
        select(func.count(CleaningSlot.id))
        .where(
            CleaningSlot.train_id == train_id,
            CleaningSlot.cleaning_type == CleaningType.DEEP,
            CleaningSlot.assigned == True,
            CleaningSlot.slot_end >= cutoff_7d,
            CleaningSlot.slot_end <= now,
        )
    )
    recent_deep = result.scalar() or 0

    if recent_deep == 0:
        return True  # No recent deep clean → due

    # Check if a deep clean is scheduled soon (within 24h)
    result = await db.execute(
        select(func.count(CleaningSlot.id))
        .where(
            CleaningSlot.train_id == train_id,
            CleaningSlot.cleaning_type == CleaningType.DEEP,
            CleaningSlot.slot_start <= cutoff_24h,
            CleaningSlot.slot_start >= now,
        )
    )
    upcoming = result.scalar() or 0
    return upcoming > 0


async def has_cleaning_conflict(
    db: AsyncSession,
    train_id: str,
    window_start: datetime,
    window_end: datetime,
) -> bool:
    """
    Check if a cleaning slot overlaps with a given service window.
    """
    result = await db.execute(
        select(func.count(CleaningSlot.id))
        .where(
            CleaningSlot.train_id == train_id,
            CleaningSlot.assigned == True,
            CleaningSlot.slot_start < window_end,
            CleaningSlot.slot_end > window_start,
        )
    )
    count = result.scalar() or 0
    return count > 0


async def get_train_cleaning_summary(db: AsyncSession, train_id: str) -> dict:
    """
    Cleaning summary for a train.
    """
    now = datetime.now(timezone.utc)

    # Next scheduled cleaning
    result = await db.execute(
        select(CleaningSlot)
        .where(
            CleaningSlot.train_id == train_id,
            CleaningSlot.slot_start >= now,
        )
        .order_by(CleaningSlot.slot_start)
        .limit(1)
    )
    next_slot = result.scalar_one_or_none()

    deep_due = await is_deep_clean_due(db, train_id)

    return {
        "train_id": train_id,
        "deep_clean_due": deep_due,
        "next_cleaning": {
            "type": next_slot.cleaning_type.value if next_slot else None,
            "start": next_slot.slot_start.isoformat() if next_slot else None,
            "end": next_slot.slot_end.isoformat() if next_slot else None,
            "assigned": next_slot.assigned if next_slot else None,
        } if next_slot else None,
    }


async def get_all_trains_cleaning_features(db: AsyncSession) -> list[dict]:
    """
    ML feature export: cleaning_due_flag and cleaning_conflict_flag per train.
    """
    # Get all distinct train IDs
    result = await db.execute(
        select(CleaningSlot.train_id).distinct()
    )
    train_ids = [row[0] for row in result]

    features = []
    for train_id in train_ids:
        deep_due = await is_deep_clean_due(db, train_id)

        # Check conflict with "now to +8h" window (typical service window)
        now = datetime.now(timezone.utc)
        conflict = await has_cleaning_conflict(db, train_id, now, now + timedelta(hours=8))

        features.append({
            "train_id": train_id,
            "cleaning_due_flag": 1 if deep_due else 0,
            "cleaning_conflict_flag": 1 if conflict else 0,
        })

    return features
