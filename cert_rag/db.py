"""
Async PostgreSQL database layer.

Handles connection pool, table creation, and CRUD for
cert_parameters, train_fitness, cert_documents.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Optional, List

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.dialects.postgresql import insert as pg_insert

from config import DATABASE_URL
from models import (
    Base,
    CertParameterRow,
    TrainFitnessRow,
    DocumentRow,
    FitnessResult,
    ValidatedParameter,
    DocumentMeta,
)

# ── Engine & session factory ─────────────────────────────────────

_engine = create_async_engine(DATABASE_URL, echo=False, pool_size=5)
_session_factory = async_sessionmaker(_engine, expire_on_commit=False)


async def init_db():
    """Create all tables if they don't exist."""
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    return _session_factory()


# ── Document CRUD ────────────────────────────────────────────────

async def insert_document(meta: DocumentMeta) -> None:
    async with _session_factory() as session:
        row = DocumentRow(
            document_id=meta.document_id,
            filename=meta.filename,
            content_type=meta.content_type,
            train_id=meta.train_id,
            caption=meta.caption,
            file_path=meta.file_path,
            status=meta.status.value,
            received_at=meta.received_at,
        )
        session.add(row)
        await session.commit()


async def update_document_status(
    document_id: str,
    status: str,
    train_id: Optional[str] = None,
    confidence: Optional[float] = None,
    params_extracted: Optional[int] = None,
) -> None:
    async with _session_factory() as session:
        result = await session.execute(
            select(DocumentRow).where(DocumentRow.document_id == document_id)
        )
        row = result.scalar_one_or_none()
        if row:
            row.status = status
            row.processed_at = datetime.utcnow()
            if train_id:
                row.train_id = train_id
            if confidence is not None:
                row.extraction_confidence = confidence
            if params_extracted is not None:
                row.parameters_extracted = params_extracted
            await session.commit()


# ── Cert parameters CRUD ────────────────────────────────────────

async def insert_parameters(
    document_id: str,
    train_id: str,
    source_file: str,
    confidence: float,
    validated: List[ValidatedParameter],
) -> None:
    """Bulk insert validated parameters. Idempotent — deletes existing rows for this document first."""
    async with _session_factory() as session:
        # Idempotent: remove any previous extract for this document
        await session.execute(
            text("DELETE FROM cert_parameters WHERE document_id = :did"),
            {"did": document_id},
        )
        for v in validated:
            row = CertParameterRow(
                document_id=document_id,
                train_id=train_id,
                param_id=v.param_id,
                value=v.value,
                unit=v.unit,
                passed=v.passed,
                criticality=v.criticality,
                domain=v.domain,
                confidence=confidence,
                source_file=source_file,
            )
            session.add(row)
        await session.commit()


async def get_latest_parameters(train_id: str) -> List[CertParameterRow]:
    """Return the most recent parameter values for a train, one row per param_id."""
    async with _session_factory() as session:
        # Sub-query: latest timestamp per (train_id, param_id)
        sub = (
            select(
                CertParameterRow.param_id,
                CertParameterRow.timestamp.label("max_ts"),
            )
            .where(CertParameterRow.train_id == train_id)
            .group_by(CertParameterRow.param_id)
            .subquery()
        )
        stmt = (
            select(CertParameterRow)
            .join(sub, (CertParameterRow.param_id == sub.c.param_id) &
                       (CertParameterRow.timestamp == sub.c.max_ts))
            .where(CertParameterRow.train_id == train_id)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())


# ── Train fitness CRUD ───────────────────────────────────────────

async def upsert_fitness(fitness: FitnessResult) -> None:
    """Insert or update the fitness row for a train (idempotent)."""
    async with _session_factory() as session:
        stmt = pg_insert(TrainFitnessRow).values(
            train_id=fitness.train_id,
            rolling_stock_score=fitness.rolling_stock_score,
            signalling_score=fitness.signalling_score,
            safety_score=fitness.safety_score,
            final_score=fitness.final_score,
            critical_fail_flag=fitness.critical_fail_flag,
            parameter_count=fitness.parameter_count,
            failed_parameters=json.dumps(fitness.failed_parameters),
            updated_at=fitness.updated_at,
        ).on_conflict_do_update(
            index_elements=["train_id"],
            set_={
                "rolling_stock_score":  fitness.rolling_stock_score,
                "signalling_score":     fitness.signalling_score,
                "safety_score":         fitness.safety_score,
                "final_score":          fitness.final_score,
                "critical_fail_flag":   fitness.critical_fail_flag,
                "parameter_count":      fitness.parameter_count,
                "failed_parameters":    json.dumps(fitness.failed_parameters),
                "updated_at":           fitness.updated_at,
            },
        )
        await session.execute(stmt)
        await session.commit()


async def get_fitness(train_id: str) -> Optional[dict]:
    """Return fitness dict for a train, or None."""
    async with _session_factory() as session:
        result = await session.execute(
            select(TrainFitnessRow).where(TrainFitnessRow.train_id == train_id)
        )
        row = result.scalar_one_or_none()
        if not row:
            return None
        return {
            "train_id":            row.train_id,
            "rolling_stock_score": row.rolling_stock_score,
            "signalling_score":    row.signalling_score,
            "safety_score":        row.safety_score,
            "final_score":         row.final_score,
            "critical_fail_flag":  row.critical_fail_flag,
            "parameter_count":     row.parameter_count,
            "failed_parameters":   json.loads(row.failed_parameters) if row.failed_parameters else [],
            "updated_at":          row.updated_at.isoformat() if row.updated_at else None,
        }


async def get_all_fitness() -> List[dict]:
    """Return all train fitness rows — used by ML nightly export."""
    async with _session_factory() as session:
        result = await session.execute(select(TrainFitnessRow))
        rows = result.scalars().all()
        return [
            {
                "train_id":            r.train_id,
                "rolling_stock_score": r.rolling_stock_score,
                "signalling_score":    r.signalling_score,
                "safety_score":        r.safety_score,
                "final_score":         r.final_score,
                "critical_fail_flag":  r.critical_fail_flag,
                "updated_at":          r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in rows
        ]
