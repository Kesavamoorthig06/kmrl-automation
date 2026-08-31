"""
Audit logger — structured, immutable audit trail for all security events.

Writes to:
  1. PostgreSQL audit_logs table (primary, tamper-evident)
  2. JSON-line files in audit_logs/ directory (backup/local dev)
  3. Python logger at INFO/WARNING level

Every security-critical action is logged:
  - Authentication attempts (success/fail)
  - IP mismatches
  - Upload actions (start/complete/reject)
  - Session lifecycle (create/expire/logout)
  - Data ingestion events
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from db import AuditLog, AuditEvent

logger = logging.getLogger(__name__)

_AUDIT_DIR = os.path.join(os.path.dirname(__file__), "audit_logs")
os.makedirs(_AUDIT_DIR, exist_ok=True)


def _write_to_file(event: str, **kwargs):
    """Write audit entry to daily JSON-lines file (backup/local dev)."""
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        **kwargs,
    }
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    path = os.path.join(_AUDIT_DIR, f"audit_{day}.jsonl")
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, default=str) + "\n")


async def log_event(
    db: Optional[AsyncSession],
    event: AuditEvent,
    phone_number: Optional[str] = None,
    employee_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    detail: Optional[str] = None,
):
    """
    Log a security event to both DB and file.

    Parameters
    ----------
    db : AsyncSession | None
        Database session. If None, only writes to file.
    event : AuditEvent
        The event type.
    phone_number, employee_id, ip_address, detail :
        Context fields.
    """
    # Always write to file (works without DB)
    _write_to_file(
        event=event.value,
        phone_number=phone_number,
        employee_id=employee_id,
        ip_address=ip_address,
        detail=detail,
    )

    # Log to Python logger
    level = logging.WARNING if event in (
        AuditEvent.AUTH_FAIL, AuditEvent.IP_MISMATCH,
        AuditEvent.UPLOAD_REJECT, AuditEvent.SESSION_EXPIRED,
    ) else logging.INFO

    logger.log(
        level,
        "AUDIT %s: phone=%s emp=%s ip=%s detail=%s",
        event.value, phone_number, employee_id, ip_address, detail,
    )

    # Write to DB if available
    if db is not None:
        try:
            db.add(AuditLog(
                event=event,
                phone_number=phone_number,
                employee_id=employee_id,
                ip_address=ip_address,
                detail=detail,
            ))
            await db.commit()
        except Exception as e:
            logger.error("Failed to write audit to DB: %s", e)


# ── Convenience functions for common events ───────────────────────

async def log_auth_attempt(db: Optional[AsyncSession], phone: str, ip: str, employee_id: str = ""):
    await log_event(db, AuditEvent.AUTH_ATTEMPT, phone, employee_id, ip, "OAuth login initiated")


async def log_auth_success(db: Optional[AsyncSession], phone: str, employee_id: str, ip: str, role: str):
    await log_event(db, AuditEvent.AUTH_SUCCESS, phone, employee_id, ip, f"Authenticated as {role}")


async def log_auth_fail(db: Optional[AsyncSession], phone: str, ip: str, reason: str):
    await log_event(db, AuditEvent.AUTH_FAIL, phone, "", ip, reason)


async def log_ip_mismatch(db: Optional[AsyncSession], phone: str, employee_id: str, expected_ip: str, actual_ip: str):
    await log_event(
        db, AuditEvent.IP_MISMATCH, phone, employee_id, actual_ip,
        f"Expected IP={expected_ip}, got IP={actual_ip}",
    )


async def log_upload_start(db: Optional[AsyncSession], phone: str, employee_id: str, ip: str, doc_type: str):
    await log_event(db, AuditEvent.UPLOAD_START, phone, employee_id, ip, f"Upload started: {doc_type}")


async def log_upload_complete(db: Optional[AsyncSession], phone: str, employee_id: str, ip: str, doc_type: str):
    await log_event(db, AuditEvent.UPLOAD_COMPLETE, phone, employee_id, ip, f"Upload complete: {doc_type}")


async def log_upload_reject(db: Optional[AsyncSession], phone: str, ip: str, reason: str):
    await log_event(db, AuditEvent.UPLOAD_REJECT, phone, "", ip, reason)


async def log_session_expired(db: Optional[AsyncSession], phone: str, employee_id: str):
    await log_event(db, AuditEvent.SESSION_EXPIRED, phone, employee_id, "", "Session expired")


async def log_session_logout(db: Optional[AsyncSession], phone: str, employee_id: str):
    await log_event(db, AuditEvent.SESSION_LOGOUT, phone, employee_id, "", "User logged out")
