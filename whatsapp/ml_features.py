"""
ML Feature Integration — bridge between ingested data and the ML pipeline.

Exposes the four new features required by the optimizer:
  open_critical_jobs     — count of CRITICAL+OPEN job cards per train
  open_high_jobs         — count of HIGH+OPEN job cards per train
  cleaning_due_flag      — 1 if a DEEP clean is overdue/imminent
  cleaning_conflict_flag — 1 if cleaning slot overlaps service window

These are fetched from the database and merged into the nightly
feature matrix used by ml/feature_engine.py.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from db import JobCard, JobSeverity, JobStatus, CleaningSlot, CleaningType

logger = logging.getLogger(__name__)


async def get_ml_features_for_train(
    db: AsyncSession,
    train_id: str,
    service_window_hours: int = 8,
) -> dict:
    """
    Compute all four ML features for a single train.

    Parameters
    ----------
    db : AsyncSession
    train_id : str
    service_window_hours : int
        Hours ahead to check for cleaning conflicts (default 8h).

    Returns
    -------
    dict with keys:
        train_id, open_critical_jobs, open_high_jobs,
        cleaning_due_flag, cleaning_conflict_flag
    """
    now = datetime.now(timezone.utc)

    # ── Job card features ─────────────────────────────────────────
    critical = await db.execute(
        select(func.count(JobCard.id))
        .where(
            JobCard.train_id == train_id,
            JobCard.severity == JobSeverity.CRITICAL,
            JobCard.status == JobStatus.OPEN,
        )
    )
    open_critical = critical.scalar() or 0

    high = await db.execute(
        select(func.count(JobCard.id))
        .where(
            JobCard.train_id == train_id,
            JobCard.severity == JobSeverity.HIGH,
            JobCard.status == JobStatus.OPEN,
        )
    )
    open_high = high.scalar() or 0

    # ── Cleaning features ─────────────────────────────────────────

    # Deep clean due: no completed deep clean in last 7 days
    cutoff_7d = now - timedelta(days=7)
    recent_deep = await db.execute(
        select(func.count(CleaningSlot.id))
        .where(
            CleaningSlot.train_id == train_id,
            CleaningSlot.cleaning_type == CleaningType.DEEP,
            CleaningSlot.assigned == True,
            CleaningSlot.slot_end >= cutoff_7d,
            CleaningSlot.slot_end <= now,
        )
    )
    cleaning_due = 1 if (recent_deep.scalar() or 0) == 0 else 0

    # Cleaning conflict: overlap with service window
    window_end = now + timedelta(hours=service_window_hours)
    conflict = await db.execute(
        select(func.count(CleaningSlot.id))
        .where(
            CleaningSlot.train_id == train_id,
            CleaningSlot.assigned == True,
            CleaningSlot.slot_start < window_end,
            CleaningSlot.slot_end > now,
        )
    )
    cleaning_conflict = 1 if (conflict.scalar() or 0) > 0 else 0

    return {
        "train_id": train_id,
        "open_critical_jobs": open_critical,
        "open_high_jobs": open_high,
        "cleaning_due_flag": cleaning_due,
        "cleaning_conflict_flag": cleaning_conflict,
    }


async def get_ml_features_all_trains(db: AsyncSession) -> list[dict]:
    """
    Compute ML features for ALL trains in the database.

    Used by the nightly pipeline to merge into the feature matrix.
    """
    # Get all unique train IDs from both tables
    job_trains = await db.execute(select(JobCard.train_id).distinct())
    cleaning_trains = await db.execute(select(CleaningSlot.train_id).distinct())

    all_train_ids = set()
    for row in job_trains:
        all_train_ids.add(row[0])
    for row in cleaning_trains:
        all_train_ids.add(row[0])

    features = []
    for train_id in sorted(all_train_ids):
        feat = await get_ml_features_for_train(db, train_id)
        features.append(feat)

    logger.info("ML features computed for %d trains", len(features))
    return features


def apply_business_rules(features: dict) -> dict:
    """
    Apply business rules based on ML features.

    Returns decisions dict:
      force_ibl           — True if CRITICAL open jobs exist
      reduce_priority     — True if HIGH open jobs exist
      penalize_service    — True if deep clean is due
      avoid_conflict      — True if cleaning slot conflicts
    """
    return {
        "train_id": features["train_id"],
        "force_ibl": features["open_critical_jobs"] > 0,
        "reduce_priority": features["open_high_jobs"] > 0,
        "penalize_service": features["cleaning_due_flag"] == 1,
        "avoid_conflict": features["cleaning_conflict_flag"] == 1,
    }
