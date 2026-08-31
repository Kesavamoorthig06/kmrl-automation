"""
WhatsApp Bot -- FastAPI service receiving Twilio webhooks.

Port 8300.  Role-aware document upload portal.
Interactive menu system with confirm/cancel navigation.
OAuth2 PKCE authentication via AWS Cognito.

Flow:
  1. User sends anything         -> greeting + ask to login
  2. User sends "login"           -> OAuth link returned
  3. User authenticates in browser -> session created via callback
  4. Authenticated                -> Main Menu (numbered options)
  5a. FITNESS role: Upload Certs  -> Train ID -> PDFs -> Confirm each -> Summary
  5b. MARKETING role: Upload Contract -> PDF -> Confirm -> Summary
  6. Post-action menu             -> Upload more / Main menu / Logout

All uploads require a valid OAuth session.
Sessions bound to phone_number + IP, 20-min timeout.

Global commands at any state:
  login    -> initiate OAuth login
  menu     -> main menu (if authenticated)
  back     -> previous step
  restart  -> fresh session
  logout   -> invalidate session
  help     -> context help
  status   -> progress check
"""

from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from xml.sax.saxutils import escape as xml_escape

from config import API_HOST, API_PORT, COGNITO_CLIENT_ID, TWILIO_IP_ALLOWLIST, REACT_LOGIN_URL
from chatbot import (
    State,
    Session,
    get_session,
    reset_session,
    validate_employee_id,
    extract_train_id,
    greeting_message,
    main_menu_message,
    auth_success_message,
    auth_fail_message,
    auth_format_fail_message,
    train_id_prompt_message,
    train_id_set_message,
    train_id_fail_message,
    branding_upload_prompt_message,
    confirm_cert_message,
    confirm_branding_message,
    cert_confirmed_message,
    cert_cancelled_message,
    branding_confirmed_message,
    branding_cancelled_message,
    all_certs_complete_message,
    post_action_message,
    pending_certs_message,
    not_a_pdf_message,
    security_violation_message,
    help_message,
    upload_history_message,
    logout_message,
    wrong_state_message,
    is_confirm,
    is_cancel,
    is_back,
    is_menu,
    is_restart,
    is_help,
    is_greeting,
    CERT_TYPES,
    # Schedule messages
    schedule_already_active_message,
    schedule_menu_message,
    schedule_optimal_preview_message,
    schedule_manual_prompt_message,
    schedule_manual_preview_message,
    schedule_created_message,
    schedule_view_message,
    schedule_close_confirm_message,
    schedule_closed_message,
    schedule_no_active_message,
)
from employee_db import (
    lookup_employee,
    is_fitness_role,
    is_branding_role,
    is_admin_role,
)
import cert_client
import branding_client
import schedule_store

# ── Secure identity layer imports ─────────────────────────────────
from db import init_db, close_db, get_async_session_factory
from auth import create_auth_request
from session_manager import validate_session, invalidate_session, create_session
from auth_router import router as auth_api_router
import audit_logger
from db import AuditEvent

# ── Session-Auth Bridge imports ───────────────────────────────────
from session_auth_bridge import (
    create_link_token,
    get_active_session as bridge_get_session,
    logout_phone as bridge_logout,
    seed_default_users,
)
from bridge_router import bridge_router
from file_forwarder import process_whatsapp_upload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-22s  %(levelname)-5s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# -- Audit log (uses both file + DB via audit_logger module) -------

_AUDIT_DIR = os.path.join(os.path.dirname(__file__), "audit_logs")
os.makedirs(_AUDIT_DIR, exist_ok=True)


def _audit_log(event: str, **kwargs):
    """Legacy file-based audit log (kept for backward compat)."""
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        **kwargs,
    }
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    path = os.path.join(_AUDIT_DIR, f"audit_{day}.jsonl")
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    logger.info("AUDIT %s: %s", event, json.dumps(kwargs))


# -- OAuth mode detection -------------------------------------------

_OAUTH_ENABLED = bool(COGNITO_CLIENT_ID)
LOGIN_WORDS = {"login", "sign in", "signin", "authenticate"}
LOGOUT_WORDS = {"logout", "sign out", "signout", "exit"}


def _is_login(text: str) -> bool:
    return text.lower().strip() in LOGIN_WORDS


def _is_logout(text: str) -> bool:
    return text.lower().strip() in LOGOUT_WORDS


# -- Lifespan ------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("WhatsApp Document Upload Bot v6.0 (bridge-auth) starting on %s:%s", API_HOST, API_PORT)
    logger.info("Auth mode: %s", "BRIDGE (server-side login)" if not _OAUTH_ENABLED else "OAuth PKCE")
    # Initialize database tables
    await init_db()
    logger.info("Database tables initialized")
    # Seed default employee users into DB if empty
    factory = get_async_session_factory()
    async with factory() as db:
        seeded = await seed_default_users(db)
        if seeded:
            logger.info("Seeded %d default users", seeded)
    yield
    # Cleanup
    await close_db()
    logger.info("WhatsApp Document Upload Bot shutting down")


