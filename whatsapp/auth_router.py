"""
Auth API Router — FastAPI endpoints for OAuth2 authentication and data ingestion.

Endpoints:
  POST /auth/login           — Initiate OAuth login, returns auth URL
  GET  /auth/callback        — OAuth callback (receives code from Cognito)
  POST /auth/introspect      — Server-to-server token introspection
  POST /auth/logout          — Invalidate session
  POST /ingest/job-cards     — Upload job card CSV/JSON
  POST /ingest/cleaning-slots — Upload cleaning slot CSV/JSON
  GET  /features/job-cards    — ML features: open critical/high jobs per train
  GET  /features/cleaning     — ML features: cleaning due/conflict per train
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, Query, Request, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse

from sqlalchemy.ext.asyncio import AsyncSession

from auth import (
    create_auth_request,
    exchange_code_for_tokens,
    get_pending_auth,
    hash_token,
    introspect_token,
)
from audit_logger import (
    log_auth_attempt,
    log_auth_success,
    log_auth_fail,
    log_upload_reject,
    log_upload_start,
    log_upload_complete,
)
from db import get_db
from session_manager import (
    SessionInfo,
    create_session,
    validate_session,
    invalidate_session,
)
from job_card_ingestion import (
    parse_job_cards_csv,
    parse_job_cards_json,
    ingest_job_cards,
    get_all_trains_job_features,
)
from cleaning_ingestion import (
    parse_cleaning_slots_csv,
    parse_cleaning_slots_json,
    ingest_cleaning_slots,
    get_all_trains_cleaning_features,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Helper: extract client IP ────────────────────────────────────

def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, respecting X-Forwarded-For."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── Helper: require valid session ─────────────────────────────────

async def require_session(
    request: Request,
    phone_number: str = Header(..., alias="X-Phone-Number"),
    db: AsyncSession = Depends(get_db),
) -> SessionInfo:
    """
    Dependency that validates the caller has an active session.
    Raises 401 if not authenticated.
    """
    ip = _get_client_ip(request)
    session = await validate_session(db, phone_number, ip)
    if not session.is_valid:
        await log_upload_reject(db, phone_number, ip, "No valid session")
        raise JSONResponse(
            status_code=401,
            content={"error": "Authentication required", "detail": "No valid session found"},
        )
    return session


# ═════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═════════════════════════════════════════════════════════════════

@router.post("/auth/login")
async def auth_login(
    request: Request,
    phone_number: str = Query(..., description="User's WhatsApp phone number"),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate OAuth2 login with PKCE.

    Returns an authorization URL that the user opens in their browser.
    """
    ip = _get_client_ip(request)
    await log_auth_attempt(db, phone_number, ip)

    auth_url, state = create_auth_request(phone_number, ip)

    return {
        "auth_url": auth_url,
        "state": state,
        "message": "Open the URL in your browser to authenticate",
        "expires_in_seconds": 300,
    }


@router.get("/auth/callback")
async def auth_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth2 callback endpoint.

    Cognito redirects here with ?code=...&state=...
    We exchange the code for tokens and create a session.
    """
    ip = _get_client_ip(request)

    # 1. Retrieve pending auth
    pending = get_pending_auth(state)
    if pending is None:
        await log_auth_fail(db, "", ip, "Invalid or expired state parameter")
        return HTMLResponse(
            "<h2>Authentication Failed</h2>"
            "<p>Invalid or expired authentication request. Please try again.</p>",
            status_code=400,
        )

    # 2. Exchange code for tokens
    tokens = await exchange_code_for_tokens(code, pending.code_verifier)
    if tokens is None:
        await log_auth_fail(db, pending.phone_number, ip, "Token exchange failed")
        return HTMLResponse(
            "<h2>Authentication Failed</h2>"
            "<p>Could not exchange authorization code. Please try again.</p>",
            status_code=400,
        )

    # 3. Introspect token to get user info
    user_info = await introspect_token(tokens.access_token, ip)
    if not user_info.valid:
        await log_auth_fail(db, pending.phone_number, ip, f"Introspection failed: {user_info.error}")
        return HTMLResponse(
            "<h2>Authentication Failed</h2>"
            f"<p>Token validation failed: {user_info.error}</p>",
            status_code=400,
        )

    # 4. Create session (bound to phone + IP)
    await create_session(
        db=db,
        phone_number=pending.phone_number,
        employee_id=user_info.employee_id,
        role=user_info.role,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        ip_address=pending.ip_address,
        expires_in=tokens.expires_in,
    )

    await log_auth_success(db, pending.phone_number, user_info.employee_id, ip, user_info.role)

    # 5. Show success page (user goes back to WhatsApp)
    return HTMLResponse(
        "<h2>Authentication Successful!</h2>"
        f"<p>Welcome, <strong>{user_info.employee_id}</strong> ({user_info.role})</p>"
        "<p>You can now return to WhatsApp. Your session is active.</p>"
        "<p><em>This window can be closed.</em></p>",
        status_code=200,
    )


@router.post("/auth/introspect")
async def auth_introspect(
    request: Request,
    authorization_token: str = Header(...),
    request_ip: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Server-to-server token introspection endpoint.

    Required headers: authorization_token, request_ip
    Returns: {valid, employee_id, role, expires_at}
    """
    result = await introspect_token(authorization_token, request_ip)

    return {
        "valid": result.valid,
        "employee_id": result.employee_id,
        "role": result.role,
        "expires_at": result.expires_at.isoformat() if result.expires_at else None,
    }


