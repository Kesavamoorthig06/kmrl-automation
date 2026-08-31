"""
Configuration — WhatsApp Bot via Twilio.

Environment variables (set these in .env or export):
  TWILIO_ACCOUNT_SID    — Twilio Account SID
  TWILIO_AUTH_TOKEN     — Twilio Auth Token
  TWILIO_WHATSAPP_FROM  — Twilio sandbox number, e.g. whatsapp:+14155238886
  CERT_RAG_BASE_URL     — Certificate RAG API base URL
  DEPOT_BASE_URL        — Depot State API base URL
  WHATSAPP_API_PORT     — Port for this service (default 8300)

  # ── OAuth / AWS Cognito ────────────────────────────────────────
  COGNITO_DOMAIN        — Cognito hosted UI domain (e.g. myapp.auth.ap-south-1.amazoncognito.com)
  COGNITO_CLIENT_ID     — App client ID
  COGNITO_CLIENT_SECRET — App client secret (optional for public clients)
  COGNITO_REDIRECT_URI  — OAuth callback URL
  COGNITO_USER_POOL_ID  — Cognito User Pool ID
  COGNITO_JWKS_URL      — JWKS endpoint for JWT verification
  SESSION_TIMEOUT_MINUTES — Session timeout (default 20)

  # ── Database ────────────────────────────────────────────────────
  DATABASE_URL           — Sync SQLAlchemy URL (postgresql://...)
  DATABASE_URL_ASYNC     — Async SQLAlchemy URL (postgresql+asyncpg://...)

  # ── AWS ─────────────────────────────────────────────────────────
  AWS_REGION             — AWS region (default ap-south-1)
  S3_BUCKET_NAME         — S3 bucket for document storage
  S3_BUCKET_PREFIX       — Optional key prefix inside bucket

  # ── Twilio IP allowlist ─────────────────────────────────────────
  TWILIO_IP_ALLOWLIST    — Comma-separated Twilio IPs (for API Gateway)
"""

from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

# ── Twilio credentials ───────────────────────────────────────────
TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM: str = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

# ── Internal service URLs ────────────────────────────────────────
CERT_RAG_BASE_URL: str = os.getenv("CERT_RAG_BASE_URL", "http://localhost:8200")
DEPOT_BASE_URL: str = os.getenv("DEPOT_BASE_URL", "http://localhost:8100")

# ── This service ─────────────────────────────────────────────────
API_HOST: str = os.getenv("WHATSAPP_API_HOST", "0.0.0.0")
API_PORT: int = int(os.getenv("WHATSAPP_API_PORT", "8300"))

# ── OAuth / AWS Cognito ──────────────────────────────────────────
COGNITO_DOMAIN: str = os.getenv("COGNITO_DOMAIN", "")
COGNITO_CLIENT_ID: str = os.getenv("COGNITO_CLIENT_ID", "")
COGNITO_CLIENT_SECRET: str = os.getenv("COGNITO_CLIENT_SECRET", "")
COGNITO_REDIRECT_URI: str = os.getenv("COGNITO_REDIRECT_URI", "http://localhost:8300/auth/callback")
COGNITO_USER_POOL_ID: str = os.getenv("COGNITO_USER_POOL_ID", "")
COGNITO_JWKS_URL: str = os.getenv("COGNITO_JWKS_URL", "")
SESSION_TIMEOUT_MINUTES: int = int(os.getenv("SESSION_TIMEOUT_MINUTES", "20"))

# ── Database ──────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "sqlite:///./whatsapp_bot.db",
)
DATABASE_URL_ASYNC: str = os.getenv(
    "DATABASE_URL_ASYNC",
    "sqlite+aiosqlite:///./whatsapp_bot.db",
)

# ── AWS ───────────────────────────────────────────────────────────
AWS_REGION: str = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "kmrl-document-store")
S3_BUCKET_PREFIX: str = os.getenv("S3_BUCKET_PREFIX", "")

# ── Twilio IP allowlist (for API Gateway / middleware) ────────────
TWILIO_IP_ALLOWLIST: list[str] = [
    ip.strip()
    for ip in os.getenv("TWILIO_IP_ALLOWLIST", "").split(",")
    if ip.strip()
]

# ── Misc ─────────────────────────────────────────────────────────
MAX_REPLY_LENGTH: int = 1600          # WhatsApp message limit
SUPPORTED_DOC_TYPES: set[str] = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/tiff",
    "text/plain",
}

# ── RAG Processing Server ────────────────────────────────────────
RAG_PROCESS_URL: str = os.getenv("RAG_PROCESS_URL", "http://localhost:9000/process")
RAG_TIMEOUT_SECONDS: int = int(os.getenv("RAG_TIMEOUT_SECONDS", "120"))

# ── Public host for login URLs sent via WhatsApp ─────────────────
PUBLIC_HOST: str = os.getenv("PUBLIC_HOST", "")

# ── React app login URL (for bridge auth redirect) ──────────────
# Set to the Netlify / Vite dev-server URL where the React app is hosted.
# The bridge GET /auth/bridge/login will redirect here with ?token=...
REACT_LOGIN_URL: str = os.getenv("REACT_LOGIN_URL", "")