app = FastAPI(
    title="KMRL WhatsApp Document Upload Bot",
    description="Twilio webhook -- role-aware document upload portal with session-auth bridge, secure sessions, RAG forwarding, and data ingestion",
    version="6.0.0",
    lifespan=lifespan,
)

# CORS — allow React app (Netlify / local dev) to call bridge auth endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Mount the auth & ingestion API router
app.include_router(auth_api_router, tags=["auth", "ingestion", "features"])

# Mount the session-auth bridge router
app.include_router(bridge_router)

# Serve static assets (background image, logo) for inline bridge-auth HTML pages
_static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(_static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=_static_dir), name="static")

# --- Frontend hosting (React SPA) ----------------------------------------
_public_dir = os.path.expanduser("~/public")
if not os.path.isdir(_public_dir):
    _public_dir = os.path.join(os.path.dirname(__file__), "..", "public")
_public_dir = os.path.abspath(_public_dir)
_assets_dir = os.path.join(_public_dir, "assets")
if os.path.isdir(_assets_dir):
    app.mount("/assets", StaticFiles(directory=_assets_dir), name="frontend-assets")
logger.info("Frontend public dir: %s", _public_dir)

# Twilio IP allowlist middleware (only restricts /webhook/* paths)
if TWILIO_IP_ALLOWLIST:
    from twilio_ip_middleware import TwilioIPMiddleware
    app.add_middleware(TwilioIPMiddleware)
    logger.info("TwilioIPMiddleware enabled – webhook endpoints restricted to Twilio CIDRs")


# -- TwiML helpers -------------------------------------------------

TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


def twiml_message(text: str) -> str:
    safe = xml_escape(text)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Message>{safe}</Message></Response>'
    )


# -- Webhook -------------------------------------------------------

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    form = await request.form()

    body: str = form.get("Body", "").strip()
    sender: str = form.get("From", "")
    num_media: int = int(form.get("NumMedia", "0"))
    media_url: str = form.get("MediaUrl0", "")
    media_ct: str = form.get("MediaContentType0", "")

    # Extract client IP for session binding
    forwarded = request.headers.get("X-Forwarded-For", "")
    client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

    logger.info("Inbound from=%s body=%r media=%d ct=%s ip=%s", sender, body[:80], num_media, media_ct, client_ip)

    try:
        reply = await handle_message(sender, body, num_media, media_url, media_ct, client_ip)
    except Exception as exc:
        logger.exception("Handler error")
        reply = f"Something went wrong: {exc}"

    logger.info("Reply to=%s text=%r", sender, reply[:120] if reply else "")
    return PlainTextResponse(content=twiml_message(reply), media_type="text/xml")


# -- Core state machine --------------------------------------------

