"""
WhatsApp Session-Auth Bridge — secure login-based session authentication.

Responsibilities:
  1. Generate one-time link tokens for WhatsApp phone numbers
  2. Verify employee credentials (password hash)
  3. Consume link tokens and create DB sessions bound to phone + IP
  4. Lookup / validate sessions by phone number
  5. Enforce: single active session per phone, expiry, reject without session

This replaces the Cognito OAuth PKCE flow with a simpler server-side
credential login that works with the existing React login page.
"""

from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from config import SESSION_TIMEOUT_MINUTES
from db import (
    ActiveSession,
    AuditEvent,
    AuditLog,
    PendingLink,
    User,
)

logger = logging.getLogger(__name__)

# ── Password hashing (bcrypt-like using hashlib for zero extra deps) ──

_SALT_PREFIX = "kmrl_v1$"


def hash_password(plain: str) -> str:
    """Hash a password with a random salt using SHA-256.

    Format: kmrl_v1$<salt_hex>$<hash_hex>
    """
    salt = secrets.token_hex(16)
    digest = hashlib.sha256(f"{_SALT_PREFIX}{salt}{plain}".encode()).hexdigest()
    return f"{_SALT_PREFIX}{salt}${digest}"


def verify_password(plain: str, stored_hash: str) -> bool:
    """Verify a plaintext password against the stored hash."""
    if not stored_hash.startswith(_SALT_PREFIX):
        return False
    parts = stored_hash.split("$")
    # Format: kmrl_v1 $ <salt> $ <hash>
    if len(parts) != 3:
        return False
    salt = parts[1]
    expected = hashlib.sha256(f"{_SALT_PREFIX}{salt}{plain}".encode()).hexdigest()
    return secrets.compare_digest(expected, parts[2])


# ── Link token generation ────────────────────────────────────────

LINK_TOKEN_EXPIRY_MINUTES = 5


async def create_link_token(
    db: AsyncSession,
    phone_number: str,
) -> str:
    """
    Generate a one-time link token for a WhatsApp phone number.

    Expires any previous unconsumed tokens for the same phone.
    Returns the new token string (URL-safe, 32 bytes).
    """
    # Expire old pending links for this phone
    await db.execute(
        update(PendingLink)
        .where(
            PendingLink.phone_number == phone_number,
            PendingLink.is_consumed == False,
        )
        .values(is_consumed=True)
    )

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=LINK_TOKEN_EXPIRY_MINUTES)

    link = PendingLink(
        phone_number=phone_number,
        link_token=token,
        expires_at=expires_at,
    )
    db.add(link)

    db.add(AuditLog(
        event=AuditEvent.PHONE_LINK_CREATED,
        phone_number=phone_number,
        detail=f"Link token created, expires={expires_at.isoformat()}",
    ))

    await db.commit()

    logger.info("Link token created: phone=%s expires=%s", phone_number, expires_at.isoformat())
    return token


# ── Credential verification ──────────────────────────────────────

async def verify_credentials(
    db: AsyncSession,
    employee_id: str,
    password: str,
) -> Optional[User]:
    """
    Verify employee credentials and return the User if valid.
    Returns None if employee not found or password mismatch.
    """
    result = await db.execute(
        select(User).where(
            User.employee_id == employee_id.strip().upper(),
            User.is_active == True,
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        logger.info("Credential check MISS: %s", employee_id)
        return None

    if not verify_password(password, user.password_hash):
        logger.info("Credential check FAIL (bad password): %s", employee_id)
        return None

    logger.info("Credential check OK: %s (%s)", employee_id, user.role)
    return user


# ── Consume link token + create session ──────────────────────────

async def consume_link_and_create_session(
    db: AsyncSession,
    link_token: str,
    employee_id: str,
    password: str,
    client_ip: str,
) -> dict:
    """
    Full login flow:
      1. Look up PendingLink by token
      2. Verify it hasn't expired / been consumed
      3. Verify employee credentials
      4. Invalidate any existing sessions for that phone
      5. Create new ActiveSession bound to phone + IP
      6. Mark link token as consumed

    Returns dict with {success, phone_number, employee_id, role, name, error?}
    """
    # 1. Look up link
    result = await db.execute(
        select(PendingLink).where(
            PendingLink.link_token == link_token,
            PendingLink.is_consumed == False,
        )
    )
    link = result.scalar_one_or_none()

    if link is None:
        db.add(AuditLog(
            event=AuditEvent.AUTH_FAIL,
            ip_address=client_ip,
            detail="Invalid or already-consumed link token",
        ))
        await db.commit()
        return {"success": False, "error": "Invalid or expired link token"}

    # 2. Check expiry
    link_expires = link.expires_at
    if link_expires.tzinfo is None:
        link_expires = link_expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) >= link_expires:
        link.is_consumed = True
        db.add(AuditLog(
            event=AuditEvent.PHONE_LINK_EXPIRED,
            phone_number=link.phone_number,
            ip_address=client_ip,
            detail="Link token expired during login attempt",
        ))
        await db.commit()
        return {"success": False, "error": "Link token has expired. Send a message in WhatsApp to get a new one."}

    phone_number = link.phone_number

    # 3. Verify credentials
    user = await verify_credentials(db, employee_id, password)
    if user is None:
        db.add(AuditLog(
            event=AuditEvent.AUTH_FAIL,
            phone_number=phone_number,
            employee_id=employee_id,
            ip_address=client_ip,
            detail="Bad credentials during link-token login",
        ))
        await db.commit()
        return {"success": False, "error": "Invalid Employee ID or password"}

    # 4. Invalidate existing sessions for this phone
    await db.execute(
        update(ActiveSession)
        .where(
            ActiveSession.phone_number == phone_number,
            ActiveSession.is_active == True,
        )
        .values(is_active=False)
    )

    # 5. Create new session
    token_hash = hashlib.sha256(secrets.token_bytes(32)).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=SESSION_TIMEOUT_MINUTES)

    session = ActiveSession(
        phone_number=phone_number,
        employee_id=user.employee_id,
        role=user.role,
        access_token_hash=token_hash,
        refresh_token_hash=None,
        ip_address=client_ip,
        expires_at=expires_at,
        is_active=True,
    )
    db.add(session)

    # 6. Consume link
    link.is_consumed = True

    db.add(AuditLog(
        event=AuditEvent.PHONE_LINK_CONSUMED,
        phone_number=phone_number,
        employee_id=user.employee_id,
        ip_address=client_ip,
        detail=f"Login successful, session expires={expires_at.isoformat()}",
    ))
    db.add(AuditLog(
        event=AuditEvent.AUTH_SUCCESS,
        phone_number=phone_number,
        employee_id=user.employee_id,
        ip_address=client_ip,
        detail=f"Session created via link-token login, role={user.role}",
    ))

    await db.commit()

    logger.info(
        "Session created via link-token: phone=%s emp=%s role=%s ip=%s",
        phone_number, user.employee_id, user.role, client_ip,
    )

    return {
        "success": True,
        "phone_number": phone_number,
        "employee_id": user.employee_id,
        "role": user.role,
        "name": user.name,
        "expires_at": expires_at.isoformat(),
    }


