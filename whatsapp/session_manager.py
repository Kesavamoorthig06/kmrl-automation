"""
Session manager — secure session lifecycle for the WhatsApp bot.

Responsibilities:
  - Create sessions after successful OAuth
  - Validate sessions on every request (phone + IP binding)
  - Auto-expire sessions after timeout
  - Invalidate sessions on logout
  - Refresh token rotation
  - Never store tokens in plaintext

All session state lives in PostgreSQL (active_sessions table),
keeping bot servers stateless.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from auth import hash_token, TokenResponse
from config import SESSION_TIMEOUT_MINUTES
from db import ActiveSession, AuditLog, AuditEvent

logger = logging.getLogger(__name__)


# ── Session data returned to callers ──────────────────────────────

class SessionInfo:
    """Lightweight session info returned by session validation."""

    __slots__ = ("phone_number", "employee_id", "role", "ip_address", "expires_at", "is_valid")

    def __init__(
        self,
        phone_number: str = "",
        employee_id: str = "",
        role: str = "",
        ip_address: str = "",
        expires_at: Optional[datetime] = None,
        is_valid: bool = False,
    ):
        self.phone_number = phone_number
        self.employee_id = employee_id
        self.role = role
        self.ip_address = ip_address
        self.expires_at = expires_at
        self.is_valid = is_valid


# ── Create session ────────────────────────────────────────────────

async def create_session(
    db: AsyncSession,
    phone_number: str,
    employee_id: str,
    role: str,
    access_token: str,
    refresh_token: Optional[str],
    ip_address: str,
    expires_in: int = SESSION_TIMEOUT_MINUTES * 60,
) -> ActiveSession:
    """
    Create a new authenticated session after successful OAuth.

    Steps:
      1. Invalidate any existing sessions for this phone number
      2. Hash the access token (never store plaintext)
      3. Insert new session record
      4. Log the event
    """
    # 1. Invalidate existing sessions for this phone
    await invalidate_sessions_for_phone(db, phone_number, reason="new_login")

    # 2. Hash tokens
    token_hash = hash_token(access_token)
    refresh_hash = hash_token(refresh_token) if refresh_token else None

    # 3. Create session record
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    session = ActiveSession(
        phone_number=phone_number,
        employee_id=employee_id,
        role=role,
        access_token_hash=token_hash,
        refresh_token_hash=refresh_hash,
        ip_address=ip_address,
        expires_at=expires_at,
        is_active=True,
    )
    db.add(session)

    # 4. Audit log
    db.add(AuditLog(
        event=AuditEvent.AUTH_SUCCESS,
        phone_number=phone_number,
        employee_id=employee_id,
        ip_address=ip_address,
        detail=f"Session created, expires_at={expires_at.isoformat()}",
    ))

    await db.commit()
    await db.refresh(session)

    logger.info(
        "Session created: phone=%s emp=%s role=%s ip=%s expires=%s",
        phone_number, employee_id, role, ip_address, expires_at.isoformat(),
    )
    return session


# ── Validate session ──────────────────────────────────────────────

async def validate_session(
    db: AsyncSession,
    phone_number: str,
    ip_address: str,
) -> SessionInfo:
    """
    Validate that a phone number has an active, non-expired session
    bound to the given IP address.

    Returns SessionInfo with is_valid=True if the session is valid.
    """
    result = await db.execute(
        select(ActiveSession)
        .where(
            ActiveSession.phone_number == phone_number,
            ActiveSession.is_active == True,
        )
        .order_by(ActiveSession.created_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()

    if session is None:
        return SessionInfo(phone_number=phone_number, is_valid=False)

    # Check expiry
    if session.is_expired:
        session.is_active = False
        db.add(AuditLog(
            event=AuditEvent.SESSION_EXPIRED,
            phone_number=phone_number,
            employee_id=session.employee_id,
            ip_address=ip_address,
            detail="Session expired during validation",
        ))
        await db.commit()
        logger.info("Session expired: phone=%s emp=%s", phone_number, session.employee_id)
        return SessionInfo(phone_number=phone_number, is_valid=False)

    # Check IP binding
    if session.ip_address != ip_address:
        db.add(AuditLog(
            event=AuditEvent.IP_MISMATCH,
            phone_number=phone_number,
            employee_id=session.employee_id,
            ip_address=ip_address,
            detail=f"Expected IP={session.ip_address}, got IP={ip_address}",
        ))
        await db.commit()
        logger.warning(
            "IP mismatch: phone=%s emp=%s expected=%s got=%s",
            phone_number, session.employee_id, session.ip_address, ip_address,
        )
        return SessionInfo(
            phone_number=phone_number,
            employee_id=session.employee_id,
            is_valid=False,
        )

    return SessionInfo(
        phone_number=phone_number,
        employee_id=session.employee_id,
        role=session.role,
        ip_address=session.ip_address,
        expires_at=session.expires_at,
        is_valid=True,
    )


# ── Invalidate session (logout) ──────────────────────────────────

async def invalidate_session(
    db: AsyncSession,
    phone_number: str,
) -> bool:
    """
    Invalidate the active session for a phone number (logout).
    """
    result = await db.execute(
        select(ActiveSession)
        .where(
            ActiveSession.phone_number == phone_number,
            ActiveSession.is_active == True,
        )
    )
    session = result.scalar_one_or_none()

    if session is None:
        return False

    session.is_active = False
    db.add(AuditLog(
        event=AuditEvent.SESSION_LOGOUT,
        phone_number=phone_number,
        employee_id=session.employee_id,
        ip_address=session.ip_address,
        detail="User logged out",
    ))
    await db.commit()

    logger.info("Session invalidated: phone=%s emp=%s", phone_number, session.employee_id)
    return True


async def invalidate_sessions_for_phone(
    db: AsyncSession,
    phone_number: str,
    reason: str = "manual",
) -> int:
    """Invalidate ALL active sessions for a phone number."""
    result = await db.execute(
        update(ActiveSession)
        .where(
            ActiveSession.phone_number == phone_number,
            ActiveSession.is_active == True,
        )
        .values(is_active=False)
    )
    count = result.rowcount
    if count > 0:
        logger.info(
            "Invalidated %d session(s) for phone=%s reason=%s",
            count, phone_number, reason,
        )
    await db.commit()
    return count


# ── Refresh token rotation ────────────────────────────────────────

async def rotate_session_tokens(
    db: AsyncSession,
    phone_number: str,
    new_access_token: str,
    new_refresh_token: Optional[str],
    new_expires_in: int = SESSION_TIMEOUT_MINUTES * 60,
) -> bool:
    """
    Rotate tokens for an active session.
    Old token hashes are overwritten with new ones.
    """
    result = await db.execute(
        select(ActiveSession)
        .where(
            ActiveSession.phone_number == phone_number,
            ActiveSession.is_active == True,
        )
        .order_by(ActiveSession.created_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()

    if session is None:
        return False

    session.access_token_hash = hash_token(new_access_token)
    if new_refresh_token:
        session.refresh_token_hash = hash_token(new_refresh_token)
    session.expires_at = datetime.now(timezone.utc) + timedelta(seconds=new_expires_in)

    db.add(AuditLog(
        event=AuditEvent.TOKEN_REFRESH,
        phone_number=phone_number,
        employee_id=session.employee_id,
        ip_address=session.ip_address,
        detail=f"Tokens rotated, new expiry={session.expires_at.isoformat()}",
    ))
    await db.commit()

    logger.info("Tokens rotated: phone=%s emp=%s", phone_number, session.employee_id)
    return True


# ── Cleanup expired sessions ──────────────────────────────────────

async def cleanup_expired_sessions(db: AsyncSession) -> int:
    """Deactivate all expired sessions (run periodically)."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(ActiveSession)
        .where(
            ActiveSession.is_active == True,
            ActiveSession.expires_at <= now,
        )
        .values(is_active=False)
    )
    count = result.rowcount
    if count > 0:
        logger.info("Cleaned up %d expired sessions", count)
    await db.commit()
    return count
