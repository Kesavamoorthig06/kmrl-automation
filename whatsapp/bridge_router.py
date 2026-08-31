"""
Bridge Router — FastAPI endpoints for the WhatsApp session-auth bridge.

Endpoints:
  GET  /auth/bridge/login?token=<link_token>   — Serve login page (React or inline HTML)
  POST /auth/bridge/login                       — Submit credentials + link_token
  GET  /auth/bridge/verify_session              — Check if a phone has an active session
  POST /auth/bridge/logout                      — Invalidate session

The login page flow:
  1. WhatsApp bot sends user a URL: https://HOST/auth/bridge/login?token=XYZ
  2. User opens in browser → sees login form
  3. User enters Employee ID + Password → POST /auth/bridge/login
  4. Server verifies credentials, creates session bound to phone
  5. User sees success page, returns to WhatsApp
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from config import REACT_LOGIN_URL
from db import get_db, AuditLog, AuditEvent
from session_auth_bridge import (
    consume_link_and_create_session,
    get_active_session,
    logout_phone,
)

logger = logging.getLogger(__name__)

bridge_router = APIRouter(prefix="/auth/bridge", tags=["bridge-auth"])


# ── Helper ────────────────────────────────────────────────────────

def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── GET /auth/bridge/login?token=... — serve login page ──────────

@bridge_router.get("/login")
async def login_page(
    request: Request,
    token: str = Query(..., description="One-time link token from WhatsApp bot"),
):
    """
    Redirect to the React login page with the token, or serve the
    self-contained fallback HTML when REACT_LOGIN_URL is not configured.
    """
    if REACT_LOGIN_URL:
        sep = "&" if "?" in REACT_LOGIN_URL else "?"
        redirect_url = f"{REACT_LOGIN_URL}{sep}token={token}"
        logger.info("Redirecting to React login: %s", redirect_url)
        return RedirectResponse(url=redirect_url, status_code=302)

    # Fallback: serve inline HTML
    html = _build_login_html(token)
    return HTMLResponse(content=html, status_code=200)


# ── POST /auth/bridge/login — verify credentials ─────────────────

@bridge_router.post("/login")
async def login_submit(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit credentials + link_token.

    Accepts both JSON and form-encoded body:
      {token, employee_id, password}
    """
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
    else:
        form = await request.form()
        data = dict(form)

    token = data.get("token", "").strip()
    employee_id = data.get("employee_id", "").strip()
    password = data.get("password", "").strip()

    if not token or not employee_id or not password:
        if "application/json" in content_type:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Missing token, employee_id, or password"},
            )
        return HTMLResponse(_build_result_html(False, "All fields are required."), status_code=400)

    client_ip = _get_client_ip(request)

    result = await consume_link_and_create_session(
        db=db,
        link_token=token,
        employee_id=employee_id,
        password=password,
        client_ip=client_ip,
    )

    # JSON response for API callers (React app)
    if "application/json" in content_type:
        status = 200 if result["success"] else 401
        return JSONResponse(status_code=status, content=result)

    # HTML response for browser
    if result["success"]:
        return HTMLResponse(
            _build_result_html(
                True,
                f"Welcome, {result['name']}! ({result['employee_id']})\n"
                f"Role: {result['role']}\n\n"
                "Your WhatsApp session is now active.\n"
                "Return to WhatsApp and send any message.",
            ),
            status_code=200,
        )
    else:
        # Re-show login form with error
        return HTMLResponse(
            _build_login_html(token, error=result["error"]),
            status_code=401,
        )


# ── GET /auth/bridge/verify_session ───────────────────────────────

@bridge_router.get("/verify_session")
async def verify_session(
    phone_number: str = Query(..., description="WhatsApp phone number (e.g. whatsapp:+91...)"),
    db: AsyncSession = Depends(get_db),
):
    """Check if a phone number has an active authenticated session."""
    session = await get_active_session(db, phone_number)
    if session:
        return {
            "authenticated": True,
            "employee_id": session.employee_id,
            "role": session.role,
            "expires_at": session.expires_at.isoformat() if session.expires_at else None,
        }
    return {"authenticated": False}


# ── POST /auth/bridge/logout ─────────────────────────────────────

