"""
Employee database — in-memory lookup for role-based authentication.

Roles:
  MAINTENANCE  — can upload fitness certificates (rolling_stock domain)
  SIGNALLING   — can upload fitness certificates (signalling domain)
  SAFETY       — can upload fitness certificates (safety domain)
  MARKETING    — can upload branding contracts

Table: employees {employee_id, name, role}
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Role constants ────────────────────────────────────────────────

ROLE_MAINTENANCE = "MAINTENANCE"
ROLE_SIGNALLING = "SIGNALLING"
ROLE_SAFETY = "SAFETY"
ROLE_MARKETING = "MARKETING"
ROLE_ADMIN = "ADMIN"

ALL_ROLES = {ROLE_MAINTENANCE, ROLE_SIGNALLING, ROLE_SAFETY, ROLE_MARKETING, ROLE_ADMIN}

# Roles that upload fitness certificates
FITNESS_ROLES = {ROLE_MAINTENANCE, ROLE_SIGNALLING, ROLE_SAFETY}

# Roles that upload branding contracts
BRANDING_ROLES = {ROLE_MARKETING}

# Roles that can create/close schedules
ADMIN_ROLES = {ROLE_ADMIN}


# ── Role → allowed cert domains mapping ───────────────────────────

ROLE_CERT_DOMAINS: dict[str, list[str]] = {
    ROLE_MAINTENANCE: ["rolling_stock"],
    ROLE_SIGNALLING: ["signalling"],
    ROLE_SAFETY: ["safety"],
}


# ── Employee records ──────────────────────────────────────────────
# In production this would be a DB table; here we use a dict.

_EMPLOYEES: dict[str, dict] = {
    # Maintenance staff
    "KMRL-1001": {"name": "Rajesh Kumar",      "role": ROLE_MAINTENANCE},
    "KMRL-1002": {"name": "Anitha Nair",       "role": ROLE_MAINTENANCE},
    "KMRL-1003": {"name": "Suresh Menon",      "role": ROLE_MAINTENANCE},
    # Signalling staff
    "KMRL-2001": {"name": "Priya Sharma",      "role": ROLE_SIGNALLING},
    "KMRL-2002": {"name": "Deepak Pillai",     "role": ROLE_SIGNALLING},
    # Safety staff
    "KMRL-3001": {"name": "Lakshmi Devi",      "role": ROLE_SAFETY},
    "KMRL-3002": {"name": "Arun George",       "role": ROLE_SAFETY},
    # Marketing staff
    "KMRL-4001": {"name": "Meera Krishnan",    "role": ROLE_MARKETING},
    "KMRL-4002": {"name": "Vishnu Prasad",     "role": ROLE_MARKETING},
    "KMRL-4003": {"name": "Sneha Thomas",      "role": ROLE_MARKETING},
    # Admin / Operations staff
    "KMRL-9001": {"name": "Operations Admin",   "role": ROLE_ADMIN},
    "KMRL-9002": {"name": "Control Room",       "role": ROLE_ADMIN},
    # Generic test IDs (accept any format matching the regex)
    "EMP001":    {"name": "Test Maintenance",   "role": ROLE_MAINTENANCE},
    "EMP002":    {"name": "Test Signalling",    "role": ROLE_SIGNALLING},
    "EMP003":    {"name": "Test Safety",        "role": ROLE_SAFETY},
    "EMP004":    {"name": "Test Marketing",     "role": ROLE_MARKETING},
    "EMP005":    {"name": "Test Admin",         "role": ROLE_ADMIN},
}


def lookup_employee(employee_id: str) -> Optional[dict]:
    """
    Look up an employee by ID.

    Returns
    -------
    dict | None
        {"employee_id": ..., "name": ..., "role": ...} or None if not found.
    """
    emp_id = employee_id.strip().upper()
    record = _EMPLOYEES.get(emp_id)
    if record is None:
        logger.info("Employee lookup MISS: %s", emp_id)
        return None
    logger.info("Employee lookup HIT: %s -> %s (%s)", emp_id, record["name"], record["role"])
    return {"employee_id": emp_id, **record}


def is_fitness_role(role: str) -> bool:
    """True if the role uploads fitness certificates."""
    return role in FITNESS_ROLES


def is_branding_role(role: str) -> bool:
    """True if the role uploads branding contracts."""
    return role in BRANDING_ROLES


def is_admin_role(role: str) -> bool:
    """True if the role can create/close schedules."""
    return role in ADMIN_ROLES


def role_display(role: str) -> str:
    """Human-readable role label."""
    return {
        ROLE_MAINTENANCE: "Maintenance Engineer",
        ROLE_SIGNALLING: "Signalling Engineer",
        ROLE_SAFETY: "Safety Inspector",
        ROLE_MARKETING: "Marketing Officer",
        ROLE_ADMIN: "Operations Administrator",
    }.get(role, role)
