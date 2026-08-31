"""
Fitness scorer — computes domain-level and final fitness scores.

Scoring is fully deterministic:
  1. Group validated parameters by domain
  2. Weighted pass rate per domain (criticality weights)
  3. Final score = weighted combination of domain scores
  4. critical_fail_flag = True if ANY critical parameter failed

No LLM, no ML — pure arithmetic.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime
from typing import List

from config import DOMAIN_WEIGHTS, CRITICALITY_WEIGHTS
from models import ValidatedParameter, FitnessResult

logger = logging.getLogger(__name__)


def compute_fitness(
    train_id: str,
    validated: List[ValidatedParameter],
) -> FitnessResult:
    """
    Compute rolling_stock_score, signalling_score, safety_score,
    final_score, and critical_fail_flag from validated parameters.
    """
    # Group by domain
    by_domain: dict[str, List[ValidatedParameter]] = defaultdict(list)
    for v in validated:
        by_domain[v.domain].append(v)

    # Compute weighted pass rate per domain
    domain_scores = {}
    critical_fail = False
    failed_params = []

    for domain in ("rolling_stock", "signalling", "safety"):
        params = by_domain.get(domain, [])
        if not params:
            domain_scores[domain] = 1.0  # No data → assume compliant (neutral)
            continue

        weighted_sum = 0.0
        weight_total = 0.0
        for p in params:
            w = CRITICALITY_WEIGHTS.get(p.criticality, 1.0)
            weight_total += w
            if p.passed:
                weighted_sum += w
            else:
                failed_params.append(p.param_id)
                if p.criticality == "critical":
                    critical_fail = True

        domain_scores[domain] = weighted_sum / weight_total if weight_total > 0 else 1.0

    # Final weighted score
    final = sum(
        domain_scores.get(d, 1.0) * w
        for d, w in DOMAIN_WEIGHTS.items()
    )

    result = FitnessResult(
        train_id=train_id,
        rolling_stock_score=round(domain_scores.get("rolling_stock", 1.0), 4),
        signalling_score=round(domain_scores.get("signalling", 1.0), 4),
        safety_score=round(domain_scores.get("safety", 1.0), 4),
        final_score=round(final, 4),
        critical_fail_flag=critical_fail,
        parameter_count=len(validated),
        failed_parameters=failed_params,
        updated_at=datetime.utcnow(),
    )

    logger.info(
        f"Fitness for {train_id}: RS={result.rolling_stock_score:.2f} "
        f"SIG={result.signalling_score:.2f} SAF={result.safety_score:.2f} "
        f"FINAL={result.final_score:.2f} critical_fail={result.critical_fail_flag}"
    )

    return result
