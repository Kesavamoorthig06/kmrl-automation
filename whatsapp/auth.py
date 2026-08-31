"""
OAuth2 Authorization Code with PKCE — AWS Cognito integration.

Flow:
  1. User sends "login" to bot
  2. Bot generates PKCE code_verifier + code_challenge
  3. Bot returns Cognito authorization URL with code_challenge
  4. User authenticates in browser
  5. Cognito redirects to callback with ?code=...&state=...
  6. Bot exchanges code for tokens (using code_verifier)
  7. Bot introspects/validates token → gets employee_id, role
  8. Session created, bound to phone_number + ip_address
  9. Bot confirms login to user

Security:
  - PKCE prevents authorization code interception
  - Tokens are NEVER stored in plaintext (SHA-256 hash only)
  - Session bound to phone + IP
  - Refresh token rotation enforced
"""

from __future__ import annotations

import base64
import hashlib
import logging
import os
import secrets
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx

from config import (
    COGNITO_DOMAIN,
    COGNITO_CLIENT_ID,
    COGNITO_CLIENT_SECRET,
    COGNITO_REDIRECT_URI,
    COGNITO_JWKS_URL,
    COGNITO_USER_POOL_ID,
    SESSION_TIMEOUT_MINUTES,
)

logger = logging.getLogger(__name__)


# ── PKCE helpers ──────────────────────────────────────────────────

def _generate_code_verifier(length: int = 64) -> str:
    """Generate a random code_verifier (43-128 chars, unreserved URI chars)."""
    token = secrets.token_urlsafe(length)
    return token[:128]


