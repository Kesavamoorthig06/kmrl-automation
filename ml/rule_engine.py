"""
Hard constraint enforcement (Rule Engine).
These are non-negotiable rules from KMRL operations that must be
satisfied BEFORE any ML/optimization runs.
"""

import pandas as pd
from config import DAILY_SERVICE_REQUIRED, DAILY_STANDBY_REQUIRED


class RuleEngine:
    """Enforces hard constraints on trainset assignments."""

    def check_fitness(self, row: pd.Series) -> dict:
        """HARD: No service without all 3 fitness certs valid."""
        if row.get("any_cert_expired", 0) == 1:
            return {"eligible_for_service": False, "reason": "FITNESS_CERT_EXPIRED"}
        return {"eligible_for_service": True, "reason": None}

    def check_critical_jobs(self, row: pd.Series) -> dict:
        """HARD: Open critical job cards -> must go to IBL."""
        if row.get("has_critical_open", 0) == 1:
            return {"must_ibl": True, "reason": "CRITICAL_JOB_OPEN"}
        return {"must_ibl": False, "reason": None}

    def check_cert_expiring_soon(self, row: pd.Series) -> dict:
        """SOFT->HARD: Cert expiring within 2 days -> prefer IBL for renewal."""
        if row.get("min_cert_days", 999) <= 2:
            return {"prefer_ibl": True, "reason": "CERT_EXPIRING_SOON"}
        return {"prefer_ibl": False, "reason": None}

    def apply_rules(self, features: pd.DataFrame, date) -> pd.DataFrame:
        """
        For a single planning night, apply all rules and return eligibility.
        """
        date = pd.Timestamp(date)
        night_data = features[features["date"] == date].copy()
        results = []

        for _, row in night_data.iterrows():
            fitness = self.check_fitness(row)
            jobs = self.check_critical_jobs(row)
            cert_soon = self.check_cert_expiring_soon(row)

            reasons = []
            if fitness["reason"]:
                reasons.append(fitness["reason"])
            if jobs["reason"]:
                reasons.append(jobs["reason"])
            if cert_soon["reason"]:
                reasons.append(cert_soon["reason"])

            eligible = fitness["eligible_for_service"] and not jobs["must_ibl"]

            results.append({
                "trainset_id": row["trainset_id"],
                "eligible_for_service": eligible,
                "must_ibl": jobs["must_ibl"],
                "prefer_ibl": cert_soon["prefer_ibl"],
                "rule_reasons": "; ".join(reasons) if reasons else "CLEAR",
            })

        return pd.DataFrame(results)

    def validate_assignment(self, assignment: pd.DataFrame) -> list:
        """Post-assignment validation. Checks fleet-level constraints."""
        violations = []
        service_count = (assignment["final_assignment"] == "SERVICE").sum()
        standby_count = (assignment["final_assignment"] == "STANDBY").sum()

        if service_count < DAILY_SERVICE_REQUIRED:
            violations.append(
                f"FLEET_UNDERCOUNT: Only {service_count} in SERVICE, need {DAILY_SERVICE_REQUIRED}"
            )
        if standby_count < DAILY_STANDBY_REQUIRED:
            violations.append(
                f"STANDBY_UNDERCOUNT: Only {standby_count} STANDBY, need {DAILY_STANDBY_REQUIRED}"
            )

        if "any_cert_expired" in assignment.columns:
            bad = assignment[
                (assignment["final_assignment"] == "SERVICE") &
                (assignment["any_cert_expired"] == 1)
            ]
            if len(bad) > 0:
                violations.append(
                    f"CERT_VIOLATION: {len(bad)} trains with expired certs assigned to SERVICE"
                )

        return violations