async def handle_message(
    sender: str,
    body: str,
    num_media: int,
    media_url: str,
    media_ct: str,
    client_ip: str = "unknown",
) -> str:
    """Drive the conversation based on session state, with interactive menus."""

    lower = body.lower().strip()
    sess = get_session(sender)

    # -- GLOBAL: Login command — generate link token & send login URL --
    if _is_login(lower):
        # Bridge auth: generate a link token and send login URL
        factory = get_async_session_factory()
        async with factory() as db:
            token = await create_link_token(db, sender)
        # Prefer React login page if configured; otherwise use bridge endpoint
        if REACT_LOGIN_URL:
            sep = "&" if "?" in REACT_LOGIN_URL else "?"
            login_url = f"{REACT_LOGIN_URL}{sep}token={token}"
        else:
            login_url = f"http://{API_HOST}:{API_PORT}/auth/bridge/login?token={token}"
            # If running behind a domain / public IP, use that instead
            public_host = os.getenv("PUBLIC_HOST", "")
            if public_host:
                login_url = f"{public_host}/auth/bridge/login?token={token}"
        return (
            "================================\n"
            "  Secure Login\n"
            "================================\n\n"
            "Open this link in your browser\n"
            "to authenticate:\n\n"
            f"{login_url}\n\n"
            "Link expires in 5 minutes.\n"
            "After login, return here and\n"
            "send any message.\n"
            "================================"
        )

    # -- GLOBAL: Logout command — invalidate bridge session ---------
    if _is_logout(lower):
        factory = get_async_session_factory()
        async with factory() as db:
            await bridge_logout(db, sender)
            await audit_logger.log_session_logout(db, sender, sess.employee_id or "")
        name = sess.employee_name or "User"
        _audit_log("logout", employee_id=sess.employee_id, sender=sender)
        reset_session(sender)
        return logout_message(name)

    # -- GLOBAL: restart / greeting (works from any state) ---------
    if is_restart(lower) or is_greeting(lower):
        reset_session(sender)
        sess = get_session(sender)
        sess.state = State.AWAITING_AUTH
        # Check bridge session — if already authenticated, go to menu
        factory = get_async_session_factory()
        async with factory() as db:
            db_session = await bridge_get_session(db, sender)
        if db_session:
            sess.employee_id = db_session.employee_id
            sess.employee_name = db_session.employee_id
            sess.role = db_session.role
            employee = lookup_employee(db_session.employee_id)
            if employee:
                sess.employee_name = employee["name"]
                sess.role = employee["role"]
            sess.state = State.MAIN_MENU
            welcome = auth_success_message(sess.employee_id, sess.employee_name, sess.role)
            menu = main_menu_message(sess.employee_name, sess.role)
            return welcome + "\n\n" + menu
        return (
            greeting_message() + "\n\n"
            "Send *login* to authenticate securely."
        )

    # -- GLOBAL: help (works from any state if authenticated) ------
    if is_help(lower):
        return help_message(sess.role)

    # -- GLOBAL: menu (go to main menu if authenticated) -----------
    if is_menu(lower):
        if sess.employee_id:
            sess.clear_pending()
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)
        else:
            sess.state = State.AWAITING_AUTH
            return greeting_message()

    # -- GLOBAL: status --------------------------------------------
    if lower in ("status", "progress"):
        if sess.state == State.UPLOADING_CERTS:
            return pending_certs_message(sess)
        elif sess.employee_id:
            return upload_history_message(sess)
        return wrong_state_message()

    # ============================================================
    # STATE: GREETING
    # ============================================================
    if sess.state == State.GREETING:
        sess.state = State.AWAITING_AUTH
        # Always use bridge auth: check DB first, then ask to login
        factory = get_async_session_factory()
        async with factory() as db:
            db_session = await bridge_get_session(db, sender)
        if db_session:
            # Already authenticated — resume session
            sess.employee_id = db_session.employee_id
            sess.employee_name = db_session.employee_id
            sess.role = db_session.role
            employee = lookup_employee(db_session.employee_id)
            if employee:
                sess.employee_name = employee["name"]
                sess.role = employee["role"]
            sess.state = State.MAIN_MENU
            welcome = auth_success_message(sess.employee_id, sess.employee_name, sess.role)
            menu = main_menu_message(sess.employee_name, sess.role)
            return welcome + "\n\n" + menu
        return (
            greeting_message() + "\n\n"
            "Send *login* to authenticate securely."
        )

    # ============================================================
    # STATE: AWAITING_AUTH
    # ============================================================
    if sess.state == State.AWAITING_AUTH:
        # --- Bridge auth: check if user has a valid DB session ----
        factory = get_async_session_factory()
        async with factory() as db:
            db_session = await bridge_get_session(db, sender)

        if db_session:
            # Authenticated session found — populate chatbot session
            sess.employee_id = db_session.employee_id
            sess.employee_name = db_session.employee_id
            sess.role = db_session.role

            employee = lookup_employee(db_session.employee_id)
            if employee:
                sess.employee_name = employee["name"]
                sess.role = employee["role"]

            _audit_log("bridge_session_resumed",
                       employee_id=sess.employee_id,
                       role=sess.role,
                       sender=sender)

            sess.state = State.MAIN_MENU
            welcome = auth_success_message(sess.employee_id, sess.employee_name, sess.role)
            menu = main_menu_message(sess.employee_name, sess.role)
            return welcome + "\n\n" + menu
        else:
            # No valid session — ask user to login
            return (
                "You are not authenticated.\n\n"
                "Send *login* to get a secure\n"
                "authentication link.\n\n"
                "--------------------------------\n"
                "All uploads require authentication."
            )

    # ============================================================
    # STATE: MAIN_MENU
    # ============================================================
    if sess.state == State.MAIN_MENU:
        # ── Admin role — schedule management menu ──
        if is_admin_role(sess.role):
            if lower == "1":
                # Create Schedule
                if schedule_store.is_schedule_active():
                    return schedule_already_active_message(schedule_store.get_active_schedule())
                sess.state = State.SCHEDULE_MENU
                return schedule_menu_message()
            elif lower == "2":
                # View Active Schedule
                return schedule_view_message(schedule_store.get_active_schedule())
            elif lower == "3":
                # Close Schedule
                active = schedule_store.get_active_schedule()
                if active is None:
                    return schedule_no_active_message()
                sess.state = State.SCHEDULE_CLOSE_CONFIRM
                return schedule_close_confirm_message(active)
            elif lower == "4":
                return help_message(sess.role)
            elif lower == "0":
                name = sess.employee_name or "User"
                _audit_log("logout", employee_id=sess.employee_id, sender=sender)
                reset_session(sender)
                return logout_message(name)
            else:
                return (
                    "Please reply with a number:\n\n"
                    "  *1* - Create Schedule\n"
                    "  *2* - View Active Schedule\n"
                    "  *3* - Close Schedule\n"
                    "  *4* - Help\n"
                    "  *0* - Logout\n"
                )
        # ── Non-admin roles — existing flow ──
        elif lower == "1":
            if is_fitness_role(sess.role):
                sess.state = State.AWAITING_TRAIN_ID
                return train_id_prompt_message()
            elif is_branding_role(sess.role):
                sess.state = State.UPLOADING_BRANDING
                return branding_upload_prompt_message()
        elif lower == "2":
            return upload_history_message(sess)
        elif lower == "3":
            return help_message(sess.role)
        elif lower == "0":
            name = sess.employee_name or "User"
            _audit_log("logout", employee_id=sess.employee_id, sender=sender)
            reset_session(sender)
            return logout_message(name)
        else:
            return (
                "Please reply with a number:\n\n"
                "  *1* - Upload documents\n"
                "  *2* - Upload history\n"
                "  *3* - Help\n"
                "  *0* - Logout\n"
            )

    # ============================================================
    # STATE: SCHEDULE_MENU (admin — choose one-click or manual)
    # ============================================================
    if sess.state == State.SCHEDULE_MENU:
        if is_back(lower):
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)

        if lower == "1":
            # One-Click Optimal
            optimal = schedule_store.get_optimal_trains(14)
            if not optimal:
                return (
                    "No available service trains found\n"
                    "in the ML data.\n\n"
                    "Check that the CSV data is loaded.\n\n"
                    "--------------------------------\n"
                    "Reply *back* for main menu"
                )
            sess.pending_schedule = [t["train_id"] for t in optimal]
            sess.schedule_mode = "one_click"
            sess.state = State.SCHEDULE_CONFIRM
            return schedule_optimal_preview_message(optimal)

        elif lower == "2":
            # Manual Select
            available = schedule_store.get_available_trains()
            if not available:
                return (
                    "No available service trains found.\n\n"
                    "--------------------------------\n"
                    "Reply *back* for main menu"
                )
            sess.schedule_mode = "manual"
            sess.state = State.SCHEDULE_MANUAL_SELECT
            return schedule_manual_prompt_message(available)

        else:
            return schedule_menu_message()

    # ============================================================
    # STATE: SCHEDULE_MANUAL_SELECT (admin — enter train IDs)
    # ============================================================
    if sess.state == State.SCHEDULE_MANUAL_SELECT:
        if is_back(lower):
            sess.state = State.SCHEDULE_MENU
            return schedule_menu_message()

        # Parse comma-separated train IDs
        raw_ids = [tid.strip().upper() for tid in body.split(",") if tid.strip()]
        if not raw_ids:
            return (
                "No train IDs detected.\n\n"
                "Enter IDs separated by commas:\n"
                "_(e.g. R-001, R-004, R-010)_"
            )

        # Validate against available trains
        available_ids = {t["train_id"] for t in schedule_store.get_available_trains()}
        all_ids = {t["train_id"] for t in schedule_store.get_all_trains_from_csv()}
        valid = []
        invalid = []
        unavailable = []
        for tid in raw_ids:
            if tid in available_ids:
                valid.append(tid)
            elif tid in all_ids:
                unavailable.append(tid)
            else:
                invalid.append(tid)

        errors = []
        if invalid:
            errors.append("Not found: " + ", ".join(invalid))
        if unavailable:
            errors.append("Unavailable: " + ", ".join(unavailable))

        if errors:
            return (
                "Some train IDs have issues:\n\n"
                + "\n".join(errors) + "\n\n"
                "Valid selections: " + (", ".join(valid) if valid else "none") + "\n\n"
                "Please re-enter all train IDs:"
            )

        if not valid:
            return (
                "No valid train IDs provided.\n\n"
                "Enter IDs of *Available* trains:\n"
                "_(e.g. R-001, R-004, R-010)_"
            )

        sess.pending_schedule = valid
        sess.state = State.SCHEDULE_CONFIRM
        return schedule_manual_preview_message(valid)

    # ============================================================
    # STATE: SCHEDULE_CONFIRM (admin — confirm or cancel)
    # ============================================================
    if sess.state == State.SCHEDULE_CONFIRM:
        if is_confirm(lower):
            try:
                result = schedule_store.create_schedule(
                    train_ids=sess.pending_schedule,
                    created_by=sess.employee_id,
                    mode=sess.schedule_mode or "one_click",
                )
                _audit_log("schedule_created",
                           employee_id=sess.employee_id,
                           count=len(sess.pending_schedule),
                           mode=sess.schedule_mode,
                           train_ids=sess.pending_schedule,
                           sender=sender)
                sess.pending_schedule = []
                sess.schedule_mode = None
                sess.state = State.MAIN_MENU
                return schedule_created_message(result)
            except ValueError as e:
                sess.state = State.MAIN_MENU
                return str(e) + "\n\nReply *menu* for main menu"

        elif is_cancel(lower):
            sess.pending_schedule = []
            sess.schedule_mode = None
            sess.state = State.SCHEDULE_MENU
            return "Schedule cancelled.\n\n" + schedule_menu_message()

        elif is_back(lower):
            sess.pending_schedule = []
            sess.state = State.SCHEDULE_MENU
            return schedule_menu_message()

        else:
            return (
                "Please choose:\n\n"
                "  *confirm* - Deploy this schedule\n"
                "  *cancel*  - Go back\n"
            )

    # ============================================================
    # STATE: SCHEDULE_CLOSE_CONFIRM (admin — confirm closing)
    # ============================================================
    if sess.state == State.SCHEDULE_CLOSE_CONFIRM:
        if is_confirm(lower):
            result = schedule_store.close_schedule(closed_by=sess.employee_id)
            if result:
                _audit_log("schedule_closed",
                           employee_id=sess.employee_id,
                           sender=sender)
                sess.state = State.MAIN_MENU
                return schedule_closed_message()
            else:
                sess.state = State.MAIN_MENU
                return schedule_no_active_message()

        elif is_cancel(lower) or is_back(lower):
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)

        else:
            return (
                "Please choose:\n\n"
                "  *confirm* - Close schedule\n"
                "  *cancel*  - Keep active\n"
            )

    # ============================================================
    # STATE: AWAITING_TRAIN_ID (fitness roles only)
    # ============================================================
    if sess.state == State.AWAITING_TRAIN_ID:
        if is_back(lower):
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)

        train_id = extract_train_id(body)
        if train_id:
            sess.train_id = train_id
            sess.state = State.UPLOADING_CERTS
            _audit_log("train_id_set",
                       employee_id=sess.employee_id,
                       train_id=train_id,
                       sender=sender)
            return train_id_set_message(train_id)
        else:
            return train_id_fail_message()

    # ============================================================
    # STATE: UPLOADING_CERTS (fitness roles)
    # ============================================================
    if sess.state == State.UPLOADING_CERTS:
        if is_back(lower):
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)

        # Enforce session for uploads (bridge auth)
        if num_media > 0:
            factory = get_async_session_factory()
            async with factory() as db:
                db_session = await bridge_get_session(db, sender)
            if not db_session:
                return (
                    "================================\n"
                    "  Session Expired\n"
                    "================================\n\n"
                    "Your session has expired or is\n"
                    "invalid. Please *login* again\n"
                    "to continue uploading.\n"
                    "================================"
                )

        if num_media == 0:
            return "I'm waiting for a *PDF certificate*.\n\n" + pending_certs_message(sess)

        ct_base = (media_ct or "").split(";")[0].strip()
        if ct_base != "application/pdf":
            return not_a_pdf_message()

        remaining = sess.remaining_certs()
        if not remaining:
            sess.state = State.COMPLETE
            return all_certs_complete_message(sess) + post_action_message()

        cert_name, cert_domain, _desc = remaining[0]

        logger.info("Processing cert %s for train %s (by %s)",
                     cert_name, sess.train_id, sess.employee_id)

        _audit_log("cert_upload_start",
                   employee_id=sess.employee_id,
                   role=sess.role,
                   train_id=sess.train_id,
                   cert_domain=cert_domain,
                   sender=sender)

        result = await cert_client.ingest_certificate(
            media_url=media_url,
            content_type=media_ct,
            train_id=sess.train_id,
            caption=f"{cert_domain} certificate for {sess.train_id}",
        )

        if result.get("success"):
            pr = result.get("pipeline_result", result)
            score = pr.get("final_score", pr.get("fitness", {}).get("final_score", "N/A"))
            critical = pr.get("critical_fail", pr.get("fitness", {}).get("critical_fail", False))

            # Store pending - wait for confirm
            sess.pending_result = {
                "cert_name": cert_name,
                "domain": cert_domain,
                "final_score": score,
                "critical_fail": critical,
                "full_result": result,
            }
            sess.pending_cert_info = (cert_name, cert_domain)
            sess.state = State.CONFIRM_CERT

            return confirm_cert_message(cert_name, {"final_score": score, "critical_fail": critical})
        else:
            _audit_log("cert_upload_error",
                       employee_id=sess.employee_id,
                       train_id=sess.train_id,
                       cert_domain=cert_domain,
                       error=result.get("error"),
                       sender=sender)
            return (
                "Failed to process " + cert_name + ":\n"
                + str(result.get("error", "Unknown error")) + "\n\n"
                "Please try sending the PDF again.\n\n"
                "--------------------------------\n"
                "Reply *back* for main menu"
            )

    # ============================================================
    # STATE: CONFIRM_CERT
    # ============================================================
    if sess.state == State.CONFIRM_CERT:
        if is_confirm(lower):
            # Save the pending result
            pending = sess.pending_result
            cert_name = pending["cert_name"]
            cert_domain = pending["domain"]

            sess.uploaded_certs.append(cert_domain)
            sess.results.append({
                "cert_name": cert_name,
                "domain": cert_domain,
                "final_score": pending["final_score"],
                "critical_fail": pending["critical_fail"],
            })

            _audit_log("cert_confirmed",
                       employee_id=sess.employee_id,
                       train_id=sess.train_id,
                       cert_domain=cert_domain,
                       score=pending["final_score"],
                       sender=sender)

            sess.clear_pending()
            new_remaining = sess.remaining_certs()

            if not new_remaining:
                sess.state = State.COMPLETE
                return all_certs_complete_message(sess) + post_action_message()
            else:
                sess.state = State.UPLOADING_CERTS
                return cert_confirmed_message(cert_name, len(new_remaining))

        elif is_cancel(lower):
            cert_name = sess.pending_cert_info[0] if sess.pending_cert_info else "Certificate"
            _audit_log("cert_cancelled",
                       employee_id=sess.employee_id,
                       train_id=sess.train_id,
                       cert_name=cert_name,
                       sender=sender)
            sess.clear_pending()
            sess.state = State.UPLOADING_CERTS
            return cert_cancelled_message(cert_name)

        elif is_back(lower):
            sess.clear_pending()
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)

        else:
            return (
                "Please choose:\n\n"
                "  *confirm* - Save this result\n"
                "  *cancel*  - Discard & re-upload\n"
                "  *back*    - Main menu\n"
            )

    # ============================================================
    # STATE: UPLOADING_BRANDING (marketing role)
    # ============================================================
    if sess.state == State.UPLOADING_BRANDING:
        if is_back(lower):
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)

        if not is_branding_role(sess.role):
            _audit_log("security_violation",
                       employee_id=sess.employee_id,
                       role=sess.role,
                       attempted="branding_contract",
                       sender=sender)
            return security_violation_message(sess.role, "branding contracts")

        # Enforce session for uploads (bridge auth)
        if num_media > 0:
            factory = get_async_session_factory()
            async with factory() as db:
                db_session = await bridge_get_session(db, sender)
            if not db_session:
                return (
                    "================================\n"
                    "  Session Expired\n"
                    "================================\n\n"
                    "Your session has expired or is\n"
                    "invalid. Please *login* again\n"
                    "to continue uploading.\n"
                    "================================"
                )

        if num_media == 0:
            return "Please send a *branding contract PDF* to proceed.\n\n--------------------------------\nReply *back* for main menu"

        ct_base = (media_ct or "").split(";")[0].strip()
        if ct_base != "application/pdf":
            return not_a_pdf_message()

        logger.info("Processing branding contract (by %s)", sess.employee_id)
        _audit_log("branding_upload_start",
                   employee_id=sess.employee_id,
                   role=sess.role,
                   sender=sender)

        result = await branding_client.ingest_branding_contract(
            media_url=media_url,
            content_type=media_ct,
            employee_id=sess.employee_id,
        )

        if result.get("success"):
            formatted = branding_client.format_branding_reply(result)
            # Store pending - wait for confirm
            sess.pending_result = result
            sess.pending_formatted = formatted
            sess.state = State.CONFIRM_BRANDING
            return confirm_branding_message(formatted)
        else:
            _audit_log("branding_upload_error",
                       employee_id=sess.employee_id,
                       error=result.get("error"),
                       sender=sender)
            return (
                "Failed to process contract:\n"
                + str(result.get("error", "Unknown error")) + "\n\n"
                "Please try sending the PDF again.\n\n"
                "--------------------------------\n"
                "Reply *back* for main menu"
            )

    # ============================================================
    # STATE: CONFIRM_BRANDING
    # ============================================================
    if sess.state == State.CONFIRM_BRANDING:
        if is_confirm(lower):
            sess.branding_result = sess.pending_result
            formatted = sess.pending_formatted

            _audit_log("branding_confirmed",
                       employee_id=sess.employee_id,
                       campaign=sess.branding_result.get("contract", {}).get("campaign_name"),
                       brand=sess.branding_result.get("contract", {}).get("brand_name"),
                       fields_extracted=sess.branding_result.get("fields_extracted"),
                       sender=sender)

            sess.clear_pending()
            sess.state = State.COMPLETE
            return branding_confirmed_message(sess, formatted) + post_action_message()

        elif is_cancel(lower):
            _audit_log("branding_cancelled",
                       employee_id=sess.employee_id,
                       sender=sender)
            sess.clear_pending()
            sess.state = State.UPLOADING_BRANDING
            return branding_cancelled_message()

        elif is_back(lower):
            sess.clear_pending()
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)

        else:
            return (
                "Please choose:\n\n"
                "  *confirm* - Save this contract\n"
                "  *cancel*  - Discard & re-upload\n"
                "  *back*    - Main menu\n"
            )

    # ============================================================
    # STATE: COMPLETE (post-action menu)
    # ============================================================
    if sess.state == State.COMPLETE:
        if lower == "1":
            # Upload more
            if is_fitness_role(sess.role):
                # Reset cert uploads for new train
                sess.uploaded_certs = []
                sess.results = []
                sess.train_id = None
                sess.state = State.AWAITING_TRAIN_ID
                return train_id_prompt_message()
            elif is_branding_role(sess.role):
                sess.branding_result = None
                sess.state = State.UPLOADING_BRANDING
                return branding_upload_prompt_message()

        elif lower == "2":
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)

        elif lower == "0":
            name = sess.employee_name or "User"
            _audit_log("logout", employee_id=sess.employee_id, sender=sender)
            reset_session(sender)
            return logout_message(name)

        elif is_back(lower):
            sess.state = State.MAIN_MENU
            return main_menu_message(sess.employee_name, sess.role)

        else:
            return post_action_message()

    # Fallback
    return wrong_state_message()


