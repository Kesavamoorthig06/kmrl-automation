"""
Schema validator — ensures LLM output strictly matches the expected schema.

Rejects any output with:
  - Missing required fields
  - Wrong types
  - Unrecognised param_ids
  - Non-numeric values
"""

from __future__ import annotations

import logging
from typing import Set

from config import load_parameter_registry
from models import LLMExtractionResult, ExtractedParameter

logger = logging.getLogger(__name__)


class SchemaValidator:
    """Validates LLM extraction output against the parameter registry."""

    def __init__(self):
        self._registry = load_parameter_registry()
        self._valid_ids: Set[str] = set(self._registry.keys())

    def validate(self, result: LLMExtractionResult) -> LLMExtractionResult:
        """
        Validate and filter the extraction result:
          1. train_id must be non-empty
          2. Each parameter must have a recognised param_id
          3. Values must be finite numbers
          4. Remove duplicates (keep first)

        Returns a cleaned LLMExtractionResult. Raises ValueError if
        the result is fundamentally invalid (e.g. no train_id).
        """
        # 1. Train ID
        if not result.train_id or not result.train_id.strip():
            raise ValueError("LLM output missing train_id")

        # 2. Filter parameters
        seen_ids: Set[str] = set()
        valid_params = []
        rejected = 0

        for p in result.parameters:
            # Check param_id exists in registry
            if p.param_id not in self._valid_ids:
                logger.warning(f"Rejected unknown param_id: {p.param_id}")
                rejected += 1
                continue

            # Check value is finite
            if not _is_finite(p.value):
                logger.warning(f"Rejected non-finite value for {p.param_id}: {p.value}")
                rejected += 1
                continue

            # Skip duplicates
            if p.param_id in seen_ids:
                logger.warning(f"Skipped duplicate param_id: {p.param_id}")
                continue

            seen_ids.add(p.param_id)
            valid_params.append(p)

        if rejected:
            logger.info(f"Schema validation: {rejected} parameters rejected")

        return LLMExtractionResult(
            train_id=result.train_id.strip().upper(),
            certificate_type=result.certificate_type.strip().lower(),
            parameters=valid_params,
            confidence=result.confidence,
        )


def _is_finite(v: float) -> bool:
    import math
    return isinstance(v, (int, float)) and math.isfinite(v)
