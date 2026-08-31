"""
Rule validator — evaluates pass_condition from the parameter registry.

Each parameter's pass_condition is a safe Python expression using the
variable `value`.  This module evaluates it deterministically.
No LLM, no heuristics.
"""

from __future__ import annotations

import logging
import math
from typing import List

from config import load_parameter_registry
from models import NormalizedParameter, ValidatedParameter

logger = logging.getLogger(__name__)

# Allowed names in the safe eval sandbox
_SAFE_GLOBALS = {"__builtins__": {}}
_SAFE_LOCALS_BASE = {"abs": abs, "min": min, "max": max, "round": round}


class RuleValidator:
    """Evaluate pass/fail per parameter using registry conditions."""

    def __init__(self):
        self._registry = load_parameter_registry()

    def validate(self, params: List[NormalizedParameter]) -> List[ValidatedParameter]:
        """
        Evaluate each normalized parameter against its registry pass_condition.
        Returns a ValidatedParameter with passed=True/False.
        """
        results = []
        for p in params:
            reg = self._registry.get(p.param_id)
            if not reg:
                logger.warning(f"No registry entry for {p.param_id}, marking FAIL")
                results.append(ValidatedParameter(
                    param_id=p.param_id,
                    value=p.value,
                    unit=p.unit,
                    passed=False,
                    criticality="unknown",
                    domain="unknown",
                    condition="NOT_IN_REGISTRY",
                ))
                continue

            condition = reg["pass_condition"]
            passed = _safe_eval_condition(condition, p.value)

            if not passed:
                logger.info(
                    f"FAIL: {p.param_id} = {p.value} {p.unit} "
                    f"(condition: {condition}, criticality: {reg['criticality']})"
                )

            results.append(ValidatedParameter(
                param_id=p.param_id,
                value=p.value,
                unit=p.unit,
                passed=passed,
                criticality=reg["criticality"],
                domain=reg["domain"],
                condition=condition,
            ))

        return results


def _safe_eval_condition(condition: str, value: float) -> bool:
    """
    Evaluate a pass_condition expression like 'value >= 840 and value <= 860'.

    Uses a restricted eval sandbox — only 'value', basic math, and comparisons.
    Returns False on any error (fail-safe).
    """
    if not math.isfinite(value):
        return False

    safe_locals = {**_SAFE_LOCALS_BASE, "value": value}

    try:
        result = eval(condition, _SAFE_GLOBALS, safe_locals)
        return bool(result)
    except Exception as e:
        logger.error(f"Condition eval error for '{condition}' with value={value}: {e}")
        return False
