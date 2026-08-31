"""
Central configuration for the Certificate Ingestion RAG module.
All paths, DB connection, LLM settings, thresholds.
"""

import json
import os
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
CONFIG_DIR = BASE_DIR / "config"
PARAMETER_REGISTRY_PATH = CONFIG_DIR / "parameter_registry.json"

# Raw document object storage
RAW_CERT_DIR = BASE_DIR / "object_storage" / "raw_certificates"
RAW_CERT_DIR.mkdir(parents=True, exist_ok=True)

# ── Database ─────────────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "CERT_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/kmrl_certs",
)

# Synchronous URL for migrations / one-off scripts
DATABASE_URL_SYNC = DATABASE_URL.replace("+asyncpg", "").replace(
    "postgresql://", "postgresql+psycopg2://"
) if "+asyncpg" in DATABASE_URL else DATABASE_URL

# ── LLM ──────────────────────────────────────────────────────────
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")          # openai | azure | local
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_TEMPERATURE = 0.0        # deterministic extraction
LLM_MAX_TOKENS = 2048
LLM_TIMEOUT = 30              # seconds

# Azure-specific
AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_API_VERSION = os.getenv("AZURE_API_VERSION", "2024-08-01-preview")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT", "gpt-4o-mini")

# ── Embeddings ───────────────────────────────────────────────────
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
EMBEDDING_DIM = 384            # dimension for all-MiniLM-L6-v2
RAG_TOP_K = 10                 # candidate parameters per extraction

# ── Thresholds ───────────────────────────────────────────────────
CONFIDENCE_THRESHOLD = 0.7     # below this → pending_review
MIN_PARAMETERS_REQUIRED = 1    # at least 1 valid param per certificate

# ── Fitness scoring weights (per domain) ─────────────────────────
DOMAIN_WEIGHTS = {
    "rolling_stock": 0.40,
    "signalling":    0.30,
    "safety":        0.30,
}

# Criticality multipliers within each domain
CRITICALITY_WEIGHTS = {
    "critical": 3.0,
    "high":     2.0,
    "medium":   1.0,
    "low":      0.5,
}

# ── API ──────────────────────────────────────────────────────────
API_HOST = "0.0.0.0"
API_PORT = 8200


# ── Registry loader ─────────────────────────────────────────────
def load_parameter_registry() -> dict:
    """Load and index the parameter registry by param_id."""
    with open(PARAMETER_REGISTRY_PATH) as f:
        data = json.load(f)
    return {p["param_id"]: p for p in data["parameters"]}


def load_parameter_list() -> list:
    """Load the parameter registry as a flat list."""
    with open(PARAMETER_REGISTRY_PATH) as f:
        data = json.load(f)
    return data["parameters"]
