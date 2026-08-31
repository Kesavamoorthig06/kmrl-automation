"""
Role-aware session-based conversation manager for the WhatsApp bot.

Official bot template -- interactive menu navigation with confirm/cancel.

States:
  GREETING            -> first contact, introduce & ask for Employee ID
  AWAITING_AUTH       -> waiting for employee ID input
  MAIN_MENU           -> role-based main menu with numbered options
  AWAITING_TRAIN_ID   -> fitness role: waiting for train ID
  UPLOADING_CERTS     -> fitness role: accepting cert PDFs one by one
  CONFIRM_CERT        -> fitness role: confirm/cancel extracted cert
  UPLOADING_BRANDING  -> marketing role: accepting branding contract PDF
  CONFIRM_BRANDING    -> marketing role: confirm/cancel extracted contract
  COMPLETE            -> post-action menu: upload more / main menu / logout

Role routing:
  MAINTENANCE  -> fitness_certificate_pipeline (rolling_stock certs)
  SIGNALLING   -> fitness_certificate_pipeline (signalling certs)
  SAFETY       -> fitness_certificate_pipeline (safety certs)
  MARKETING    -> branding_contract_pipeline
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from employee_db import (
    lookup_employee,
    is_fitness_role,
    is_branding_role,
    is_admin_role,
    role_display,
    ROLE_MAINTENANCE,
    ROLE_SIGNALLING,
    ROLE_SAFETY,
    ROLE_MARKETING,
    ROLE_ADMIN,
    ROLE_CERT_DOMAINS,
)


class State(str, Enum):
    GREETING = "greeting"
    AWAITING_AUTH = "awaiting_auth"
    MAIN_MENU = "main_menu"
    AWAITING_TRAIN_ID = "awaiting_train_id"
    UPLOADING_CERTS = "uploading_certs"
    CONFIRM_CERT = "confirm_cert"
    UPLOADING_BRANDING = "uploading_branding"
    CONFIRM_BRANDING = "confirm_branding"
    COMPLETE = "complete"
    # Schedule states (admin only)
    SCHEDULE_MENU = "schedule_menu"
    SCHEDULE_MANUAL_SELECT = "schedule_manual_select"
    SCHEDULE_CONFIRM = "schedule_confirm"
    SCHEDULE_CLOSE_CONFIRM = "schedule_close_confirm"


# -- The 3 certificate types that must be uploaded -----------------

CERT_TYPES = [
    ("Rolling Stock Certificate", "rolling_stock",
     "Wheel diameter, brake pads, bogie frame, axle load, pantograph, "
     "door mechanism, coupler, suspension, traction motor, HVAC, "
     "auxiliary power, headlight."),
    ("Signalling Certificate", "signalling",
     "Signal aspect visibility, track circuit resistance, ATP response "
     "time, point machine force, balise read range, interlocking logic, "
     "cab radio latency."),
    ("Safety Certificate", "safety",
     "Fire detection time, emergency brake distance, smoke extraction "
     "rate, earthing resistance, door interlock force, deadman response, "
     "evacuation lighting, coupler shear strength, EMI emission, "
     "PA system intelligibility."),
]


# -- Session dataclass ---------------------------------------------

@dataclass
class Session:
    state: State = State.GREETING
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    role: Optional[str] = None
    train_id: Optional[str] = None
    uploaded_certs: list[str] = field(default_factory=list)
    results: list[dict] = field(default_factory=list)
    branding_result: Optional[dict] = None
    # Pending confirmation fields
    pending_result: Optional[dict] = None
    pending_cert_info: Optional[tuple] = None
    pending_formatted: Optional[str] = None
    last_active: float = field(default_factory=time.time)
    # Schedule fields (admin only)
    pending_schedule: list[str] = field(default_factory=list)
    schedule_mode: Optional[str] = None  # "auto" or "manual"

    def remaining_certs(self) -> list[tuple[str, str, str]]:
        return [c for c in CERT_TYPES if c[1] not in self.uploaded_certs]

    @property
    def pipeline(self) -> str:
        if self.role and is_branding_role(self.role):
            return "branding_contract_pipeline"
        return "fitness_certificate_pipeline"

    def clear_pending(self):
        self.pending_result = None
        self.pending_cert_info = None
        self.pending_formatted = None


# -- In-memory session store (keyed by phone number) ---------------

_sessions: dict[str, Session] = {}
SESSION_TIMEOUT = 3600


def get_session(phone: str) -> Session:
    now = time.time()
    sess = _sessions.get(phone)
    if sess and (now - sess.last_active) > SESSION_TIMEOUT:
        sess = None
    if sess is None:
        sess = Session()
        _sessions[phone] = sess
    sess.last_active = now
    return sess


def reset_session(phone: str) -> Session:
    sess = Session()
    _sessions[phone] = sess
    return sess


# -- Validators ----------------------------------------------------

_EMP_ID_RE = re.compile(r"^[A-Za-z]{2,5}[-/]?\d{3,6}$")


def validate_employee_id(text: str) -> Optional[str]:
    cleaned = text.strip().upper().replace(" ", "")
    return cleaned if _EMP_ID_RE.match(cleaned) else None


_TRAIN_ID_RE = re.compile(
    r"\b(T[- ]?\d{1,4}|TS[- ]?\d{1,4}|[A-Z]{2,4}[- ]?\d{2,5})\b",
    re.IGNORECASE,
)


def extract_train_id(text: str) -> Optional[str]:
    m = _TRAIN_ID_RE.search(text)
    return m.group(0).strip().upper().replace(" ", "-") if m else None


# -- Global command detection --------------------------------------

CONFIRM_WORDS = {"confirm", "yes", "y", "ok", "proceed", "save"}
CANCEL_WORDS = {"cancel", "no", "n", "discard", "reject"}
BACK_WORDS = {"back", "previous", "go back"}
MENU_WORDS = {"menu", "main menu", "home"}
RESTART_WORDS = {"restart", "reset", "start over", "new"}
HELP_WORDS = {"help", "?", "info"}
GREETING_WORDS = {"hi", "hello", "hey", "start"}


def is_confirm(text: str) -> bool:
    return text.lower().strip() in CONFIRM_WORDS


def is_cancel(text: str) -> bool:
    return text.lower().strip() in CANCEL_WORDS


def is_back(text: str) -> bool:
    return text.lower().strip() in BACK_WORDS


def is_menu(text: str) -> bool:
    return text.lower().strip() in MENU_WORDS


def is_restart(text: str) -> bool:
    return text.lower().strip() in RESTART_WORDS


def is_help(text: str) -> bool:
    return text.lower().strip() in HELP_WORDS


def is_greeting(text: str) -> bool:
    return text.lower().strip() in GREETING_WORDS


# -- Message builders ----------------------------------------------

def greeting_message() -> str:
    return (
        "================================\n"
        "  KMRL Document Upload Portal\n"
        "================================\n\n"
        "Welcome! I am the official KMRL\n"
        "document upload assistant.\n\n"
        "I help *authorised personnel* upload:\n"
        "  > Fitness Certificates\n"
        "  > Branding Contracts\n\n"
        "Only verified KMRL employees\n"
        "may proceed.\n\n"
        "--------------------------------\n"
        "  Send your *Employee ID*\n"
        "  to authenticate.\n"
        "--------------------------------\n"
        "_(e.g. KMRL-1001, EMP001)_"
    )


def main_menu_message(name: str, role: str) -> str:
    role_label = role_display(role)
    header = (
        "================================\n"
        "       KMRL Main Menu\n"
        "================================\n\n"
        "  " + name + "\n"
        "  " + role_label + "\n\n"
    )
    if is_admin_role(role):
        options = (
            "Please choose an option:\n\n"
            " 1  *Create Schedule*\n"
            "     Deploy trains for service\n"
            "     (one-click or manual)\n\n"
            " 2  *View Active Schedule*\n"
            "     See currently deployed trains\n\n"
            " 3  *Close Schedule*\n"
            "     Trains returned to depot\n\n"
            " 4  *Help & Info*\n"
            "     Get help using this bot\n\n"
            " 0  *Logout*\n"
            "     End current session\n"
        )
        footer = (
            "\n--------------------------------\n"
            "  Reply with *1*, *2*, *3*, *4*, or *0*"
        )
    elif is_fitness_role(role):
        options = (
            "Please choose an option:\n\n"
            " 1  *Upload Certificates*\n"
            "     Upload fitness certificates\n"
            "     for a train\n\n"
            " 2  *View Upload History*\n"
            "     Check previous uploads\n\n"
            " 3  *Help & Info*\n"
            "     Get help using this bot\n\n"
            " 0  *Logout*\n"
            "     End current session\n"
        )
    else:
        options = (
            "Please choose an option:\n\n"
            " 1  *Upload Contract*\n"
            "     Upload branding contract\n"
            "     PDF for processing\n\n"
            " 2  *View Upload History*\n"
            "     Check previous uploads\n\n"
            " 3  *Help & Info*\n"
            "     Get help using this bot\n\n"
            " 0  *Logout*\n"
            "     End current session\n"
        )
    footer = (
        "\n--------------------------------\n"
        "  Reply with *1*, *2*, *3*, or *0*"
    )
    return header + options + footer


def auth_success_message(emp_id: str, name: str, role: str) -> str:
    role_label = role_display(role)
    return (
        "================================\n"
        "  Authentication Successful\n"
        "================================\n\n"
        "  Name: *" + name + "*\n"
        "  ID:   " + emp_id + "\n"
        "  Role: *" + role_label + "*\n"
    )


def auth_fail_message() -> str:
    return (
        "================================\n"
        "  Authentication Failed\n"
        "================================\n\n"
        "Employee ID not found.\n\n"
        "Please check your ID & try again.\n"
        "Expected: *KMRL-1001*, *EMP001*\n\n"
        "Contact HR if you need access.\n\n"
        "--------------------------------\n"
        "  Try again or type *restart*"
    )


def auth_format_fail_message() -> str:
    return (
        "That doesn't look like a valid\n"
        "Employee ID.\n\n"
        "Expected: 2-5 letters + 3-6 digits\n"
        "Examples: *KMRL-1001*, *EMP001*\n\n"
        "--------------------------------\n"
        "Please try again."
    )


def train_id_prompt_message() -> str:
    return (
        "================================\n"
        "  Fitness Certificate Upload\n"
        "================================\n\n"
        "Please provide the *Train ID*\n"
        "you are uploading certificates for.\n\n"
        "_(e.g. T-001, TS-1023)_\n\n"
        "--------------------------------\n"
        "Reply *back* for main menu"
    )


def train_id_set_message(train_id: str) -> str:
    lines = [
        "================================",
        "  Train: " + train_id,
        "================================\n",
        "Upload *3 certificate PDFs*:\n",
    ]
    for i, (name, _domain, desc) in enumerate(CERT_TYPES, 1):
        lines.append("  " + str(i) + ". *" + name + "*")
        lines.append("     " + desc + "\n")
    lines.append("--------------------------------")
    lines.append("Send the *first PDF* now.")
    lines.append("Reply *back* for main menu")
    return "\n".join(lines)


def train_id_fail_message() -> str:
    return (
        "Invalid Train ID format.\n\n"
        "Expected: letter(s) + number\n"
        "e.g. *T-001*, *TS-1023*\n\n"
        "--------------------------------\n"
        "Try again or *back* for menu"
    )


def branding_upload_prompt_message() -> str:
    return (
        "================================\n"
        "  Branding Contract Upload\n"
        "================================\n\n"
        "Send your branding contract\n"
        "PDF now.\n\n"
        "I will extract and validate all\n"
        "contract details automatically.\n\n"
        "--------------------------------\n"
        "Reply *back* for main menu"
    )


def confirm_cert_message(cert_name: str, result: dict) -> str:
    score = result.get("final_score", result.get("fitness", {}).get("final_score", "N/A"))
    critical = result.get("critical_fail", result.get("fitness", {}).get("critical_fail", False))
    if critical:
        status = "FAIL"
    elif score != "N/A" and float(score) >= 0.7:
        status = "PASS"
    else:
        status = "MARGINAL"
    return (
        "================================\n"
        "  " + cert_name + " - Preview\n"
        "================================\n\n"
        "  Score:  *" + str(score) + "*\n"
        "  Status: *" + status + "*\n\n"
        "================================\n"
        "  Reply *confirm* to save\n"
        "  Reply *cancel*  to discard\n"
        "================================"
    )


def confirm_branding_message(formatted_preview: str) -> str:
    return (
        "================================\n"
        "  Contract Preview\n"
        "================================\n\n"
        + formatted_preview + "\n\n"
        "================================\n"
        "  Reply *confirm* to save\n"
        "  Reply *cancel*  to discard\n"
        "================================"
    )


def cert_confirmed_message(cert_name: str, remaining: int) -> str:
    msg = "*" + cert_name + "* saved!\n"
    if remaining > 0:
        msg += (
            "\n" + str(remaining) + " certificate(s) remaining.\n"
            "Send the next PDF.\n\n"
            "--------------------------------\n"
            "Reply *back* for main menu"
        )
    return msg


def cert_cancelled_message(cert_name: str) -> str:
    return (
        "*" + cert_name + "* discarded.\n\n"
        "Send the PDF again to re-upload.\n\n"
        "--------------------------------\n"
        "Reply *back* for main menu"
    )


def branding_confirmed_message(session, formatted_reply: str) -> str:
    return (
        "================================\n"
        "  Contract Saved\n"
        "================================\n\n"
        + formatted_reply + "\n\n"
        "Uploaded by: " + str(session.employee_name) + "\n"
        "  (" + str(session.employee_id) + ")\n"
    )


def branding_cancelled_message() -> str:
    return (
        "*Contract discarded.*\n\n"
        "Send the PDF again to\n"
        "re-upload.\n\n"
        "--------------------------------\n"
        "Reply *back* for main menu"
    )


def all_certs_complete_message(session) -> str:
    lines = [
        "================================",
        "  All Certificates Uploaded",
        "  Train: " + str(session.train_id),
        "================================\n",
        "" + str(session.employee_name) + " (" + str(session.employee_id) + ")\n",
        "Results:\n",
    ]
    for r in session.results:
        name = r.get("cert_name", "?")
        score = r.get("final_score", "?")
        critical = r.get("critical_fail", False)
        if critical:
            tag = "[FAIL]"
        elif score != "?" and float(score) >= 0.7:
            tag = "[PASS]"
        else:
            tag = "[MARGINAL]"
        lines.append("  " + tag + " " + name + ": *" + str(score) + "*")
    any_fail = any(r.get("critical_fail") for r in session.results)
    if any_fail:
        lines.append("\n*CRITICAL FAILURES detected.*\nPlease review and take action.")
    else:
        lines.append("\nAll certificates within limits.")
    return "\n".join(lines)


def post_action_message() -> str:
    return (
        "\n================================\n"
        "  What would you like to do?\n"
        "================================\n\n"
        " 1  *Upload More*\n"
        "     Continue uploading documents\n\n"
        " 2  *Main Menu*\n"
        "     Return to main menu\n\n"
        " 0  *Logout*\n"
        "     End your session\n\n"
        "--------------------------------\n"
        "  Reply with *1*, *2*, or *0*"
    )


def pending_certs_message(session) -> str:
    remaining = session.remaining_certs()
    if not remaining:
        return "All 3 certificates uploaded!"
    lines = ["*Certificates still needed:*\n"]
    for i, (name, _, _desc) in enumerate(remaining, 1):
        lines.append("  " + str(i) + ". *" + name + "*")
    lines.append("\nSend the next PDF now.")
    lines.append("\n--------------------------------")
    lines.append("Reply *back* for main menu")
    return "\n".join(lines)


def not_a_pdf_message() -> str:
    return (
        "Please send a *PDF file* only.\n\n"
        "I can only process documents in\n"
        "PDF format.\n\n"
        "Attach the PDF and send it."
    )


def security_violation_message(role: str, attempted: str) -> str:
    role_label = role_display(role)
    return (
        "================================\n"
        "  Access Denied\n"
        "================================\n\n"
        "Your role (*" + role_label + "*) does not\n"
        "have permission to upload " + attempted + ".\n\n"
        "Contact admin if this is an error."
    )


def help_message(role: str = None) -> str:
    base = (
        "================================\n"
        "  Help & Commands\n"
        "================================\n\n"
        "*Navigation commands:*\n"
        "  *menu*     - Main menu\n"
        "  *back*     - Go back\n"
        "  *restart*  - New session\n"
        "  *help*     - This message\n\n"
        "*During uploads:*\n"
        "  *confirm*  - Save result\n"
        "  *cancel*   - Discard result\n"
        "  *status*   - Check progress\n"
    )
    if role and is_admin_role(role):
        base += (
            "\n*Your workflow (Admin):*\n"
            "  1. Create Schedule\n"
            "     - One-Click or Manual\n"
            "  2. View deployed trains\n"
            "  3. Close schedule when\n"
            "     trains return to depot\n"
        )
    elif role and is_fitness_role(role):
        base += (
            "\n*Your workflow:*\n"
            "  1. Enter Train ID\n"
            "  2. Upload 3 certificate PDFs\n"
            "  3. Confirm each extraction\n"
            "  4. View summary\n"
        )
    elif role and is_branding_role(role):
        base += (
            "\n*Your workflow:*\n"
            "  1. Upload contract PDF\n"
            "  2. Review extraction preview\n"
            "  3. Confirm or cancel\n"
            "  4. View summary\n"
        )
    base += "\n================================"
    return base


def upload_history_message(session) -> str:
    if not session.results and not session.branding_result:
        return (
            "================================\n"
            "  Upload History\n"
            "================================\n\n"
            "No uploads in this session yet.\n\n"
            "--------------------------------\n"
            "Reply *menu* for main menu"
        )
    lines = [
        "================================",
        "  Upload History",
        "================================\n",
    ]
    if session.results:
        lines.append("Train: " + str(session.train_id or "N/A") + "\n")
        for r in session.results:
            name = r.get("cert_name", "?")
            score = r.get("final_score", "?")
            critical = r.get("critical_fail", False)
            if critical:
                tag = "[FAIL]"
            elif score != "?" and float(score) >= 0.7:
                tag = "[PASS]"
            else:
                tag = "[MARGINAL]"
            lines.append("  " + tag + " " + name + ": *" + str(score) + "*")
    if session.branding_result:
        contract = session.branding_result.get("contract", {})
        lines.append("\nBranding: " + str(contract.get("campaign_name", "N/A")))
        lines.append("  Brand: " + str(contract.get("brand_name", "N/A")))
        lines.append("  Fields: " + str(session.branding_result.get("fields_extracted", 0)))
    lines.append("\n--------------------------------")
    lines.append("Reply *menu* for main menu")
    return "\n".join(lines)


def logout_message(name: str) -> str:
    return (
        "================================\n"
        "  Session Ended\n"
        "================================\n\n"
        "Goodbye, " + name + "!\n\n"
        "Your session has been closed.\n"
        "Send any message to start again.\n"
        "================================"
    )


def wrong_state_message() -> str:
    return (
        "================================\n"
        "  KMRL Document Upload Portal\n"
        "================================\n\n"
        "Send any message to begin.\n"
        "================================"
    )


# -- Schedule-related messages (admin only) -------------------------

def schedule_already_active_message(schedule: dict) -> str:
    count = schedule.get("count", 0)
    created_at = schedule.get("created_at", "")
    created_by = schedule.get("created_by", "")
    return (
        "================================\n"
        "  Schedule Already Active\n"
        "================================\n\n"
        "A schedule with *" + str(count) + " trains* is\n"
        "already deployed.\n\n"
        "  Created: " + str(created_at[:19]) + "\n"
        "  By: " + str(created_by) + "\n\n"
        "Close the current schedule first\n"
        "(trains must return to depot)\n"
        "before creating a new one.\n\n"
        "--------------------------------\n"
        "Reply *menu* for main menu"
    )


def schedule_menu_message() -> str:
    return (
        "================================\n"
        "  Create Train Schedule\n"
        "================================\n\n"
        "Choose how to build the schedule:\n\n"
        " 1  *One-Click Optimal*\n"
        "     Auto-select top 14 trains\n"
        "     by ML score (recommended)\n\n"
        " 2  *Manual Select*\n"
        "     Pick trains individually\n"
        "     by entering train IDs\n\n"
        "--------------------------------\n"
        "Reply *back* for main menu"
    )


def schedule_optimal_preview_message(trains: list[dict]) -> str:
    lines = [
        "================================",
        "  One-Click Optimal Preview",
        "  " + str(len(trains)) + " trains selected",
        "================================\n",
    ]
    for i, t in enumerate(trains, 1):
        score_pct = round(t["score"] * 100)
        lines.append(
            "  " + str(i) + ". *" + t["train_id"] + "*"
            "  Score: " + str(score_pct)
            + "  Bay: " + str(t["stabling_bay"])
        )
    lines.append("")
    lines.append("================================")
    lines.append("  Reply *confirm* to deploy")
    lines.append("  Reply *cancel*  to go back")
    lines.append("================================")
    return "\n".join(lines)


def schedule_manual_prompt_message(available: list[dict]) -> str:
    lines = [
        "================================",
        "  Manual Train Selection",
        "================================\n",
        "Available trains for service:\n",
    ]
    for t in available:
        score_pct = round(t["score"] * 100)
        lines.append(
            "  *" + t["train_id"] + "*"
            "  Score: " + str(score_pct)
            + "  Bay: " + str(t["stabling_bay"])
        )
    lines.append("")
    lines.append("Enter train IDs separated by")
    lines.append("commas:")
    lines.append("_(e.g. R-001, R-004, R-010)_")
    lines.append("")
    lines.append("--------------------------------")
    lines.append("Reply *back* for schedule menu")
    return "\n".join(lines)


def schedule_manual_preview_message(train_ids: list[str]) -> str:
    lines = [
        "================================",
        "  Manual Selection Preview",
        "  " + str(len(train_ids)) + " trains selected",
        "================================\n",
    ]
    for i, tid in enumerate(train_ids, 1):
        lines.append("  " + str(i) + ". *" + tid + "*")
    lines.append("")
    lines.append("================================")
    lines.append("  Reply *confirm* to deploy")
    lines.append("  Reply *cancel*  to go back")
    lines.append("================================")
    return "\n".join(lines)


def schedule_created_message(schedule: dict) -> str:
    count = schedule.get("count", 0)
    mode = schedule.get("mode", "one_click")
    mode_label = "One-Click Optimal" if mode == "one_click" else "Manual Selection"
    train_ids = schedule.get("train_ids", [])
    lines = [
        "================================",
        "  Schedule Created!",
        "================================\n",
        "  Trains: *" + str(count) + "*",
        "  Mode:   " + mode_label,
        "  Time:   " + str(schedule.get("created_at", "")[:19]) + "\n",
        "Deployed trains:",
    ]
    for tid in train_ids:
        lines.append("  > " + tid)
    lines.append("")
    lines.append("This schedule is now ACTIVE.")
    lines.append("No new schedule can be created")
    lines.append("until trains return to depot.")
    lines.append("")
    lines.append("================================")
    lines.append("Reply *menu* for main menu")
    return "\n".join(lines)


def schedule_view_message(schedule: dict) -> str:
    if schedule is None:
        return (
            "================================\n"
            "  No Active Schedule\n"
            "================================\n\n"
            "No trains are currently deployed.\n"
            "Use *Create Schedule* to deploy.\n\n"
            "--------------------------------\n"
            "Reply *menu* for main menu"
        )
    count = schedule.get("count", 0)
    train_ids = schedule.get("train_ids", [])
    mode = schedule.get("mode", "one_click")
    mode_label = "One-Click" if mode == "one_click" else "Manual"
    lines = [
        "================================",
        "  Active Schedule",
        "================================\n",
        "  Trains: *" + str(count) + "*",
        "  Mode:   " + mode_label,
        "  Created: " + str(schedule.get("created_at", "")[:19]) + "\n",
        "Deployed trains:",
    ]
    for tid in train_ids:
        lines.append("  > " + tid)
    lines.append("")
    lines.append("--------------------------------")
    lines.append("Reply *menu* for main menu")
    return "\n".join(lines)


def schedule_close_confirm_message(schedule: dict) -> str:
    count = schedule.get("count", 0)
    return (
        "================================\n"
        "  Close Schedule?\n"
        "================================\n\n"
        "This will mark all *" + str(count) + " trains*\n"
        "as returned to depot.\n\n"
        "A new schedule can then be\n"
        "created.\n\n"
        "================================\n"
        "  Reply *confirm* to close\n"
        "  Reply *cancel*  to keep active\n"
        "================================"
    )


def schedule_closed_message() -> str:
    return (
        "================================\n"
        "  Schedule Closed\n"
        "================================\n\n"
        "All trains marked as returned\n"
        "to depot.\n\n"
        "You can now create a new\n"
        "schedule.\n\n"
        "--------------------------------\n"
        "Reply *menu* for main menu"
    )


def schedule_no_active_message() -> str:
    return (
        "================================\n"
        "  No Active Schedule\n"
        "================================\n\n"
        "There is no active schedule\n"
        "to close.\n\n"
        "--------------------------------\n"
        "Reply *menu* for main menu"
    )
