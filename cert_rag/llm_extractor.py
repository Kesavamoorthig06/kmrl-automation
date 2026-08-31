"""
LLM-based structured extraction.

Takes certificate text + RAG-retrieved parameter candidates and asks the
LLM to map text to parameter values.

Constraints:
  - LLM must NOT decide fitness
  - LLM must NOT generate free-text
  - LLM output is strictly the JSON schema defined in models.LLMExtractionResult
  - No business logic in the prompt
  - Temperature = 0 for deterministic output
"""

from __future__ import annotations

import json
import logging
from typing import List, Dict, Optional

from config import (
    LLM_PROVIDER,
    LLM_MODEL,
    LLM_API_KEY,
    LLM_TEMPERATURE,
    LLM_MAX_TOKENS,
    LLM_TIMEOUT,
    AZURE_ENDPOINT,
    AZURE_API_VERSION,
    AZURE_DEPLOYMENT,
)
from models import LLMExtractionResult, ExtractedParameter

logger = logging.getLogger(__name__)

# ── JSON schema for structured output ────────────────────────────

EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "train_id": {"type": "string", "description": "Train identifier found in the document"},
        "certificate_type": {
            "type": "string",
            "description": "Type of certificate, e.g. 'fitness', 'brake_test', 'wheel_profile', 'signalling_test'",
        },
        "parameters": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "param_id": {"type": "string", "description": "Parameter ID from the candidate list"},
                    "value": {"type": "number", "description": "Numeric value extracted from document"},
                    "unit": {"type": "string", "description": "Unit as stated in the document"},
                },
                "required": ["param_id", "value", "unit"],
            },
        },
        "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Self-assessed extraction confidence 0-1",
        },
    },
    "required": ["train_id", "certificate_type", "parameters", "confidence"],
}


def _build_system_prompt() -> str:
    return (
        "You are a railway certificate data extraction system.\n"
        "Your ONLY job is to extract structured parameter values from certificate text.\n"
        "Rules:\n"
        "1. Output ONLY valid JSON matching the provided schema. No prose, no explanation.\n"
        "2. Only extract parameters that appear in the candidate list.\n"
        "3. Only extract values explicitly stated in the text. Never invent or estimate.\n"
        "4. If a parameter cannot be found, omit it from the output array.\n"
        "5. Set confidence to a value between 0 and 1 based on text clarity.\n"
        "6. Do NOT evaluate pass/fail. Do NOT assess fitness. Only extract raw values.\n"
    )


def _build_user_prompt(text: str, candidates: List[Dict]) -> str:
    # Format candidate parameters as a reference table
    candidate_lines = []
    for c in candidates:
        candidate_lines.append(
            f"  {c['param_id']}: {c['name']} — unit: {c['unit']} — {c['description']}"
        )
    candidate_block = "\n".join(candidate_lines)

    return (
        f"PARAMETER CANDIDATES:\n{candidate_block}\n\n"
        f"CERTIFICATE TEXT:\n{text}\n\n"
        "Extract parameter values from the certificate text above and return JSON."
    )


async def extract_parameters(
    text: str,
    candidates: List[Dict],
    train_id_hint: Optional[str] = None,
) -> LLMExtractionResult:
    """
    Call the LLM to extract structured parameters from certificate text.

    Returns a validated LLMExtractionResult or raises ValueError.
    """
    system_prompt = _build_system_prompt()
    user_prompt = _build_user_prompt(text, candidates)

    raw_json = await _call_llm(system_prompt, user_prompt)

    # Parse and validate against Pydantic model
    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {raw_json[:500]}")

    # If train_id_hint provided and LLM didn't find one, inject it
    if train_id_hint and (not data.get("train_id") or data["train_id"] == "unknown"):
        data["train_id"] = train_id_hint

    result = LLMExtractionResult(**data)
    logger.info(
        f"LLM extracted {len(result.parameters)} params "
        f"for {result.train_id} (confidence={result.confidence:.2f})"
    )
    return result


# ── LLM provider dispatch ────────────────────────────────────────

async def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Route to the configured LLM provider and return raw JSON string."""
    if LLM_PROVIDER == "openai":
        return await _call_openai(system_prompt, user_prompt)
    elif LLM_PROVIDER == "azure":
        return await _call_azure(system_prompt, user_prompt)
    elif LLM_PROVIDER == "local":
        return await _call_local(system_prompt, user_prompt)
    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {LLM_PROVIDER}")


async def _call_openai(system_prompt: str, user_prompt: str) -> str:
    """Call OpenAI API with structured JSON output mode."""
    try:
        from openai import AsyncOpenAI
    except ImportError:
        raise RuntimeError("openai package required. Install with: pip install openai")

    client = AsyncOpenAI(api_key=LLM_API_KEY, timeout=LLM_TIMEOUT)

    response = await client.chat.completions.create(
        model=LLM_MODEL,
        temperature=LLM_TEMPERATURE,
        max_tokens=LLM_MAX_TOKENS,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("LLM returned empty content")
    return content


async def _call_azure(system_prompt: str, user_prompt: str) -> str:
    """Call Azure OpenAI with structured output."""
    try:
        from openai import AsyncAzureOpenAI
    except ImportError:
        raise RuntimeError("openai package required. Install with: pip install openai")

    client = AsyncAzureOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        api_key=LLM_API_KEY,
        api_version=AZURE_API_VERSION,
        timeout=LLM_TIMEOUT,
    )

    response = await client.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        temperature=LLM_TEMPERATURE,
        max_tokens=LLM_MAX_TOKENS,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Azure LLM returned empty content")
    return content


async def _call_local(system_prompt: str, user_prompt: str) -> str:
    """Call a local OpenAI-compatible endpoint (e.g. Ollama, vLLM)."""
    import os
    try:
        from openai import AsyncOpenAI
    except ImportError:
        raise RuntimeError("openai package required. Install with: pip install openai")

    base_url = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/v1")

    client = AsyncOpenAI(
        api_key="not-needed",
        base_url=base_url,
        timeout=LLM_TIMEOUT,
    )

    response = await client.chat.completions.create(
        model=LLM_MODEL,
        temperature=LLM_TEMPERATURE,
        max_tokens=LLM_MAX_TOKENS,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Local LLM returned empty content")
    return content
