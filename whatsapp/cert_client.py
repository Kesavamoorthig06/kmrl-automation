"""
Certificate client -- local PDF processor.

Downloads the media from Twilio, extracts text with pdfplumber, parses
parameter values via regex, validates against the parameter registry, and
computes a fitness score.  No external API dependency.
"""

from __future__ import annotations

import json
import logging
import os
import re
import tempfile
from io import BytesIO
from typing import Optional

import httpx
import pdfplumber

from config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    SUPPORTED_DOC_TYPES,
)

logger = logging.getLogger(__name__)

# ── Load parameter registry once at import time ──────────────────

_REGISTRY_PATH = os.path.join(
    os.path.dirname(__file__), os.pardir,
    "cert_rag", "config", "parameter_registry.json",
)

with open(_REGISTRY_PATH, encoding="utf-8") as _f:
    _REGISTRY: list[dict] = json.load(_f)["parameters"]

# Build quick-lookup maps
_PARAMS_BY_ID: dict[str, dict] = {p["param_id"]: p for p in _REGISTRY}
_PARAMS_BY_DOMAIN: dict[str, list[dict]] = {}
for _p in _REGISTRY:
    _PARAMS_BY_DOMAIN.setdefault(_p["domain"], []).append(_p)

# Criticality weights (same as cert_rag fitness_scorer)
_CRIT_WEIGHT = {"critical": 3.0, "high": 2.0, "medium": 1.0, "low": 0.5}

# ── JSON output directory ─────────────────────────────────────────

_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "extracted_data")
os.makedirs(_OUTPUT_DIR, exist_ok=True)


def _save_results_json(result: dict, train_id: str | None, domain: str | None) -> None:
    """
    Persist the extraction/validation result to JSON files:
      extracted_data/
        <train_id>_<domain>_result.json      — full result with scores
        <train_id>_<domain>_parameters.json   — just the parameter table
    """
    from datetime import datetime

    tag = f"{train_id or 'unknown'}_{domain or 'unknown'}"
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    # --- Full result JSON ---
    result_path = os.path.join(_OUTPUT_DIR, f"{tag}_result_{ts}.json")
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False, default=str)
    logger.info("Saved full result  -> %s", result_path)

    # --- Parameters-only JSON (cleaner for downstream use) ---
    params_out = []
    for p in result.get("parameters", []):
        params_out.append({
            "param_id": p["param_id"],
            "name": p["name"],
            "domain": p["domain"],
            "measured_value": p["value"],
            "unit": p["unit"],
            "pass_condition": p["pass_condition"],
            "passed": p["passed"],
            "criticality": p["criticality"],
        })

    params_path = os.path.join(_OUTPUT_DIR, f"{tag}_parameters_{ts}.json")
    with open(params_path, "w", encoding="utf-8") as f:
        json.dump({
            "train_id": train_id,
            "domain": domain,
            "extracted_at": datetime.now().isoformat(),
            "parameter_count": len(params_out),
            "parameters": params_out,
        }, f, indent=2, ensure_ascii=False, default=str)
    logger.info("Saved parameters   -> %s", params_path)


# ── Twilio media download ────────────────────────────────────────

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


# ── Parameter parsing ────────────────────────────────────────────

# Matches table rows like: "RS-001 Wheel Diameter mm 850.2 840 - 860"
# We only need the param_id and the FIRST number after the unit column.
_TABLE_ROW_RE = re.compile(
    r"((?:RS|SIG|SAF)-\d{3})"          # group 1: param_id
    r"\s+.+?"                           # parameter name (skip)
    r"\s+\S+"                           # unit column (skip)
    r"\s+([\d]+(?:\.\d+)?)"             # group 2: measured value
)

# Fallback: narrative mentions like "response time of 320 ms"
_NARRATIVE_RE = re.compile(
    r"([\d]+(?:\.\d+)?)"               # group 1: numeric value
    r"\s*(?:ms|mm|s|m|%|N|kW|kN|bar|Ohm|MOhm|deg\s?C|cd/?m2|pct|min)",
    re.IGNORECASE,
)


