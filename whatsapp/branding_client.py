"""
Branding contract client — local PDF processor for marketing contracts.

Downloads the media from Twilio, extracts text with pdfplumber, parses
branding contract fields via regex, and returns structured contract data.
No external API dependency.

Output schema:
  {
    campaign_name, brand_name, start_date, end_date,
    daily_required_hours, monthly_required_hours,
    required_trainsets, train_ids
  }
"""

from __future__ import annotations

import json
import logging
import os
import re
import tempfile
from datetime import datetime
from typing import Optional

import httpx
import pdfplumber

from config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    SUPPORTED_DOC_TYPES,
)

logger = logging.getLogger(__name__)

# ── JSON output directory ─────────────────────────────────────────

_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "extracted_data")
os.makedirs(_OUTPUT_DIR, exist_ok=True)


# ── Twilio media download (shared with cert_client) ──────────────

async def download_twilio_media(media_url: str) -> tuple[bytes, str]:
    """Download a media file from Twilio CDN (requires Basic auth)."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            media_url,
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
            follow_redirects=True,
        )
        resp.raise_for_status()
        ct = resp.headers.get("content-type", "application/octet-stream")
        return resp.content, ct


# ── Text extraction ──────────────────────────────────────────────

def _extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF using pdfplumber."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name
    try:
        pages: list[str] = []
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                txt = page.extract_text()
                if txt:
                    pages.append(txt)
        return "\n".join(pages)
    finally:
        os.unlink(tmp_path)


# ── Contract field extraction regex patterns ──────────────────────

# Dates: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD Mon YYYY, Month DD YYYY
_DATE_PATTERNS = [
    re.compile(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})"),          # DD/MM/YYYY
    re.compile(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})"),          # YYYY-MM-DD
    re.compile(r"(\d{1,2})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*,?\s*(\d{4})", re.I),
    re.compile(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})\s*,?\s*(\d{4})", re.I),
]

_MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

# Train IDs: T-001, TS-123, R-001, etc.
_TRAIN_ID_RE = re.compile(r"\b([TR]S?-\d{1,4}|R-\d{1,4})\b", re.I)

# Wrap/Contract ID: WRAP001, WRP-001, CONT-001 or KMRL ref numbers
_WRAP_ID_RE = re.compile(r"\b(WRAP\d{3,6}|WRP-\d{3,6}|CONT-\d{3,6})\b", re.I)
_KMRL_REF_RE = re.compile(r"(?:Ref\s*(?:No)?\.?\s*:?\s*)(KMRL[\w/\-]+\d+)", re.I)

# Hours patterns — supports many formats
_HOURS_DAILY_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*hours?\s+per\s+day",
    re.I,
)
_HOURS_MONTHLY_RE = re.compile(
    r"([\d,]+(?:\.\d+)?)\s*hours?\s*/?\s*month",
    re.I,
)

# Number of trainsets
_TRAINSETS_RE = re.compile(
    r"(?:(?:required\s+)?train\s*sets?|number\s+of\s+trains?|fleet\s+size)"
    r"\s*[:\-]?\s*(\d+)",
    re.I,
)
# Also match "N Complete Trainsets", "N trainsets", "scope.*N trainsets"
_TRAINSETS_INLINE_RE = re.compile(
    r"(\d+)\s+(?:complete\s+)?train\s*sets?",
    re.I,
)


def _extract_dates(text: str) -> list[str]:
    """Extract all date strings from text, return as YYYY-MM-DD."""
    dates: list[str] = []
    # Pattern 1: DD/MM/YYYY or DD-MM-YYYY
    for m in _DATE_PATTERNS[0].finditer(text):
        d, mo, y = m.group(1), m.group(2), m.group(3)
        try:
            dt = datetime.strptime(f"{d}/{mo}/{y}", "%d/%m/%Y")
            dates.append(dt.strftime("%Y-%m-%d"))
        except ValueError:
            pass
    # Pattern 2: YYYY-MM-DD
    for m in _DATE_PATTERNS[1].finditer(text):
        y, mo, d = m.group(1), m.group(2), m.group(3)
        try:
            dt = datetime.strptime(f"{y}-{mo}-{d}", "%Y-%m-%d")
            dates.append(dt.strftime("%Y-%m-%d"))
        except ValueError:
            pass
    # Pattern 3: DD Month YYYY  (e.g. 01 March 2026)
    for m in _DATE_PATTERNS[2].finditer(text):
        d, y = m.group(1), m.group(2)
        month_str = m.group(0).split()[1][:3].lower()
        mo = _MONTH_MAP.get(month_str)
        if mo:
            try:
                dt = datetime(int(y), mo, int(d))
                dates.append(dt.strftime("%Y-%m-%d"))
            except ValueError:
                pass
    # Pattern 4: Month DD, YYYY  (e.g. March 01, 2026)
    for m in _DATE_PATTERNS[3].finditer(text):
        month_str = m.group(1)[:3].lower()
        d, y = m.group(2), m.group(3)
        mo = _MONTH_MAP.get(month_str)
        if mo:
            try:
                dt = datetime(int(y), mo, int(d))
                dates.append(dt.strftime("%Y-%m-%d"))
            except ValueError:
                pass
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for d in dates:
        if d not in seen:
            seen.add(d)
            unique.append(d)
    return unique


def _parse_branding_contract(text: str) -> dict:
    """
    Parse a branding contract PDF text into structured fields.

    Supports both simple label-based formats and official KMRL LOA format.
    Returns dict with keys matching the branding_contract_output_schema.
    """
    result: dict = {
        "campaign_name": None,
        "brand_name": None,
        "wrap_id": None,
        "start_date": None,
        "end_date": None,
        "daily_required_hours": None,
        "monthly_required_hours": None,
        "required_trainsets": None,
        "train_ids": [],
        "advertisement_type": None,
        "placement_type": None,
        "contract_value": None,
        "ref_number": None,
        "interior_units": None,
        "target_impressions": None,
        "coaches_count": None,
    }

    text_lower = text.lower()

    # ── Reference number: KMRL/PR/BR-WRAP/2026/082 ──────────────
    m = _KMRL_REF_RE.search(text)
    if m:
        result["ref_number"] = m.group(1).strip()

    # ── Campaign name ────────────────────────────────────────────
    # 1) Explicit label: "Campaign Name: ..."
    m = re.search(r"(?:campaign\s*(?:name)?)\s*[:\-]\s*(.+?)(?:\n|$)", text, re.I)
    if m:
        result["campaign_name"] = m.group(1).strip().strip("'\"")

    # 2) Quoted campaign inline: 'Air-Max 2026' campaign
    if not result["campaign_name"]:
        m = re.search(r"['\u2018\u2019\"]+([^'\u2018\u2019\"]+)['\u2018\u2019\"]+\s*campaign", text, re.I)
        if m:
            result["campaign_name"] = m.group(1).strip()

    # 3) "for the ... campaign" pattern
    if not result["campaign_name"]:
        m = re.search(r"for\s+the\s+['\"]?(.+?)['\"]?\s+campaign", text, re.I)
        if m:
            result["campaign_name"] = m.group(1).strip().strip("'\"")

    # ── Brand / Licensee name ────────────────────────────────────
    # 1) Explicit label: "Brand:", "Client:", "Advertiser:", "Licensee Name:"
    m = re.search(
        r"(?:brand|client|advertiser|company|licensee)\s*(?:name)?\s*[:\-]\s*(.+?)(?:\n|$)",
        text, re.I,
    )
    if m:
        result["brand_name"] = m.group(1).strip()

    # 2) "To, The Marketing Director, <Company Name>" in the LOA header
    if not result["brand_name"]:
        m = re.search(r"To,?\s*(?:The\s+)?(?:Marketing\s+)?Director,?\s*(.+?)(?:,\s*\w+|\n)", text, re.I)
        if m:
            result["brand_name"] = m.group(1).strip().rstrip(",.")

    # ── Wrap / Contract ID ──────────────────────────────────────
    m = _WRAP_ID_RE.search(text)
    if m:
        result["wrap_id"] = m.group(1).upper()
    # Also try to extract from KMRL ref number (BR-WRAP portion)
    if not result["wrap_id"] and result["ref_number"]:
        m2 = re.search(r"BR-WRAP", result["ref_number"], re.I)
        if m2:
            result["wrap_id"] = result["ref_number"]

    # ── Dates ────────────────────────────────────────────────────
    dates = _extract_dates(text)
    # Look for labelled dates first
    start_m = re.search(
        r"(?:start\s*date|commencement\s*(?:date)?|effective\s*from|from)\s*[:\-]?\s*(.{10,40})",
        text, re.I,
    )
    end_m = re.search(
        r"(?:end\s*date|expiry\s*(?:date)?|valid\s*(?:until|till|to)|to\s*date)\s*[:\-]?\s*(.{10,40})",
        text, re.I,
    )

    if start_m:
        sd = _extract_dates(start_m.group(1))
        if sd:
            result["start_date"] = sd[0]
    if end_m:
        ed = _extract_dates(end_m.group(1))
        if ed:
            result["end_date"] = ed[0]

    # Fallback: use first two dates found (skip the doc date if we have 3+)
    if not result["start_date"] and dates:
        idx = 1 if len(dates) >= 3 else 0
        result["start_date"] = dates[idx]
    if not result["end_date"] and len(dates) >= 2:
        idx = 2 if len(dates) >= 3 else 1
        if idx < len(dates):
            result["end_date"] = dates[idx]

    # ── Daily hours ──────────────────────────────────────────────
    # Pattern: "Target Running Time: 18 Hours per Day"
    m = re.search(r"(?:target\s+)?running\s+time\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*hours?\s*(?:per\s+day)?", text, re.I)
    if m:
        result["daily_required_hours"] = float(m.group(1))

    # Pattern: "18 Hours per Day" / "Daily Hours: 18"
    if not result["daily_required_hours"]:
        m = _HOURS_DAILY_RE.search(text)
        if m:
            result["daily_required_hours"] = float(m.group(1))

    if not result["daily_required_hours"]:
        m = re.search(r"daily\s+(?:required\s+)?hours?\s*[:\-]?\s*(\d+(?:\.\d+)?)", text, re.I)
        if m:
            result["daily_required_hours"] = float(m.group(1))

    # ── Monthly hours ────────────────────────────────────────────
    # Pattern: "Total Exposure Hours: 540 Hours / Month"
    m = re.search(r"(?:total\s+)?exposure\s+hours?\s*[:\-]?\s*([\d,]+(?:\.\d+)?)\s*hours?\s*/?\s*month", text, re.I)
    if m:
        result["monthly_required_hours"] = float(m.group(1).replace(",", ""))

    # Pattern: "540 Hours / Month" or "540 Hours/Month"
    if not result["monthly_required_hours"]:
        m = _HOURS_MONTHLY_RE.search(text)
        if m:
            result["monthly_required_hours"] = float(m.group(1).replace(",", ""))

    if not result["monthly_required_hours"]:
        m = re.search(r"monthly\s+(?:required\s+)?hours?\s*[:\-]?\s*([\d,]+(?:\.\d+)?)", text, re.I)
        if m:
            result["monthly_required_hours"] = float(m.group(1).replace(",", ""))

    # Infer monthly from daily if missing (30 days)
    if result["daily_required_hours"] and not result["monthly_required_hours"]:
        result["monthly_required_hours"] = round(result["daily_required_hours"] * 30, 1)

    # ── Required trainsets ───────────────────────────────────────
    # "3 Complete Trainsets" or "Scope of Work: 3 Complete Trainsets"
    m = _TRAINSETS_INLINE_RE.search(text)
    if m:
        result["required_trainsets"] = int(m.group(1))

    if not result["required_trainsets"]:
        m = _TRAINSETS_RE.search(text)
        if m:
            result["required_trainsets"] = int(m.group(1))

    # ── Coaches count: "Total 9 Coaches" or "N Coaches" ─────────
    m = re.search(r"(?:total\s+)?(\d+)\s+coaches?", text, re.I)
    if m:
        result["coaches_count"] = int(m.group(1))

    # ── Train IDs ────────────────────────────────────────────────
    train_ids = list(set(tid.upper() for tid in _TRAIN_ID_RE.findall(text)))
    train_ids.sort()
    result["train_ids"] = train_ids

    if not result["required_trainsets"] and train_ids:
        result["required_trainsets"] = len(train_ids)

    # ── Advertisement type ───────────────────────────────────────
    # Check "Branding Format:" label first
    m = re.search(r"(?:branding\s+format|type\s+of\s+(?:ad|branding|advertisement))\s*[:\-]\s*(.+?)(?:\n|$)", text, re.I)
    if m:
        fmt_text = m.group(1).strip().lower()
        if "exterior" in fmt_text and "wrap" in fmt_text:
            result["advertisement_type"] = "exterior_wrap"
        elif "interior" in fmt_text:
            result["advertisement_type"] = "interior_panels"
        elif "full" in fmt_text:
            result["advertisement_type"] = "full_branding"
        else:
            result["advertisement_type"] = fmt_text

    # Fallback: keyword scan
    if not result["advertisement_type"]:
        for ad_type in ("full_branding", "exterior_wrap", "interior_panels",
                        "window_stickers", "door_ads"):
            if ad_type.replace("_", " ") in text_lower or ad_type in text_lower:
                result["advertisement_type"] = ad_type
                break
        if not result["advertisement_type"]:
            if "full body" in text_lower or "full wrap" in text_lower:
                result["advertisement_type"] = "full_branding"
            elif "exterior" in text_lower and "wrap" in text_lower:
                result["advertisement_type"] = "exterior_wrap"
            elif ("train wrap" in text_lower or "train_wrap" in text_lower
                  or "vinyl" in text_lower):
                result["advertisement_type"] = "exterior_wrap"
            elif "interior" in text_lower:
                result["advertisement_type"] = "interior_panels"

    # ── Placement type ───────────────────────────────────────────
    if "full body" in text_lower or "full_body" in text_lower or "full vinyl" in text_lower:
        result["placement_type"] = "full_body"
    elif "partial" in text_lower:
        result["placement_type"] = "partial"
    elif "exterior" in text_lower and "interior" in text_lower:
        result["placement_type"] = "exterior_and_interior"
    elif "exterior" in text_lower:
        result["placement_type"] = "exterior"
    elif "interior" in text_lower:
        result["placement_type"] = "interior"

    # ── Interior units: "136 Units" ──────────────────────────────
    m = re.search(r"interior\s+units?\s*[:\-]?\s*(\d+)\s*units?", text, re.I)
    if m:
        result["interior_units"] = int(m.group(1))
    if not result["interior_units"]:
        m = re.search(r"(\d+)\s+units?\s*\(", text, re.I)
        if m:
            result["interior_units"] = int(m.group(1))

    # ── Target impressions: "2,50,000 unique viewers" ────────────
    m = re.search(
        r"(?:target\s+)?impressions?\s*[:\-]?\s*([\d,]+)\s*(?:unique\s+)?(?:viewers?|impressions?)",
        text, re.I,
    )
    if m:
        result["target_impressions"] = m.group(1).strip()
    if not result["target_impressions"]:
        m = re.search(r"([\d,]+)\s+unique\s+viewers?", text, re.I)
        if m:
            result["target_impressions"] = m.group(1).strip()

    # ── Contract value ───────────────────────────────────────────
    m = re.search(
        r"(?:contract\s*value|total\s*(?:value|amount|cost)|license\s*fee|amount)\s*[:\-]?\s*"
        r"(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
        text, re.I,
    )
    if m:
        result["contract_value"] = float(m.group(1).replace(",", ""))

    return result


# ── Save results to JSON ─────────────────────────────────────────

def _save_branding_json(result: dict, employee_id: str | None) -> str:
    """Save branding contract extraction result to JSON. Returns file path."""
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    campaign = (result.get("campaign_name") or "unknown").replace(" ", "_")[:30]
    tag = f"branding_{campaign}_{ts}"

    path = os.path.join(_OUTPUT_DIR, f"{tag}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({
            "type": "branding_contract",
            "extracted_at": datetime.now().isoformat(),
            "uploaded_by": employee_id,
            **result,
        }, f, indent=2, ensure_ascii=False, default=str)
    logger.info("Saved branding result -> %s", path)
    return path


# ── Public API ────────────────────────────────────────────────────

async def ingest_branding_contract(
    media_url: str,
    content_type: str | None,
    employee_id: Optional[str] = None,
) -> dict:
    """
    Download PDF from Twilio, extract text, parse branding contract fields,
    and return structured contract data — all locally.
    """
    # 1. Download
    file_bytes, ct = await download_twilio_media(media_url)
    if content_type:
        ct = content_type

    ct_base = ct.split(";")[0].strip()
    if ct_base not in SUPPORTED_DOC_TYPES:
        return {"success": False, "error": f"Unsupported document type: {ct_base}"}

    # 2. Extract text
    try:
        text = _extract_pdf_text(file_bytes)
    except Exception as exc:
        logger.exception("PDF text extraction failed")
        return {"success": False, "error": f"Could not read PDF: {exc}"}

    if not text or len(text.strip()) < 20:
        return {"success": False, "error": "PDF appears to be empty or image-only."}

    logger.info("Extracted %d chars from branding PDF", len(text))

    # 3. Parse contract fields
    contract = _parse_branding_contract(text)
    logger.info("Parsed branding contract: campaign=%s brand=%s",
                contract.get("campaign_name"), contract.get("brand_name"))

    # Count how many fields were extracted
    filled = sum(1 for k, v in contract.items() if v is not None and v != [])
    total = len(contract)

    if filled < 2:
        return {
            "success": False,
            "error": "Could not find branding contract fields in the PDF. "
                     "Please ensure the document contains campaign name, "
                     "brand/client name, and contract dates.",
        }

    # 4. Save to JSON
    json_path = _save_branding_json(contract, employee_id)

    return {
        "success": True,
        "pipeline": "branding_contract",
        "contract": contract,
        "fields_extracted": filled,
        "fields_total": total,
        "json_path": json_path,
        "text_length": len(text),
    }


def format_branding_reply(data: dict) -> str:
    """Format branding extraction result into a WhatsApp-friendly message."""
    if not data.get("success"):
        return f"Could not process: {data.get('error', 'Unknown error')}"

    c = data.get("contract", {})
    lines = [
        "📋 *Branding Contract Processed!*\n",
    ]

    if c.get("ref_number"):
        lines.append(f"📎 Ref: *{c['ref_number']}*")
    if c.get("campaign_name"):
        lines.append(f"🎯 Campaign: *{c['campaign_name']}*")
    if c.get("brand_name"):
        lines.append(f"🏢 Brand/Licensee: *{c['brand_name']}*")
    if c.get("wrap_id"):
        lines.append(f"🔖 Wrap ID: *{c['wrap_id']}*")
    if c.get("start_date") and c.get("end_date"):
        lines.append(f"📅 Period: {c['start_date']} to {c['end_date']}")
    elif c.get("start_date"):
        lines.append(f"📅 Start: {c['start_date']}")
    if c.get("daily_required_hours"):
        lines.append(f"⏰ Daily hours: *{c['daily_required_hours']}*")
    if c.get("monthly_required_hours"):
        lines.append(f"📆 Monthly hours: *{c['monthly_required_hours']}*")
    if c.get("target_impressions"):
        lines.append(f"👁️ Target impressions: *{c['target_impressions']}* /month")
    if c.get("required_trainsets"):
        coach_info = f" ({c['coaches_count']} coaches)" if c.get("coaches_count") else ""
        lines.append(f"🚆 Trainsets: *{c['required_trainsets']}*{coach_info}")
    if c.get("train_ids"):
        lines.append(f"🚃 Trains: {', '.join(c['train_ids'])}")
    if c.get("advertisement_type"):
        lines.append(f"📌 Ad type: *{c['advertisement_type'].replace('_', ' ').title()}*")
    if c.get("placement_type"):
        lines.append(f"📐 Placement: *{c['placement_type'].replace('_', ' ').title()}*")
    if c.get("interior_units"):
        lines.append(f"🪟 Interior units: *{c['interior_units']}*")
    if c.get("contract_value"):
        lines.append(f"💰 Value: Rs. {c['contract_value']:,.0f}")

    lines.append(f"\n✅ {data['fields_extracted']}/{data['fields_total']} fields extracted.")
    return "\n".join(lines)
