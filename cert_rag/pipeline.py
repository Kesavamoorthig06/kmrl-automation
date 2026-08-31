"""
Pipeline orchestrator — runs the full certificate ingestion pipeline.

Steps:
  1. receive_document     → store raw file, get document_id
  2. text_extraction      → OCR / PDF parse → plain text
  3. rag_context_fetch    → retrieve relevant parameters from registry
  4. llm_structured_extraction → map text to parameter values (strict JSON)
  5. schema_validation    → reject if schema mismatch
  6. parameter_normalization → convert units to registry standard
  7. rule_validation      → evaluate pass_condition from registry
  8. fitness_scoring      → compute domain + final scores
  9. persist_results      → write to PostgreSQL

Idempotent:  re-processing the same document overwrites previous results.
Replayable:  original files stored; pipeline can re-run from step 2.
Stateless LLM: each call is independent, no conversation history.
"""

from __future__ import annotations

import logging
from typing import Optional

from config import CONFIDENCE_THRESHOLD, MIN_PARAMETERS_REQUIRED
from models import (
    CertStatus,
    DocumentMeta,
    PipelineResult,
)
from document_store import store_document
from text_extractor import extract_text
from rag_retriever import ParameterRetriever
from llm_extractor import extract_parameters
from schema_validator import SchemaValidator
from unit_normalizer import UnitNormalizer
from rule_validator import RuleValidator
from fitness_scorer import compute_fitness
import db

logger = logging.getLogger(__name__)

# ── Singleton pipeline components (initialised once) ─────────────
_retriever: Optional[ParameterRetriever] = None
_schema_validator: Optional[SchemaValidator] = None
_normalizer: Optional[UnitNormalizer] = None
_rule_validator: Optional[RuleValidator] = None


def _init_components():
    """Lazy-initialise heavy pipeline components."""
    global _retriever, _schema_validator, _normalizer, _rule_validator
    if _retriever is None:
        _retriever = ParameterRetriever()
    if _schema_validator is None:
        _schema_validator = SchemaValidator()
    if _normalizer is None:
        _normalizer = UnitNormalizer()
    if _rule_validator is None:
        _rule_validator = RuleValidator()