def _parse_parameters(text: str) -> dict[str, float]:
    """
    Extract { param_id: measured_value } from the PDF text.

    Strategy:
      1. Scan for table rows with explicit Param IDs (RS-001, SIG-002, etc.).
      2. For any param_ids NOT found in step 1, attempt fuzzy matching from
         narrative text using parameter names as anchors.
    """
    found: dict[str, float] = {}

    # ── Strategy 1: explicit param‑ID table rows ─────────────
    for m in _TABLE_ROW_RE.finditer(text):
        pid = m.group(1).upper()
        try:
            found[pid] = float(m.group(2))
        except ValueError:
            continue

    # ── Strategy 2: name‑anchored narrative extraction ────────
    # Only attempt for params NOT yet found
    for p in _REGISTRY:
        pid = p["param_id"]
        if pid in found:
            continue
        # Build a loose regex around the parameter name
        name_words = p["name"].lower().split()
        # Use first 2 significant words as anchor (skip tiny words)
        anchor_words = [w for w in name_words if len(w) > 2][:2]
        if not anchor_words:
            continue
        pattern = r"(?i)" + r"\s+.*?".join(re.escape(w) for w in anchor_words)
        pattern += r".*?([\d]+(?:\.\d+)?)"
        nm = re.search(pattern, text)
        if nm:
            try:
                found[pid] = float(nm.group(1))
            except ValueError:
                continue

    return found


# ── Validation & scoring ─────────────────────────────────────────

def _evaluate_condition(condition: str, value: float) -> bool:
    """Safely evaluate a pass_condition like 'value >= 840 and value <= 860'."""
    try:
        return bool(eval(condition, {"__builtins__": {}}, {"value": value}))
    except Exception:
        return False


def _validate_and_score(
    extracted: dict[str, float],
    domain_filter: str | None = None,
) -> dict:
    """
    Validate extracted parameters against the registry and compute
    a weighted fitness score.

    Returns a dict compatible with what main.py expects:
      { success, final_score, critical_fail, domain_scores, parameters }
    """
    params_to_check = _REGISTRY
    if domain_filter:
        params_to_check = [p for p in _REGISTRY if p["domain"] == domain_filter]

    results: list[dict] = []
    domain_totals: dict[str, dict] = {}  # domain -> {weighted_pass, total_weight}

    critical_fail = False

    for p in params_to_check:
        pid = p["param_id"]
        domain = p["domain"]
        crit = p["criticality"]
        weight = _CRIT_WEIGHT.get(crit, 1.0)

        if domain not in domain_totals:
            domain_totals[domain] = {"weighted_pass": 0.0, "total_weight": 0.0}

        if pid in extracted:
            value = extracted[pid]
            passed = _evaluate_condition(p["pass_condition"], value)
            results.append({
                "param_id": pid,
                "name": p["name"],
                "domain": domain,
                "value": value,
                "unit": p["unit"],
                "pass_condition": p["pass_condition"],
                "passed": passed,
                "criticality": crit,
            })
            domain_totals[domain]["total_weight"] += weight
            if passed:
                domain_totals[domain]["weighted_pass"] += weight
            elif crit == "critical":
                critical_fail = True
        else:
            # Parameter not found in PDF — count as missing (not failed)
            results.append({
                "param_id": pid,
                "name": p["name"],
                "domain": domain,
                "value": None,
                "unit": p["unit"],
                "pass_condition": p["pass_condition"],
                "passed": None,
                "criticality": crit,
                "note": "not found in document",
            })

    # Compute domain scores
    domain_scores: dict[str, float] = {}
    for dom, totals in domain_totals.items():
        tw = totals["total_weight"]
        domain_scores[dom] = round(totals["weighted_pass"] / tw, 4) if tw > 0 else 0.0

    # Overall score: average of domain scores (only scored domains)
    if domain_scores:
        final_score = round(sum(domain_scores.values()) / len(domain_scores), 4)
    else:
        final_score = 0.0

    return {
        "success": True,
        "final_score": final_score,
        "critical_fail": critical_fail,
        "domain_scores": domain_scores,
        "parameters": results,
        "extracted_count": sum(1 for r in results if r["value"] is not None),
        "total_registry_count": len(params_to_check),
    }


# ── Detect domain from text ──────────────────────────────────────

