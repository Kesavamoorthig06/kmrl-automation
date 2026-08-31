"""
Schedule Store — Persistent schedule state for train induction.

Stores the active schedule as a JSON file so it survives restarts.
Both the WhatsApp bot and the React frontend (via API) share this state.

Schedule lifecycle:
  1. Admin creates a schedule (one-click or manual) → ACTIVE
  2. Trains are in service
  3. Admin closes the schedule (trains returned to depot) → CLOSED
  4. New schedule can be created

CSV reading:
  Reads ml_analysis_data.csv from the public folder to get train data
  for one-click optimal selection.
"""

from __future__ import annotations

import csv
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────

_STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage")
_SCHEDULE_FILE = os.path.join(_STORAGE_DIR, "active_schedule.json")

# CSV location — local dev vs EC2
_CSV_CANDIDATES = [
    os.path.join(os.path.dirname(__file__), "..", "public", "ml_analysis_data.csv"),
    os.path.expanduser("~/public/ml_analysis_data.csv"),
]


def _ensure_storage():
    os.makedirs(_STORAGE_DIR, exist_ok=True)


# ── CSV reader ────────────────────────────────────────────────────

def _find_csv() -> Optional[str]:
    for path in _CSV_CANDIDATES:
        if os.path.isfile(path):
            return path
    return None


def get_available_trains() -> list[dict]:
    """
    Read ml_analysis_data.csv and return available, service-ready trains
    sorted by score descending.
    """
    csv_path = _find_csv()
    if not csv_path:
        logger.warning("ml_analysis_data.csv not found in any expected location")
        return []

    trains = []
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                trains.append({
                    "train_id": row.get("train_id", ""),
                    "status": row.get("status", ""),
                    "score": float(row.get("score", 0)),
                    "stabling_bay": row.get("stabling_bay", ""),
                    "branding_priority": int(row.get("branding_priority", 0)),
                    "mileage": int(row.get("mileage", 0)),
                    "last_cleaned_date": row.get("last_cleaned_date", ""),
                    "assignment": row.get("assignment", ""),
                    "deployment_ready": row.get("deployment_ready", "") == "Yes",
                    "fitness_certificate_valid": row.get("fitness_certificate_valid", "") == "Yes",
                    "job_card_status": row.get("job_card_status", ""),
                })
    except Exception as e:
        logger.error("Failed to read CSV: %s", e)
        return []

    # Filter available + service trains, sort by score descending
    available = [
        t for t in trains
        if t["status"] == "Available" and t["assignment"] == "Service"
    ]
    available.sort(key=lambda t: t["score"], reverse=True)
    return available


def get_all_trains_from_csv() -> list[dict]:
    """Read all trains from CSV regardless of status."""
    csv_path = _find_csv()
    if not csv_path:
        return []
    trains = []
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                trains.append({
                    "train_id": row.get("train_id", ""),
                    "status": row.get("status", ""),
                    "score": float(row.get("score", 0)),
                    "stabling_bay": row.get("stabling_bay", ""),
                    "assignment": row.get("assignment", ""),
                })
    except Exception:
        return []
    return trains


# ── Schedule CRUD ─────────────────────────────────────────────────

def get_active_schedule() -> Optional[dict]:
    """Return the active schedule dict or None if no active schedule."""
    _ensure_storage()
    if not os.path.isfile(_SCHEDULE_FILE):
        return None
    try:
        with open(_SCHEDULE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if data.get("status") == "ACTIVE":
            return data
        return None
    except (json.JSONDecodeError, IOError):
        return None


def is_schedule_active() -> bool:
    return get_active_schedule() is not None


def create_schedule(
    train_ids: list[str],
    created_by: str,
    mode: str = "one_click",
) -> dict:
    """
    Create a new active schedule.

    Args:
        train_ids: List of train IDs to deploy.
        created_by: Employee ID of the admin who created it.
        mode: 'one_click' or 'manual'.

    Returns:
        The schedule dict.

    Raises:
        ValueError if a schedule is already active.
    """
    _ensure_storage()
    if is_schedule_active():
        raise ValueError("A schedule is already active. Close it before creating a new one.")

    schedule = {
        "status": "ACTIVE",
        "train_ids": train_ids,
        "count": len(train_ids),
        "mode": mode,
        "created_by": created_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "closed_at": None,
        "closed_by": None,
    }
    with open(_SCHEDULE_FILE, "w", encoding="utf-8") as f:
        json.dump(schedule, f, indent=2)

    logger.info("Schedule created: %d trains, by=%s, mode=%s", len(train_ids), created_by, mode)
    return schedule


def close_schedule(closed_by: str) -> Optional[dict]:
    """
    Close the active schedule (trains returned to depot).
    Returns the closed schedule dict or None if no active schedule.
    """
    _ensure_storage()
    schedule = get_active_schedule()
    if schedule is None:
        return None

    schedule["status"] = "CLOSED"
    schedule["closed_at"] = datetime.now(timezone.utc).isoformat()
    schedule["closed_by"] = closed_by

    with open(_SCHEDULE_FILE, "w", encoding="utf-8") as f:
        json.dump(schedule, f, indent=2)

    logger.info("Schedule closed by=%s", closed_by)
    return schedule


def get_optimal_trains(count: int = 14) -> list[dict]:
    """
    Get the top N available service trains — the one-click selection.
    Returns the same list the web UI auto-selects.
    """
    available = get_available_trains()
    return available[:count]