@router.post("/auth/logout")
async def auth_logout(
    phone_number: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate session for a phone number."""
    success = await invalidate_session(db, phone_number)
    return {
        "success": success,
        "message": "Session invalidated" if success else "No active session found",
    }


# ═════════════════════════════════════════════════════════════════
# DATA INGESTION ENDPOINTS
# ═════════════════════════════════════════════════════════════════

@router.post("/ingest/job-cards")
async def ingest_job_cards_endpoint(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    phone_number: str = Header(None, alias="X-Phone-Number"),
):
    """
    Upload job card data (CSV or JSON).

    Requires valid session. File must be CSV or JSON format.
    """
    ip = _get_client_ip(request)

    # Validate session if phone_number provided
    if phone_number:
        session = await validate_session(db, phone_number, ip)
        if not session.is_valid:
            await log_upload_reject(db, phone_number, ip, "No valid session for job card upload")
            return JSONResponse(
                status_code=401,
                content={"error": "Authentication required"},
            )
        employee_id = session.employee_id
    else:
        employee_id = "system"

    await log_upload_start(db, phone_number or "", employee_id, ip, "job_cards")

    content = await file.read()
    text = content.decode("utf-8")

    # Parse based on content type
    filename = (file.filename or "").lower()
    if filename.endswith(".json") or file.content_type == "application/json":
        records = parse_job_cards_json(text)
    else:
        records = parse_job_cards_csv(text)

    if not records:
        return JSONResponse(
            status_code=400,
            content={"error": "No valid records found in file"},
        )

    summary = await ingest_job_cards(db, records, ingested_by=employee_id)
    await log_upload_complete(db, phone_number or "", employee_id, ip, "job_cards")

    return summary


@router.post("/ingest/cleaning-slots")
async def ingest_cleaning_slots_endpoint(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    phone_number: str = Header(None, alias="X-Phone-Number"),
):
    """
    Upload cleaning slot data (CSV or JSON).

    Requires valid session. File must be CSV or JSON format.
    """
    ip = _get_client_ip(request)

    if phone_number:
        session = await validate_session(db, phone_number, ip)
        if not session.is_valid:
            await log_upload_reject(db, phone_number, ip, "No valid session for cleaning slot upload")
            return JSONResponse(
                status_code=401,
                content={"error": "Authentication required"},
            )
        employee_id = session.employee_id
    else:
        employee_id = "system"

    await log_upload_start(db, phone_number or "", employee_id, ip, "cleaning_slots")

    content = await file.read()
    text = content.decode("utf-8")

    filename = (file.filename or "").lower()
    if filename.endswith(".json") or file.content_type == "application/json":
        records = parse_cleaning_slots_json(text)
    else:
        records = parse_cleaning_slots_csv(text)

    if not records:
        return JSONResponse(
            status_code=400,
            content={"error": "No valid records found in file"},
        )

    summary = await ingest_cleaning_slots(db, records, ingested_by=employee_id)
    await log_upload_complete(db, phone_number or "", employee_id, ip, "cleaning_slots")

    return summary


# ═════════════════════════════════════════════════════════════════
# ML FEATURE ENDPOINTS
# ═════════════════════════════════════════════════════════════════

@router.get("/features/job-cards")
async def get_job_card_features(db: AsyncSession = Depends(get_db)):
    """
    ML feature export: open_critical_jobs and open_high_jobs per train.
    """
    features = await get_all_trains_job_features(db)
    return {"features": features, "count": len(features)}


@router.get("/features/cleaning")
async def get_cleaning_features(db: AsyncSession = Depends(get_db)):
    """
    ML feature export: cleaning_due_flag and cleaning_conflict_flag per train.
    """
    features = await get_all_trains_cleaning_features(db)
    return {"features": features, "count": len(features)}


@router.get("/features/all")
async def get_all_features(db: AsyncSession = Depends(get_db)):
    """
    Combined ML feature export: all features per train.
    """
    job_features = await get_all_trains_job_features(db)
    cleaning_features = await get_all_trains_cleaning_features(db)

    # Merge by train_id
    combined: dict[str, dict] = {}
    for jf in job_features:
        tid = jf["train_id"]
        combined[tid] = {**jf}
    for cf in cleaning_features:
        tid = cf["train_id"]
        if tid in combined:
            combined[tid].update(cf)
        else:
            combined[tid] = {
                "train_id": tid,
                "open_critical_jobs": 0,
                "open_high_jobs": 0,
                **cf,
            }

    # Ensure all features present
    for tid, feat in combined.items():
        feat.setdefault("open_critical_jobs", 0)
        feat.setdefault("open_high_jobs", 0)
        feat.setdefault("cleaning_due_flag", 0)
        feat.setdefault("cleaning_conflict_flag", 0)

    return {"features": list(combined.values()), "count": len(combined)}