# -- Schedule API (shared with React frontend) ---------------------

@app.get("/schedule/active")
async def get_active_schedule():
    """Return the currently active schedule, or null."""
    sched = schedule_store.get_active_schedule()
    return {"schedule": sched}


@app.post("/schedule/create")
async def api_create_schedule(request: Request):
    """Create a new schedule. Expects JSON: {train_ids: [...], mode: 'one_click'|'manual', created_by: '...'}"""
    try:
        data = await request.json()
    except Exception:
        return {"success": False, "error": "Invalid JSON"}
    train_ids = data.get("train_ids", [])
    mode = data.get("mode", "manual")
    created_by = data.get("created_by", "web_admin")
    if not train_ids:
        return {"success": False, "error": "No train IDs provided"}
    try:
        result = schedule_store.create_schedule(train_ids, created_by, mode)
        _audit_log("schedule_created_api", created_by=created_by, count=len(train_ids), mode=mode)
        return {"success": True, "schedule": result}
    except ValueError as e:
        return {"success": False, "error": str(e)}


@app.post("/schedule/close")
async def api_close_schedule(request: Request):
    """Close the active schedule. Expects JSON: {closed_by: '...'}"""
    try:
        data = await request.json()
    except Exception:
        data = {}
    closed_by = data.get("closed_by", "web_admin")
    result = schedule_store.close_schedule(closed_by)
    if result:
        _audit_log("schedule_closed_api", closed_by=closed_by)
        return {"success": True, "schedule": result}
    return {"success": False, "error": "No active schedule to close"}


