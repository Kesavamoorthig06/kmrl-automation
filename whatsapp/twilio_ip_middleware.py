"""
Twilio IP Allowlist Middleware — restrict webhook access to Twilio IPs only.

In production (behind AWS API Gateway), IP filtering is done at the
gateway level.  This middleware provides defense-in-depth for the
FastAPI server itself.

Allowed CIDRs: https://www.twilio.com/docs/sip-trunking/ip-addresses
"""

from __future__ import annotations

import ipaddress
import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from config import TWILIO_IP_ALLOWLIST

logger = logging.getLogger(__name__)

# Parse CIDRs into ip_network objects at import time
_ALLOWED_NETWORKS = []
for entry in TWILIO_IP_ALLOWLIST:
    try:
        _ALLOWED_NETWORKS.append(ipaddress.ip_network(entry, strict=False))
    except ValueError:
        try:
            _ALLOWED_NETWORKS.append(ipaddress.ip_network(f"{entry}/32", strict=False))
        except ValueError:
            logger.warning("Invalid IP/CIDR in allowlist: %s", entry)


def _is_twilio_ip(ip_str: str) -> bool:
    """Check if an IP address is in the Twilio allowlist."""
    if not _ALLOWED_NETWORKS:
        return True  # No allowlist configured → allow all
    try:
        addr = ipaddress.ip_address(ip_str)
        return any(addr in net for net in _ALLOWED_NETWORKS)
    except ValueError:
        return False


class TwilioIPMiddleware(BaseHTTPMiddleware):
    """
    Middleware that restricts /webhook/* endpoints to Twilio IPs only.

    Non-webhook endpoints (e.g., /auth/*, /health) are not restricted.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        # Only filter webhook endpoints
        if path.startswith("/webhook"):
            forwarded = request.headers.get("X-Forwarded-For", "")
            client_ip = forwarded.split(",")[0].strip() if forwarded else (
                request.client.host if request.client else "unknown"
            )

            if not _is_twilio_ip(client_ip):
                logger.warning(
                    "BLOCKED non-Twilio IP on webhook: %s -> %s",
                    client_ip, path,
                )
                return Response(
                    content="Forbidden: IP not in Twilio allowlist",
                    status_code=403,
                )

        return await call_next(request)