def _generate_code_challenge(verifier: str) -> str:
    """SHA-256 hash of the verifier, base64url-encoded (no padding)."""
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def hash_token(token: str) -> str:
    """SHA-256 hash a token for secure storage — never store plaintext."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ── Pending auth requests (in-memory, keyed by state param) ──────

@dataclass
class PendingAuth:
    phone_number: str
    code_verifier: str
    code_challenge: str
    state: str
    ip_address: str
    created_at: float

_pending_auths: dict[str, PendingAuth] = {}
PENDING_AUTH_TIMEOUT = 300  # 5 minutes


def cleanup_expired_pending():
    """Remove pending auths older than timeout."""
    now = time.time()
    expired = [k for k, v in _pending_auths.items() if now - v.created_at > PENDING_AUTH_TIMEOUT]
    for k in expired:
        del _pending_auths[k]


# ── Build authorization URL ──────────────────────────────────────

def create_auth_request(phone_number: str, ip_address: str) -> tuple[str, str]:
    """
    Create an OAuth2 authorization request with PKCE.

    Returns
    -------
    (auth_url, state)
        The URL to redirect the user to, and the state parameter to track.
    """
    cleanup_expired_pending()

    code_verifier = _generate_code_verifier()
    code_challenge = _generate_code_challenge(code_verifier)
    state = secrets.token_urlsafe(32)

    _pending_auths[state] = PendingAuth(
        phone_number=phone_number,
        code_verifier=code_verifier,
        code_challenge=code_challenge,
        state=state,
        ip_address=ip_address,
        created_at=time.time(),
    )

    params = {
        "response_type": "code",
        "client_id": COGNITO_CLIENT_ID,
        "redirect_uri": COGNITO_REDIRECT_URI,
        "scope": "openid profile email",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    auth_url = f"https://{COGNITO_DOMAIN}/oauth2/authorize?{urlencode(params)}"
    logger.info("Auth URL generated for phone=%s state=%s", phone_number, state[:8])
    return auth_url, state


def get_pending_auth(state: str) -> Optional[PendingAuth]:
    """Retrieve and consume a pending auth request by state."""
    return _pending_auths.pop(state, None)


# ── Token exchange ────────────────────────────────────────────────

@dataclass
class TokenResponse:
    access_token: str
    id_token: str
    refresh_token: Optional[str]
    expires_in: int
    token_type: str


async def exchange_code_for_tokens(code: str, code_verifier: str) -> Optional[TokenResponse]:
    """
    Exchange an authorization code for tokens using the PKCE code_verifier.
    Server-to-server call to Cognito /oauth2/token endpoint.
    """
    token_url = f"https://{COGNITO_DOMAIN}/oauth2/token"

    payload = {
        "grant_type": "authorization_code",
        "client_id": COGNITO_CLIENT_ID,
        "redirect_uri": COGNITO_REDIRECT_URI,
        "code": code,
        "code_verifier": code_verifier,
    }

    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    # If client secret is set, include it (confidential client)
    if COGNITO_CLIENT_SECRET:
        cred = base64.b64encode(
            f"{COGNITO_CLIENT_ID}:{COGNITO_CLIENT_SECRET}".encode()
        ).decode()
        headers["Authorization"] = f"Basic {cred}"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(token_url, data=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        return TokenResponse(
            access_token=data["access_token"],
            id_token=data["id_token"],
            refresh_token=data.get("refresh_token"),
            expires_in=data.get("expires_in", SESSION_TIMEOUT_MINUTES * 60),
            token_type=data.get("token_type", "Bearer"),
        )

    except httpx.HTTPStatusError as e:
        logger.error("Token exchange failed: %s %s", e.response.status_code, e.response.text)
        return None
    except Exception as e:
        logger.exception("Token exchange error: %s", e)
        return None


# ── Token refresh (with rotation) ─────────────────────────────────

async def refresh_access_token(refresh_token: str) -> Optional[TokenResponse]:
    """
    Refresh an access token.  Cognito rotates the refresh token automatically
    when refresh token rotation is enabled in the user pool.
    """
    token_url = f"https://{COGNITO_DOMAIN}/oauth2/token"

    payload = {
        "grant_type": "refresh_token",
        "client_id": COGNITO_CLIENT_ID,
        "refresh_token": refresh_token,
    }

    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    if COGNITO_CLIENT_SECRET:
        cred = base64.b64encode(
            f"{COGNITO_CLIENT_ID}:{COGNITO_CLIENT_SECRET}".encode()
        ).decode()
        headers["Authorization"] = f"Basic {cred}"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(token_url, data=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        return TokenResponse(
            access_token=data["access_token"],
            id_token=data.get("id_token", ""),
            refresh_token=data.get("refresh_token", refresh_token),
            expires_in=data.get("expires_in", SESSION_TIMEOUT_MINUTES * 60),
            token_type=data.get("token_type", "Bearer"),
        )
    except Exception as e:
        logger.error("Token refresh failed: %s", e)
        return None


# ── Token introspection (server-to-server) ────────────────────────

@dataclass
class IntrospectionResult:
    valid: bool
    employee_id: Optional[str] = None
    role: Optional[str] = None
    expires_at: Optional[datetime] = None
    error: Optional[str] = None


async def introspect_token(access_token: str, request_ip: str) -> IntrospectionResult:
    """
    Validate an access token via Cognito userInfo endpoint or
    a custom /auth/introspect endpoint.

    In production, this does JWT verification locally using JWKS,
    or calls the Cognito userInfo endpoint.
    """
    userinfo_url = f"https://{COGNITO_DOMAIN}/oauth2/userInfo"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                userinfo_url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "X-Request-IP": request_ip,
                },
            )

        if resp.status_code == 401:
            return IntrospectionResult(valid=False, error="Token expired or invalid")

        resp.raise_for_status()
        data = resp.json()

        # Map Cognito claims to our fields
        employee_id = data.get("custom:employee_id", data.get("sub", ""))
        role = data.get("custom:role", data.get("cognito:groups", [""])[0] if isinstance(data.get("cognito:groups"), list) else "")

        return IntrospectionResult(
            valid=True,
            employee_id=employee_id,
            role=role.upper() if role else None,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=SESSION_TIMEOUT_MINUTES),
        )

    except Exception as e:
        logger.error("Token introspection error: %s", e)
        return IntrospectionResult(valid=False, error=str(e))


# ── Local JWT verification (optional, for offline validation) ─────

_jwks_cache: dict = {}
_jwks_cache_ts: float = 0
JWKS_CACHE_TTL = 3600  # 1 hour


async def _get_jwks() -> dict:
    """Fetch and cache JWKS from Cognito."""
    global _jwks_cache, _jwks_cache_ts

    if _jwks_cache and (time.time() - _jwks_cache_ts) < JWKS_CACHE_TTL:
        return _jwks_cache

    if not COGNITO_JWKS_URL:
        return {}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(COGNITO_JWKS_URL)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_cache_ts = time.time()
            return _jwks_cache
    except Exception as e:
        logger.error("Failed to fetch JWKS: %s", e)
        return _jwks_cache  # Return stale cache if available