@app.get("/schedule/available-trains")
async def get_available_trains_api():
    """Return available trains from CSV for the frontend."""
    trains = schedule_store.get_available_trains()
    return {"trains": trains}


# -- Live Operations: data-driven fault scan -----------------------

import csv as _csv

def _read_csv_dicts(filename: str) -> list[dict]:
    """Read a CSV from the public folder, return list of dicts."""
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "public", filename),
        os.path.expanduser(f"~/public/{filename}"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                return list(_csv.DictReader(f))
    return []


@app.get("/liveops/fault-scan")
async def liveops_fault_scan():
    """
    Scan real CSV data to detect trains with faults.
    
    A train is 'faulted' if any of:
      - job_card_status == 'Open' AND priority_level in (critical, high) in job_cards CSV
      - fitness_certificate_valid == 'No' in ml_analysis_data CSV
      - Any individual certificate is 'expired' in fitness_certificates CSV
      - deployment_ready == 'No' in ml_analysis_data CSV (for active/service trains)

    Returns list of detected faults with real reasons + a replacement suggestion
    from the standby pool for each fault.
    """
    # Read all data sources
    ml_data = _read_csv_dicts("ml_analysis_data.csv")
    job_cards = _read_csv_dicts("train_job_cards.csv")
    fitness_certs = _read_csv_dicts("train_fitness_certificates.csv")

    # Build lookup maps
    ml_map = {r.get("train_id"): r for r in ml_data}
    jc_map = {r.get("train_id"): r for r in job_cards}
    fc_map = {r.get("train_id"): r for r in fitness_certs}

    # Get active schedule to know which trains are in service
    sched = schedule_store.get_active_schedule()
    scheduled_ids = set(sched.get("train_ids", [])) if sched else set()

    # Build standby pool: Available trains NOT in the schedule, sorted by score desc
    standby_pool = []
    for row in ml_data:
        tid = row.get("train_id", "")
        if (
            row.get("status") == "Available"
            and tid not in scheduled_ids
            and row.get("assignment") in ("Standby", "Service")
        ):
            standby_pool.append({
                "train_id": tid,
                "score": float(row.get("score", 0)),
                "stabling_bay": row.get("stabling_bay", ""),
            })
    standby_pool.sort(key=lambda x: x["score"], reverse=True)

    # Scan scheduled trains for faults
    faults = []
    used_replacements = set()

    for tid in sorted(scheduled_ids):
        ml_row = ml_map.get(tid, {})
        jc_row = jc_map.get(tid, {})
        fc_row = fc_map.get(tid, {})

        reasons = []

        # 1. Critical/high open job cards
        if jc_row.get("job_card_status") == "open" and jc_row.get("priority_level") in ("critical", "high"):
            desc = jc_row.get("work_description", "Unknown maintenance issue")
            reasons.append(f"Open {jc_row['priority_level']} job card: {desc}")
            if int(jc_row.get("critical_issues", 0)) > 0:
                reasons.append(f"{jc_row['critical_issues']} critical issue(s) reported")

        # 2. Fitness certificate invalid (from ML summary)
        if ml_row.get("fitness_certificate_valid") == "No":
            reasons.append("Fitness certificate invalid — train not cleared for service")

        # 3. Individual expired certificates
        cert_fields = [
            ("rolling_stock_certificate", "Rolling Stock"),
            ("signalling_certificate", "Signalling"),
            ("telecom_certificate", "Telecom"),
            ("brake_certificate", "Brake"),
            ("electrical_certificate", "Electrical"),
            ("mechanical_certificate", "Mechanical"),
        ]
        expired_certs = []
        for field, label in cert_fields:
            if fc_row.get(field) == "expired":
                expired_certs.append(label)
        if expired_certs:
            reasons.append(f"Expired certificate(s): {', '.join(expired_certs)}")

        # 4. Not deployment-ready despite being scheduled
        if ml_row.get("deployment_ready") == "No":
            reasons.append(f"Bay {ml_row.get('stabling_bay', '?')} not deployment-ready (efficiency {ml_row.get('operational_efficiency', '?')}%)")

        if not reasons:
            continue  # No fault detected for this train

        # Find a replacement from standby pool
        suggestion = None
        for s in standby_pool:
            if s["train_id"] not in used_replacements:
                suggestion = s
                used_replacements.add(s["train_id"])
                break

        faults.append({
            "train_id": tid,
            "reasons": reasons,
            "severity": "critical" if any("critical" in r.lower() for r in reasons) else "high",
            "job_card": {
                "status": jc_row.get("job_card_status", "N/A"),
                "priority": jc_row.get("priority_level", "N/A"),
                "work_type": jc_row.get("work_order_type", "N/A"),
            } if jc_row else None,
            "suggestion": {
                "replacement_train": suggestion["train_id"],
                "score": suggestion["score"],
                "stabling_bay": suggestion["stabling_bay"],
            } if suggestion else None,
        })

    return {
        "scan_time": datetime.now(timezone.utc).isoformat(),
        "scheduled_count": len(scheduled_ids),
        "faults_detected": len(faults),
        "faults": faults,
        "standby_remaining": len(standby_pool) - len(used_replacements),
    }


# -- Health --------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "whatsapp-document-bot",
        "port": API_PORT,
        "version": "6.0.0",
        "bridge_auth": True,
        "rag_forwarding": True,
    }