# ── Session lookup by phone ──────────────────────────────────────

async def get_active_session(
    db: AsyncSession,
    phone_number: str,
) -> Optional[ActiveSession]:
    """
    Get the active (non-expired) session for a phone number.
    Auto-expires sessions that are past their expiry time.
    Returns None if no valid session.
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
        return None

    if session.is_expired:
        session.is_active = False
        db.add(AuditLog(
            event=AuditEvent.SESSION_EXPIRED,
            phone_number=phone_number,
            employee_id=session.employee_id,
        ))
        await db.commit()
        return None

    return session


# ── Invalidate session (logout) ──────────────────────────────────

async def logout_phone(
    db: AsyncSession,
    phone_number: str,
) -> bool:
    """Invalidate the active session for a phone number."""
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
        detail="User logged out",
    ))
    await db.commit()
    logger.info("Session logged out: phone=%s emp=%s", phone_number, session.employee_id)
    return True


# ── Seed users (for initial setup) ───────────────────────────────

async def seed_default_users(db: AsyncSession) -> int:
    """
    Create default employee users if the users table is empty.
    Returns the number of users created.
    """
    result = await db.execute(select(User).limit(1))
    if result.scalar_one_or_none() is not None:
        return 0  # Already seeded

    default_users = [
        ("KMRL-1001", "Rajesh Kumar",      "MAINTENANCE",  "kmrl1001"),
        ("KMRL-1002", "Anitha Nair",       "MAINTENANCE",  "kmrl1002"),
        ("KMRL-1003", "Suresh Menon",      "MAINTENANCE",  "kmrl1003"),
        ("KMRL-2001", "Priya Sharma",      "SIGNALLING",   "kmrl2001"),
        ("KMRL-2002", "Deepak Pillai",     "SIGNALLING",   "kmrl2002"),
        ("KMRL-3001", "Lakshmi Devi",      "SAFETY",       "kmrl3001"),
        ("KMRL-3002", "Arun George",       "SAFETY",       "kmrl3002"),
        ("KMRL-4001", "Meera Krishnan",    "MARKETING",    "kmrl4001"),
        ("KMRL-4002", "Vishnu Prasad",     "MARKETING",    "kmrl4002"),
        ("KMRL-4003", "Sneha Thomas",      "MARKETING",    "kmrl4003"),
        # Admin / Operations staff
        ("KMRL-9001", "Operations Admin",  "ADMIN",        "admin9001"),
        ("KMRL-9002", "Control Room",      "ADMIN",        "admin9002"),
        ("EMP001",    "Test Maintenance",   "MAINTENANCE",  "password"),
        ("EMP002",    "Test Signalling",    "SIGNALLING",   "password"),
        ("EMP003",    "Test Safety",        "SAFETY",       "password"),
        ("EMP004",    "Test Marketing",     "MARKETING",    "password"),
        ("EMP005",    "Test Admin",         "ADMIN",        "password"),
    ]

    count = 0
    for emp_id, name, role, pwd in default_users:
        db.add(User(
            employee_id=emp_id,
            name=name,
            role=role,
            password_hash=hash_password(pwd),
        ))
        count += 1

    await db.commit()
    logger.info("Seeded %d default users into users table", count)
    return count