@bridge_router.post("/logout")
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Invalidate session. Accepts JSON or form with {phone_number}."""
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
    else:
        form = await request.form()
        data = dict(form)

    phone_number = data.get("phone_number", "").strip()
    if not phone_number:
        return JSONResponse(status_code=400, content={"success": False, "error": "phone_number required"})

    success = await logout_phone(db, phone_number)
    return {
        "success": success,
        "message": "Session invalidated" if success else "No active session found",
    }


# ═════════════════════════════════════════════════════════════════
# HTML TEMPLATES (self-contained, no React dependency)
# ═════════════════════════════════════════════════════════════════

def _build_login_html(token: str, error: str = "") -> str:
    """Build a self-contained login page HTML matching the Login.jsx theme."""
    error_block = ""
    if error:
        error_block = f"""
        <div class="status-message error">{error}</div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KMRL - WhatsApp Login</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ height: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }}

  .bg {{
    position: fixed; inset: 0;
    background: center/cover no-repeat url('/static/bg_kmrl.jpg');
    filter: grayscale(70%) brightness(80%) blur(2px);
    z-index: 0;
  }}
  .bg::after {{
    content: ""; position: absolute; inset: 0;
    background: rgba(0,0,0,0.25);
  }}

  .header {{
    position: relative; z-index: 3; height: 88px;
    background: linear-gradient(180deg, #0b4aa1, #083a86);
    display: flex; align-items: center; justify-content: center;
    padding: 0 18px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }}
  .brand {{ display: flex; flex-direction: column; align-items: center; text-align: center; }}
  .logo {{ width: 48px; height: 36px; object-fit: contain; margin-bottom: 6px; }}
  .header h1 {{ color: #fff; font-size: 22px; letter-spacing: 1px; font-weight: 700; }}

  .page {{
    position: relative; z-index: 2;
    min-height: calc(100vh - 88px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }}

  .card {{
    width: 360px; max-width: calc(100% - 48px);
    background: linear-gradient(180deg, rgba(13,138,199,0.96), rgba(9,133,175,0.95));
    border-radius: 28px; padding: 28px 26px;
    box-shadow: 0 18px 40px rgba(4,26,46,0.45);
    color: #fff;
    display: flex; flex-direction: column; gap: 16px; align-items: stretch;
    backdrop-filter: blur(3px);
  }}
  .form-title {{
    font-size: 22px; font-weight: 700; text-align: center; margin: 8px 0 4px;
  }}
  .whatsapp-badge {{
    display: flex; align-items: center; justify-content: center;
    gap: 6px;
    background: rgba(255,255,255,0.12);
    padding: 6px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.9);
  }}
  .input-group {{ display: flex; flex-direction: column; gap: 8px; }}
  label {{
    font-weight: 600; font-size: 14px;
    color: rgba(255,255,255,0.95); margin-left: 2px;
  }}
  .required::after {{ content: " *"; color: #ff7b7b; font-weight: 800; }}
  input[type="text"], input[type="password"] {{
    width: 100%; padding: 14px 16px; border-radius: 12px; border: none;
    background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.98);
    font-size: 15px; outline: none;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }}
  input::placeholder {{ color: rgba(255,255,255,0.7); font-weight: 400; }}
  .submit-btn {{
    margin-top: 6px; padding: 14px 18px; border-radius: 18px;
    border: none; font-weight: 700; font-size: 16px;
    cursor: pointer; color: white;
    background: linear-gradient(90deg, #0f6b51, #0b5346);
    box-shadow: 0 8px 24px rgba(11,83,70,0.34);
    transition: transform 0.15s, box-shadow 0.15s;
  }}
  .submit-btn:hover {{ transform: translateY(-1px); box-shadow: 0 10px 28px rgba(11,83,70,0.4); }}
  .submit-btn:active {{ transform: translateY(0); }}
  .submit-btn:disabled {{ opacity: 0.7; cursor: not-allowed; }}
  .status-message {{
    padding: 10px 12px; border-radius: 10px; font-weight: 600;
    text-align: center; margin-bottom: 4px;
  }}
  .status-message.error {{ background: rgba(255,255,255,0.08); color: #ffdede; }}
  .status-message.success {{ background: rgba(255,255,255,0.08); color: #e6ffef; }}
  .link-expire {{
    font-size: 11px; color: rgba(255,255,255,0.6);
    text-align: center; margin: 4px 0 0;
  }}
  .footer {{
    position: fixed; bottom: 16px; left: 0; right: 0;
    text-align: center; color: rgba(255,255,255,0.9);
    font-size: 12px; z-index: 2; pointer-events: none;
  }}

  @media (min-width: 900px) {{
    .card {{ width: 420px; padding: 36px; border-radius: 26px; }}
    .header {{ height: 110px; }}
    .logo {{ width: 60px; height: 44px; }}
    .form-title {{ font-size: 26px; }}
  }}
  @media (max-width: 420px) {{
    .card {{ width: 100%; padding: 20px; border-radius: 18px; }}
    .header {{ height: 78px; }}
  }}
</style>
</head>
<body>
  <div class="bg" aria-hidden="true"></div>

  <header class="header">
    <div class="brand">
      <img src="/static/metro-logo.png" alt="KMRL" class="logo" />
      <h1>KMRL METRO</h1>
    </div>
  </header>

  <main class="page">
    <form class="card" method="POST" action="/auth/bridge/login" id="loginForm">
      <input type="hidden" name="token" value="{token}" />
      <div class="form-title">Employee Login</div>
      <div style="display:flex;justify-content:center;">
        <div class="whatsapp-badge">
          <span>&#128172;</span> WhatsApp Authentication
        </div>
      </div>
      {error_block}
      <div class="input-group">
        <label class="required">Employee ID</label>
        <input type="text" name="employee_id" placeholder="e.g. KMRL-1001"
               required autocomplete="username" autofocus />
      </div>
      <div class="input-group">
        <label class="required">Password</label>
        <input type="password" name="password" placeholder="Enter your password"
               required autocomplete="current-password" />
      </div>
      <button type="submit" class="submit-btn" id="submitBtn">Authenticate</button>
      <p class="link-expire">Link expires in 5 minutes</p>
    </form>
  </main>

  <div class="footer">&copy; 2025 Kochi Metro Rail Limited. All rights reserved.</div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', function() {{
      var btn = document.getElementById('submitBtn');
      btn.textContent = 'Authenticating...';
      btn.disabled = true;
    }});
  </script>
</body>
</html>"""


def _build_result_html(success: bool, message: str) -> str:
    """Build a result page matching the Login.jsx theme."""
    lines = message.replace("\n", "<br>")

    if success:
        icon = "&#10004;"
        title = "Login Successful!"
        card_extra = ""
        bottom = """
      <div style="width:60%;height:1px;background:rgba(255,255,255,0.2);margin:4px auto;"></div>
      <p style="font-size:14px;line-height:1.7;text-align:center;color:rgba(255,255,255,0.95);margin:0;">
        Your WhatsApp session is now active.<br>
        <strong>Return to WhatsApp</strong> and send any message.
      </p>
      <a href="https://wa.me/" target="_blank" rel="noopener"
         style="display:flex;align-items:center;justify-content:center;gap:8px;
                padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);
                font-size:14px;font-weight:600;color:#fff;text-decoration:none;margin-top:4px;">
        <span style="font-size:20px;">&#128172;</span> Open WhatsApp
      </a>"""
    else:
        icon = "&#10006;"
        title = "Login Failed"
        card_extra = ""
        bottom = f"""
      <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);margin:8px 0 0;text-align:center;">
        {lines}
      </p>
      <a href="javascript:history.back()"
         style="margin-top:10px;padding:12px 18px;border-radius:14px;border:none;
                font-weight:700;font-size:15px;cursor:pointer;color:#fff;text-decoration:none;
                background:linear-gradient(90deg,#0f6b51,#0b5346);text-align:center;
                box-shadow:0 6px 20px rgba(11,83,70,0.3);display:block;">
        Try Again
      </a>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KMRL - {title}</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ height: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }}
  .bg {{
    position: fixed; inset: 0;
    background: center/cover no-repeat url('/static/bg_kmrl.jpg');
    filter: grayscale(70%) brightness(80%) blur(2px); z-index: 0;
  }}
  .bg::after {{ content: ""; position: absolute; inset:0; background: rgba(0,0,0,0.25); }}
  .header {{
    position: relative; z-index: 3; height: 88px;
    background: linear-gradient(180deg,#0b4aa1,#083a86);
    display: flex; align-items: center; justify-content: center;
    padding: 0 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }}
  .brand {{ display:flex; flex-direction:column; align-items:center; }}
  .logo {{ width:48px; height:36px; object-fit:contain; margin-bottom:6px; }}
  .header h1 {{ color:#fff; font-size:22px; letter-spacing:1px; font-weight:700; }}
  .page {{
    position:relative; z-index:2;
    min-height: calc(100vh - 88px);
    display:flex; align-items:center; justify-content:center; padding:24px;
  }}
  .card {{
    width: 360px; max-width: calc(100% - 48px);
    background: linear-gradient(180deg, rgba(13,138,199,0.96), rgba(9,133,175,0.95));
    border-radius: 28px; padding: 28px 26px;
    box-shadow: 0 18px 40px rgba(4,26,46,0.45);
    color: #fff; display:flex; flex-direction:column; gap:16px; align-items:stretch;
    text-align: center; backdrop-filter: blur(3px);
  }}
  .result-icon {{ font-size:52px; color:#e6ffef; margin-bottom:4px; }}
  .form-title {{ font-size:22px; font-weight:700; margin:8px 0 4px; }}
  .info-block {{
    background: rgba(255,255,255,0.12); border-radius:14px;
    padding:16px 20px; text-align:left;
  }}
  .info-block p {{ margin:5px 0; font-size:14px; color:rgba(255,255,255,0.95); }}
  .info-block strong {{ font-weight:700; }}
  .footer {{
    position:fixed; bottom:16px; left:0; right:0;
    text-align:center; color:rgba(255,255,255,0.9); font-size:12px; z-index:2;
  }}
  @media (min-width:900px) {{ .card {{ width:420px; padding:36px; }} .header {{ height:110px; }} .logo {{ width:60px;height:44px; }} }}
  @media (max-width:420px) {{ .card {{ width:100%;padding:20px;border-radius:18px; }} .header {{ height:78px; }} }}
</style>
</head>
<body>
  <div class="bg" aria-hidden="true"></div>
  <header class="header"><div class="brand">
    <img src="/static/metro-logo.png" alt="KMRL" class="logo" /><h1>KMRL METRO</h1>
  </div></header>
  <main class="page">
    <div class="card">
      <div class="result-icon">{icon}</div>
      <div class="form-title">{title}</div>
      <div class="info-block"><p>{lines}</p></div>
      {bottom}
    </div>
  </main>
  <div class="footer">&copy; 2025 Kochi Metro Rail Limited. All rights reserved.</div>
</body>
</html>"""