_DOMAIN_HINTS = {
    "rolling_stock": ["rolling stock", "wheel diameter", "brake pad", "bogie frame",
                      "traction motor", "pantograph", "coupler height", "hvac"],
    "signalling":    ["signalling", "signal", "atp response", "balise", "odometer",
                      "cab signal", "axle counter", "speed sensor", "cbtc"],
    "safety":        ["safety", "fire detection", "emergency brake", "door interlock",
                      "smoke obscuration", "deadman", "crashworthiness", "earthing",
                      "egress", "psd"],
}


def _detect_domain(text: str) -> str | None:
    """Guess the certificate domain from its text content."""
    text_lower = text.lower()
    scores: dict[str, int] = {}
    for domain, keywords in _DOMAIN_HINTS.items():
        scores[domain] = sum(1 for kw in keywords if kw in text_lower)
    if not scores:
        return None
    best = max(scores, key=scores.get)  # type: ignore[arg-type]
    return best if scores[best] > 0 else None


# ── Public API ────────────────────────────────────────────────────

async def ingest_certificate(
    media_url: str,
    content_type: str | None,
    train_id: Optional[str] = None,
    caption: Optional[str] = None,
) -> dict:
    """
    Download PDF from Twilio, extract text, parse parameters, validate,
    and return fitness result — all locally, no external API needed.
    """
    # 1. Download
    file_bytes, ct = await download_twilio_media(media_url)
    if content_type:
        ct = content_type

    ct_base = ct.split(";")[0].strip()
    if ct_base not in SUPPORTED_DOC_TYPES:
        return {
            "success": False,
            "error": f"Unsupported document type: {ct_base}",
        }

    # 2. Extract text
    try:
        text = _extract_pdf_text(file_bytes)
    except Exception as exc:
        logger.exception("PDF text extraction failed")
        return {"success": False, "error": f"Could not read PDF: {exc}"}

    if not text or len(text.strip()) < 20:
        return {"success": False, "error": "PDF appears to be empty or image-only."}

    logger.info("Extracted %d chars from PDF", len(text))

    # 3. Parse parameters
    extracted = _parse_parameters(text)
    logger.info("Parsed %d parameter values: %s", len(extracted), list(extracted.keys()))

    if not extracted:
        return {
            "success": False,
            "error": "Could not find any certificate parameters in the PDF. "
                     "Please ensure the document contains a parameter table "
                     "with IDs like RS-001, SIG-001, or SAF-001.",
        }

    # 4. Detect domain (use caption hint first, then text analysis)
    domain_filter: str | None = None
    if caption:
        for dom in ("rolling_stock", "signalling", "safety"):
            if dom in caption.lower():
                domain_filter = dom
                break
    if not domain_filter:
        domain_filter = _detect_domain(text)

    logger.info("Domain detected: %s", domain_filter)

    # 5. Validate & score
    result = _validate_and_score(extracted, domain_filter)
    result["train_id"] = train_id
    result["domain"] = domain_filter
    result["text_length"] = len(text)

    logger.info(
        "Fitness result: score=%.4f  critical_fail=%s  extracted=%d/%d",
        result["final_score"], result["critical_fail"],
        result["extracted_count"], result["total_registry_count"],
    )

    # 6. Save results to JSON files
    _save_results_json(result, train_id, domain_filter)

    return result


def format_fitness_reply(data: dict) -> str:
    """Format a fitness result into a human-readable WhatsApp message."""
    if not data.get("success"):
        return f"Could not process: {data.get('error', 'Unknown error')}"

    train = data.get("train_id", "?")
    score = data.get("final_score", data.get("fitness", {}).get("final_score", "?"))
    critical = data.get("critical_fail", data.get("fitness", {}).get("critical_fail", False))
    status = "CRITICAL FAIL" if critical else ("PASS" if score != "?" and float(score) >= 0.7 else "MARGINAL")

    lines = [
        f"Train {train} - Fitness Report",
        f"",
        f"Score: {score}",
        f"Status: {status}",
    ]

    domains = data.get("domain_scores", data.get("fitness", {}).get("domain_scores", {}))
    if domains:
        lines.append("")
        lines.append("Domain breakdown:")
        for domain, ds in domains.items():
            lines.append(f"  {domain}: {ds:.3f}" if isinstance(ds, float) else f"  {domain}: {ds}")

    return "\n".join(lines)