async def process_certificate(
    filename: str,
    content: bytes,
    content_type: str,
    train_id_hint: Optional[str] = None,
    caption: Optional[str] = None,
) -> PipelineResult:
    """
    Full pipeline: file → text → RAG → LLM → validate → normalise → score → persist.

    Returns PipelineResult with status, scores, and any errors.
    """
    _init_components()
    errors = []

    # ── Step 1: receive_document ──────────────────────────────────
    meta: DocumentMeta = store_document(
        filename=filename,
        content=content,
        content_type=content_type,
        train_id=train_id_hint,
        caption=caption,
    )
    logger.info(f"[{meta.document_id}] Step 1/9: Document stored → {meta.file_path}")

    try:
        await db.insert_document(meta)
    except Exception as e:
        logger.warning(f"[{meta.document_id}] DB insert_document failed (non-fatal): {e}")

    # ── Step 2: text_extraction ───────────────────────────────────
    try:
        plain_text = extract_text(meta.file_path, meta.content_type)
        logger.info(f"[{meta.document_id}] Step 2/9: Extracted {len(plain_text)} chars")
    except Exception as e:
        logger.error(f"[{meta.document_id}] Text extraction failed: {e}")
        return _fail(meta.document_id, f"Text extraction failed: {e}")

    if len(plain_text.strip()) < 10:
        return _fail(meta.document_id, "Extracted text too short — likely empty document")

    # ── Step 3: rag_context_fetch ─────────────────────────────────
    try:
        candidates = _retriever.retrieve(plain_text)
        logger.info(
            f"[{meta.document_id}] Step 3/9: RAG returned {len(candidates)} candidates "
            f"(top sim={candidates[0]['similarity']:.3f})" if candidates else ""
        )
    except Exception as e:
        logger.error(f"[{meta.document_id}] RAG retrieval failed: {e}")
        return _fail(meta.document_id, f"RAG retrieval failed: {e}")

    # ── Step 4: llm_structured_extraction ─────────────────────────
    try:
        llm_result = await extract_parameters(
            text=plain_text,
            candidates=candidates,
            train_id_hint=train_id_hint,
        )
        logger.info(
            f"[{meta.document_id}] Step 4/9: LLM extracted "
            f"{len(llm_result.parameters)} params (conf={llm_result.confidence:.2f})"
        )
    except Exception as e:
        logger.error(f"[{meta.document_id}] LLM extraction failed: {e}")
        return _fail(meta.document_id, f"LLM extraction failed: {e}")

    # ── Step 5: schema_validation ─────────────────────────────────
    try:
        validated_extraction = _schema_validator.validate(llm_result)
        logger.info(
            f"[{meta.document_id}] Step 5/9: Schema valid — "
            f"{len(validated_extraction.parameters)} params kept"
        )
    except ValueError as e:
        logger.error(f"[{meta.document_id}] Schema validation failed: {e}")
        return _fail(meta.document_id, f"Schema validation failed: {e}")

    train_id = validated_extraction.train_id
    confidence = validated_extraction.confidence

    # Confidence gate
    if confidence < CONFIDENCE_THRESHOLD:
        logger.warning(
            f"[{meta.document_id}] Confidence {confidence:.2f} < {CONFIDENCE_THRESHOLD} "
            f"→ pending_review"
        )
        await _update_doc_status(
            meta.document_id, CertStatus.PENDING_REVIEW, train_id, confidence,
            len(validated_extraction.parameters),
        )
        return PipelineResult(
            document_id=meta.document_id,
            status=CertStatus.PENDING_REVIEW,
            train_id=train_id,
            extraction_confidence=confidence,
            parameters_extracted=len(validated_extraction.parameters),
            errors=["Low extraction confidence — marked for manual review"],
        )

    if len(validated_extraction.parameters) < MIN_PARAMETERS_REQUIRED:
        return _fail(meta.document_id, "Too few valid parameters extracted")

    # ── Step 6: parameter_normalization ───────────────────────────
    normalized = _normalizer.normalize(validated_extraction.parameters)
    logger.info(f"[{meta.document_id}] Step 6/9: Normalized {len(normalized)} params")

    # ── Step 7: rule_validation ───────────────────────────────────
    validated_params = _rule_validator.validate(normalized)
    passed = sum(1 for v in validated_params if v.passed)
    failed = sum(1 for v in validated_params if not v.passed)
    logger.info(
        f"[{meta.document_id}] Step 7/9: Rules — {passed} passed, {failed} failed"
    )

    # ── Step 8: fitness_scoring ───────────────────────────────────
    fitness = compute_fitness(train_id, validated_params)
    logger.info(
        f"[{meta.document_id}] Step 8/9: Fitness "
        f"final={fitness.final_score:.2f} critical_fail={fitness.critical_fail_flag}"
    )

    # ── Step 9: persist_results ───────────────────────────────────
    try:
        await db.insert_parameters(
            document_id=meta.document_id,
            train_id=train_id,
            source_file=meta.filename,
            confidence=confidence,
            validated=validated_params,
        )
        await db.upsert_fitness(fitness)
        await _update_doc_status(
            meta.document_id, CertStatus.COMPLETED, train_id, confidence,
            len(validated_params),
        )
        logger.info(f"[{meta.document_id}] Step 9/9: Persisted to PostgreSQL")
    except Exception as e:
        logger.error(f"[{meta.document_id}] DB persist failed: {e}")
        errors.append(f"DB persist failed: {e}")

    return PipelineResult(
        document_id=meta.document_id,
        status=CertStatus.COMPLETED,
        train_id=train_id,
        extraction_confidence=confidence,
        parameters_extracted=len(validated_params),
        parameters_passed=passed,
        parameters_failed=failed,
        fitness=fitness,
        errors=errors,
    )


# ── Replay endpoint — re-process from stored document ────────────

async def replay_document(document_id: str, file_path: str, content_type: str) -> PipelineResult:
    """
    Re-run the pipeline from step 2 onward using a stored raw document.
    Used for replayability requirement.
    """
    from pathlib import Path
    p = Path(file_path)
    return await process_certificate(
        filename=p.name,
        content=p.read_bytes(),
        content_type=content_type,
    )


# ── Helpers ───────────────────────────────────────────────────────

async def _update_doc_status(doc_id, status, train_id, confidence, params_extracted):
    try:
        await db.update_document_status(
            doc_id, status.value, train_id, confidence, params_extracted,
        )
    except Exception as e:
        logger.warning(f"update_document_status failed (non-fatal): {e}")


def _fail(document_id: str, error: str) -> PipelineResult:
    return PipelineResult(
        document_id=document_id,
        status=CertStatus.FAILED,
        errors=[error],
    )
