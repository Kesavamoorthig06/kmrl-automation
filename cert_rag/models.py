"""
Data models — Pydantic schemas for pipeline data flow + SQLAlchemy ORM for PostgreSQL.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

# ═══════════════════════════════════════════════════════════════════
#  Pydantic schemas (pipeline objects, API contracts)
# ═══════════════════════════════════════════════════════════════════


class CertStatus(str, enum.Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    PENDING_REVIEW = "pending_review"
    FAILED = "failed"


class ExtractedParameter(BaseModel):
    """Single parameter extracted by the LLM."""
    param_id: str
    value: float
    unit: str


class LLMExtractionResult(BaseModel):
    """Strict output schema the LLM must return — nothing else."""
    train_id: str
    certificate_type: str
    parameters: List[ExtractedParameter]
    confidence: float = Field(ge=0.0, le=1.0)


class NormalizedParameter(BaseModel):
    """After unit conversion to registry standard."""
    param_id: str
    raw_value: float
    raw_unit: str
    value: float           # converted to registry unit
    unit: str              # registry standard unit


class ValidatedParameter(BaseModel):
    """After rule evaluation."""
    param_id: str
    value: float
    unit: str
    passed: bool
    criticality: str
    domain: str
    condition: str         # the pass_condition expression


class FitnessResult(BaseModel):
    """Computed fitness scores for a train."""
    train_id: str
    rolling_stock_score: float = Field(ge=0.0, le=1.0)
    signalling_score: float = Field(ge=0.0, le=1.0)
    safety_score: float = Field(ge=0.0, le=1.0)
    final_score: float = Field(ge=0.0, le=1.0)
    critical_fail_flag: bool
    parameter_count: int
    failed_parameters: List[str]
    updated_at: datetime


class DocumentMeta(BaseModel):
    """Metadata for an ingested certificate document."""
    document_id: str
    filename: str
    content_type: str
    train_id: Optional[str] = None
    caption: Optional[str] = None
    received_at: datetime
    status: CertStatus = CertStatus.PROCESSING
    file_path: str = ""


class PipelineResult(BaseModel):
    """Full pipeline output returned to caller."""
    document_id: str
    status: CertStatus
    train_id: Optional[str] = None
    extraction_confidence: Optional[float] = None
    parameters_extracted: int = 0
    parameters_passed: int = 0
    parameters_failed: int = 0
    fitness: Optional[FitnessResult] = None
    errors: List[str] = Field(default_factory=list)


# ═══════════════════════════════════════════════════════════════════
#  SQLAlchemy ORM models
# ═══════════════════════════════════════════════════════════════════

from sqlalchemy import (
    Column, String, Float, Boolean, DateTime, Integer, Text,
    Index, func,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class CertParameterRow(Base):
    """Persisted extracted + validated parameters."""
    __tablename__ = "cert_parameters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(64), nullable=False, index=True)
    train_id = Column(String(32), nullable=False, index=True)
    param_id = Column(String(16), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(16), nullable=False)
    passed = Column(Boolean, nullable=False)
    criticality = Column(String(16), nullable=False)
    domain = Column(String(32), nullable=False)
    confidence = Column(Float, nullable=False)
    source_file = Column(String(256), nullable=False)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_cert_params_train_param", "train_id", "param_id"),
    )


class TrainFitnessRow(Base):
    """Computed fitness scores — one row per train, upserted."""
    __tablename__ = "train_fitness"

    train_id = Column(String(32), primary_key=True)
    rolling_stock_score = Column(Float, nullable=False)
    signalling_score = Column(Float, nullable=False)
    safety_score = Column(Float, nullable=False)
    final_score = Column(Float, nullable=False)
    critical_fail_flag = Column(Boolean, nullable=False)
    parameter_count = Column(Integer, nullable=False, default=0)
    failed_parameters = Column(Text, nullable=False, default="")   # JSON array string
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class DocumentRow(Base):
    """Ingested document metadata."""
    __tablename__ = "cert_documents"

    document_id = Column(String(64), primary_key=True)
    filename = Column(String(256), nullable=False)
    content_type = Column(String(64), nullable=False)
    train_id = Column(String(32), nullable=True)
    caption = Column(Text, nullable=True)
    file_path = Column(String(512), nullable=False)
    status = Column(String(32), nullable=False, default="processing")
    extraction_confidence = Column(Float, nullable=True)
    parameters_extracted = Column(Integer, nullable=True)
    received_at = Column(DateTime, server_default=func.now())
    processed_at = Column(DateTime, nullable=True)
