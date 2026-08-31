"""
FastAPI application — Certificate Ingestion RAG module.

Endpoints:
  POST /webhook/document      — upload certificate file
  GET  /fitness/{train_id}    — latest computed fitness
  GET  /fitness               — all train fitness (ML nightly export)
  GET  /parameters/{train_id} — latest extracted parameters
  GET  /health                — service health check
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import API_HOST, API_PORT
import db
from pipeline import process_certificate

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-28s  %(levelname)-5s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan — init DB on startup ────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initialising database tables …")
    try:
        await db.init_db()
        logger.info("Database ready")
    except Exception as e:
        logger.warning(f"Database init failed (will retry on first request): {e}")
    yield


app = FastAPI(
    title="Certificate Ingestion RAG",
    description=(
        "Accepts railway certification documents, extracts structured "
        "engineering parameters using RAG + LLM, validates against safety "
        "thresholds, computes fitness scores, and exposes results to the ML engine."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════
#  POST /webhook/document — receive certificate upload
# ══════════════════════════════════════════════════════════════════

@app.post("/webhook/document")
async def webhook_document(
    file: UploadFile = File(...),
    train_id: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
):
    """
    Receives a certificate document file upload.

    Form fields:
      - file:     the certificate file (PDF, image, text)
      - train_id: (optional) train identifier hint
      - caption:  (optional) description / metadata
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    content_type = file.content_type or "application/octet-stream"
    filename = file.filename or "unknown"

    logger.info(
        f"Webhook received: {filename} ({len(content)} bytes, {content_type})"
    )

    result = await process_certificate(
        filename=filename,
        content=content,
        content_type=content_type,
        train_id_hint=train_id,
        caption=caption,
    )

    status_code = 200 if result.status.value == "completed" else 202
    return JSONResponse(
        status_code=status_code,
        content=result.model_dump(mode="json"),
    )


# ══════════════════════════════════════════════════════════════════
#  GET /fitness/{train_id} — latest fitness for one train
# ══════════════════════════════════════════════════════════════════

@app.get("/fitness/{train_id}")
async def get_fitness(train_id: str):
    """Returns the latest computed fitness scores for a train."""
    fitness = await db.get_fitness(train_id.upper())
    if not fitness:
        raise HTTPException(status_code=404, detail=f"No fitness data for {train_id}")
    return fitness


# ══════════════════════════════════════════════════════════════════
#  GET /fitness — all train fitness (ML nightly export)
# ══════════════════════════════════════════════════════════════════

@app.get("/fitness")
async def get_all_fitness():
    """
    Returns fitness data for all trains.
    Used by the ML planning engine for nightly feature export.

    ML integration contract:
      rolling_stock_score, signalling_score, safety_score,
      final_score, critical_fail_flag
    """
    rows = await db.get_all_fitness()
    return {"count": len(rows), "trains": rows}


# ══════════════════════════════════════════════════════════════════
#  GET /parameters/{train_id} — latest extracted parameters
# ══════════════════════════════════════════════════════════════════

@app.get("/parameters/{train_id}")
async def get_parameters(train_id: str):
    """Return the most recent parameter values for a train."""
    rows = await db.get_latest_parameters(train_id.upper())
    if not rows:
        raise HTTPException(status_code=404, detail=f"No parameters for {train_id}")
    return {
        "train_id": train_id.upper(),
        "count": len(rows),
        "parameters": [
            {
                "param_id":    r.param_id,
                "value":       r.value,
                "unit":        r.unit,
                "passed":      r.passed,
                "criticality": r.criticality,
                "domain":      r.domain,
                "confidence":  r.confidence,
                "source_file": r.source_file,
                "timestamp":   r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in rows
        ],
    }


# ══════════════════════════════════════════════════════════════════
#  GET /health
# ══════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "certificate_ingestion_rag",
        "version": "1.0.0",
    }


# ══════════════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    uvicorn.run("api:app", host=API_HOST, port=API_PORT, reload=False)
