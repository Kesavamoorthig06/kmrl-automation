"""
Multi-objective optimizer.
Takes ML rankings + rule engine constraints -> final induction list.

Objectives (weighted):
  1. ML predicted score (service readiness)
  2. Mileage balance (minimize deviation)
  3. Branding SLA compliance (maximize exposure for urgent contracts)
  4. Shunting cost (minimize)
  5. Cleaning coverage (prioritize dirty trains for IBL)
  6. Fault risk (avoid risky trains for service)
"""

import pandas as pd
import numpy as np
from config import (
    DAILY_SERVICE_REQUIRED, DAILY_STANDBY_REQUIRED,
    MIN_OPERATIONAL_EFFICIENCY, MAX_DEPLOYMENT_TIME_MINUTES,
    ALLOWED_SHUNTING_COMPLEXITY, REQUIRE_WATER_SUPPLY,
    REQUIRE_POWER_SUPPLY,
)


class InductionOptimizer:
    """
    Takes ML predictions + rule constraints -> produces optimal assignment.
    Uses multi-objective scoring with configurable weights.
    """

    def __init__(self, weights: dict = None):
        self.weights = weights or {
            "ml_score": 0.30,
            "mileage_balance": 0.20,
            "branding_urgency": 0.15,
            "shunt_cost": 0.15,
            "cleaning_need": 0.10,
            "fault_risk": 0.10,
        }

    def compute_service_score(self, df: pd.DataFrame) -> np.ndarray:
        """Higher score = better candidate for SERVICE."""
        n = len(df)
        scores = np.zeros(n)

        if "predicted_outcome_score" in df.columns:
            s = df["predicted_outcome_score"].fillna(0.5).values
            scores += self.weights["ml_score"] * self._normalize(s)

        if "km_deviation_from_mean" in df.columns:
            dev = df["km_deviation_from_mean"].fillna(0).values
            scores += self.weights["mileage_balance"] * self._normalize(-dev)

        if "branding_urgency" in df.columns:
            bu = df["branding_urgency"].fillna(0).values
            scores += self.weights["branding_urgency"] * self._normalize(bu)

        if "shunt_cost" in df.columns:
            sc = df["shunt_cost"].fillna(0).values
            scores += self.weights["shunt_cost"] * self._normalize(-sc)

        if "days_since_deep_clean" in df.columns:
            cl = df["days_since_deep_clean"].fillna(0).values
            scores += self.weights["cleaning_need"] * self._normalize(-cl)

        if "fault_count" in df.columns:
            fc = df["fault_count"].fillna(0).values
            scores += self.weights["fault_risk"] * self._normalize(-fc)

        return scores

    def optimize(self, features_df: pd.DataFrame, ml_rankings: pd.DataFrame,
                 rule_results: pd.DataFrame) -> pd.DataFrame:
        """
        Produce final assignment respecting:
        - Hard rules (must_ibl, not eligible)
        - Fleet requirements (18 SERVICE, 3 STANDBY, rest IBL)
        - Multi-objective scoring
        """
        df = features_df.merge(ml_rankings, on="trainset_id", how="left")
        df = df.merge(rule_results, on="trainset_id", how="left")

        # Hard constraints
        df["forced_ibl"] = (
            (df["must_ibl"] == True) |
            (df["eligible_for_service"] == False)
        )

        # Stabling geometry deployment readiness
        # Trains in bays that don't meet readiness thresholds cannot be
        # assigned to SERVICE (they may still be fit, but not readily
        # deployable from their current stabling position).
        df["deployment_ready"] = df.get("deployment_ready", pd.Series([True] * len(df)))
        if "deployment_ready" in df.columns:
            df.loc[df["deployment_ready"] == False, "forced_ibl"] = False  # not forced to IBL, just not SERVICE
            not_deploy_ready = ~df["deployment_ready"].astype(bool)
        else:
            not_deploy_ready = pd.Series([False] * len(df))

        eligible = df[~df["forced_ibl"] & ~not_deploy_ready].copy()
        not_ready_but_fit = df[~df["forced_ibl"] & not_deploy_ready].copy()
        forced_ibl_df = df[df["forced_ibl"]].copy()

        if len(eligible) < DAILY_SERVICE_REQUIRED + DAILY_STANDBY_REQUIRED:
            print(f"  WARNING: Only {len(eligible)} eligible trains, "
                  f"need {DAILY_SERVICE_REQUIRED + DAILY_STANDBY_REQUIRED}")

        service_scores = self.compute_service_score(eligible)
        eligible["service_score"] = service_scores

        eligible = eligible.sort_values("service_score", ascending=False)

        service_trains = eligible.head(DAILY_SERVICE_REQUIRED)["trainset_id"].tolist()
        remaining = eligible.iloc[DAILY_SERVICE_REQUIRED:]
        standby_trains = remaining.head(DAILY_STANDBY_REQUIRED)["trainset_id"].tolist()
        ibl_from_eligible = remaining.iloc[DAILY_STANDBY_REQUIRED:]["trainset_id"].tolist()
        # Fit-but-not-deployment-ready trains go to STANDBY or IBL
        ibl_from_not_ready = not_ready_but_fit["trainset_id"].tolist()
        ibl_forced = forced_ibl_df["trainset_id"].tolist()

        assignments = {}
        for ts in service_trains:
            assignments[ts] = "SERVICE"
        for ts in standby_trains:
            assignments[ts] = "STANDBY"
        for ts in ibl_from_eligible + ibl_from_not_ready + ibl_forced:
            assignments[ts] = "IBL"

        df["final_assignment"] = df["trainset_id"].map(assignments)
        df["service_score"] = df["trainset_id"].map(
            eligible.set_index("trainset_id")["service_score"].to_dict()
        ).fillna(0)

        return df

    def what_if(self, features_df: pd.DataFrame, ml_rankings: pd.DataFrame,
                rule_results: pd.DataFrame, overrides: dict) -> pd.DataFrame:
        """
        What-if simulation with forced overrides.
        overrides = {"TS-005": "SERVICE", "TS-012": "IBL"}
        """
        result = self.optimize(features_df, ml_rankings, rule_results)

        for ts_id, forced_assignment in overrides.items():
            mask = result["trainset_id"] == ts_id
            if mask.any():
                old = result.loc[mask, "final_assignment"].values[0]
                result.loc[mask, "final_assignment"] = forced_assignment
                print(f"  [WHAT-IF] {ts_id}: {old} -> {forced_assignment} (forced)")

        counts = result["final_assignment"].value_counts()
        print(f"  [WHAT-IF] Final counts: {counts.to_dict()}")

        return result

    @staticmethod
    def _normalize(arr: np.ndarray) -> np.ndarray:
        mn, mx = arr.min(), arr.max()
        if mx - mn == 0:
            return np.zeros_like(arr)
        return (arr - mn) / (mx - mn)