@app.get("/")
async def root():
    """Serve the React frontend at root."""
    index = os.path.join(_public_dir, "index.html")
    if os.path.isfile(index):
        return FileResponse(index, media_type="text/html",
                            headers={"Cache-Control": "no-cache, must-revalidate"})
    # Fallback: if no frontend built, show service info
    return {
        "service": "KMRL WhatsApp Document Upload Bot",
        "version": "6.0.0",
        "note": "Frontend index.html not found – visit /health for API info",
    }


# --- SPA catch-all (MUST be last) -----------------------------------------
# Serve CSV / image / other public files by exact name
@app.get("/{filename:path}")
async def _spa_catchall(filename: str):
    # Try serving the exact file from public dir
    full = os.path.join(_public_dir, filename)
    if filename and os.path.isfile(full):
        return FileResponse(full)
    # SPA fallback -> index.html
    index = os.path.join(_public_dir, "index.html")
    if os.path.isfile(index):
        return FileResponse(index, media_type="text/html",
                            headers={"Cache-Control": "no-cache, must-revalidate"})
    return PlainTextResponse("index.html not found", status_code=404)


# -- Entry ---------------------------------------------------------

if __name__ == "__main__":
    is_dev = os.getenv("ENV", "production").lower() in ("dev", "development", "local")
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=is_dev)
