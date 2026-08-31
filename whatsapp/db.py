"""
Database layer — SQLAlchemy models for sessions, job cards, cleaning slots, audit logs,
users (employee credentials), and pending phone-link tokens.

Uses async SQLAlchemy with PostgreSQL (AWS RDS) in production,
falls back to SQLite for local development.

Tables:
  users              — Employee credentials (password hash, role)
  active_sessions    — Authenticated session state, bound to phone + IP
  pending_links      — One-time tokens linking a WhatsApp phone to a browser login
  job_cards          — Ingested Maximo job-card data
  cleaning_slots     — Depot cleaning schedule slots
  audit_logs         — Immutable audit trail for security events
"""

from __future__ import annotations

import enum
import os
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    Index,
    Integer,
    String,
    Text,
    create_engine,
    func,
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from config import DATABASE_URL, DATABASE_URL_ASYNC


# ── Base ──────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ── Enums ─────────────────────────────────────────────────────────

class JobSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class JobStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class CleaningType(str, enum.Enum):
    LIGHT = "LIGHT"
    DEEP = "DEEP"


class AuditEvent(str, enum.Enum):
    AUTH_ATTEMPT = "auth_attempt"
    AUTH_SUCCESS = "auth_success"
    AUTH_FAIL = "auth_fail"
    IP_MISMATCH = "ip_mismatch"
    UPLOAD_START = "upload_start"
    UPLOAD_COMPLETE = "upload_complete"
    UPLOAD_REJECT = "upload_reject"
    SESSION_EXPIRED = "session_expired"
    SESSION_LOGOUT = "session_logout"
    TOKEN_REFRESH = "token_refresh"
    JOB_CARD_INGEST = "job_card_ingest"
    CLEANING_SLOT_INGEST = "cleaning_slot_ingest"
    PHONE_LINK_CREATED = "phone_link_created"
    PHONE_LINK_CONSUMED = "phone_link_consumed"
    PHONE_LINK_EXPIRED = "phone_link_expired"
    RAG_FORWARD_START = "rag_forward_start"
    RAG_FORWARD_COMPLETE = "rag_forward_complete"
    RAG_FORWARD_FAIL = "rag_forward_fail"


# ── Users (employee credentials) ─────────────────────────────────

class User(Base):
    """
    Employee credentials.

    password_hash stores bcrypt/argon2 output — never plaintext.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(20), nullable=False, unique=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False)
    password_hash = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Pending Phone Links ──────────────────────────────────────────

class PendingLink(Base):
    """
    One-time token that binds a WhatsApp phone number to a browser login session.

    Flow:
      1. WhatsApp user sends a message → bot creates a PendingLink row
      2. Bot replies with login URL containing the link_token
      3. User opens URL in browser, enters credentials
      4. Server verifies credentials, looks up PendingLink by token
      5. Server creates ActiveSession bound to the phone + IP
      6. Token is consumed (is_consumed = True)
    """
    __tablename__ = "pending_links"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(20), nullable=False, index=True)
    link_token = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_consumed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Active Sessions ───────────────────────────────────────────────

class ActiveSession(Base):
    """
    Tracks OAuth-authenticated sessions.

    Bound to phone_number + ip_address.
    Token is stored as a SHA-256 hash — never plaintext.
    """
    __tablename__ = "active_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(20), nullable=False, index=True)
    employee_id = Column(String(20), nullable=False, index=True)
    role = Column(String(30), nullable=False)
    access_token_hash = Column(String(64), nullable=False)
    refresh_token_hash = Column(String(64), nullable=True)
    ip_address = Column(String(45), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_session_phone_active", "phone_number", "is_active"),
    )

    @property
    def is_expired(self) -> bool:
        exp = self.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) >= exp


# ── Job Cards ─────────────────────────────────────────────────────

class JobCard(Base):
    """
    Ingested Maximo job-card records.

    Effects:
      CRITICAL + OPEN  → force train to IBL (inspection bay line)
      HIGH + OPEN      → reduce service priority in optimizer
    """
    __tablename__ = "job_cards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String(20), nullable=False, index=True)
    job_id = Column(String(40), nullable=False, unique=True, index=True)
    severity = Column(SAEnum(JobSeverity), nullable=False)
    status = Column(SAEnum(JobStatus), nullable=False)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    ingested_by = Column(String(20), nullable=True)

    __table_args__ = (
        Index("ix_job_train_status", "train_id", "status"),
        Index("ix_job_severity_status", "severity", "status"),
    )


# ── Cleaning Slots ────────────────────────────────────────────────

class CleaningSlot(Base):
    """
    Depot cleaning schedule slots.

    Effects:
      deep_clean due       → penalize service assignment
      cleaning scheduled   → avoid assignment conflict with slot window
    """
    __tablename__ = "cleaning_slots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String(20), nullable=False, index=True)
    cleaning_type = Column(SAEnum(CleaningType), nullable=False)
    slot_start = Column(DateTime(timezone=True), nullable=False)
    slot_end = Column(DateTime(timezone=True), nullable=False)
    assigned = Column(Boolean, default=False, nullable=False)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    ingested_by = Column(String(20), nullable=True)

    __table_args__ = (
        Index("ix_cleaning_train_type", "train_id", "cleaning_type"),
    )


# ── Audit Log ─────────────────────────────────────────────────────

class AuditLog(Base):
    """
    Immutable audit trail — every security-critical event is logged here.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event = Column(SAEnum(AuditEvent), nullable=False, index=True)
    phone_number = Column(String(20), nullable=True)
    employee_id = Column(String(20), nullable=True)
    ip_address = Column(String(45), nullable=True)
    detail = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_audit_event_ts", "event", "timestamp"),
    )


# ── Engine & session factory ──────────────────────────────────────

_async_engine = None
_async_session_factory = None

_sync_engine = None


def get_sync_engine():
    global _sync_engine
    if _sync_engine is None:
        _sync_engine = create_engine(DATABASE_URL, echo=False)
    return _sync_engine


def get_async_engine():
    global _async_engine
    if _async_engine is None:
        _async_engine = create_async_engine(DATABASE_URL_ASYNC, echo=False)
    return _async_engine


def get_async_session_factory() -> sessionmaker:
    global _async_session_factory
    if _async_session_factory is None:
        _async_session_factory = sessionmaker(
            get_async_engine(), class_=AsyncSession, expire_on_commit=False
        )
    return _async_session_factory


async def get_db() -> AsyncSession:
    """Dependency injector for FastAPI — yields an async session."""
    factory = get_async_session_factory()
    async with factory() as session:
        yield session


async def init_db():
    """Create all tables if they don't exist."""
    engine = get_async_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Dispose engine on shutdown."""
    global _async_engine
    if _async_engine:
        await _async_engine.dispose()
        _async_engine = None
