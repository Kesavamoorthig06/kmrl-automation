"""
End-to-end pipeline:
  1. Generate synthetic data (or load existing)
  2. Build feature matrix
  3. Train ML model
  4. For a given night: rules + ML + optimizer -> ranked induction list
  5. What-if simulation
"""

import pandas as pd

from generate_data import generate_all
from feature_engine import build_feature_matrix
from rule_engine import RuleEngine
from model import InductionModel
from optimizer import InductionOptimizer
from config import PROCESSED_DIR


class InductionPipeline:
    """Full pipeline for nightly induction planning."""

    def __init__(self):
        self.rule_engine = RuleEngine()
        self.model = InductionModel()
        self.optimizer = InductionOptimizer()
        self.feature_matrix = None

    def step_1_generate_data(self):
        print("\n" + "=" * 60)
        print("STEP 1: DATA GENERATION")
        print("=" * 60)
        generate_all()

    def step_2_build_features(self) -> pd.DataFrame:
        print("\n" + "=" * 60)
        print("STEP 2: FEATURE ENGINEERING")
        print("=" * 60)
        self.feature_matrix = build_feature_matrix()
        return self.feature_matrix

    def step_3_train_model(self):
        print("\n" + "=" * 60)
        print("STEP 3: MODEL TRAINING")
        print("=" * 60)
        if self.feature_matrix is None:
            self.feature_matrix = pd.read_csv(
                PROCESSED_DIR / "feature_matrix.csv", parse_dates=["date"]
            )
        self.model.train(self.feature_matrix)

    def step_4_plan_night(self, target_date: str = None) -> dict:
        print("\n" + "=" * 60)
        print("STEP 4: NIGHTLY INDUCTION PLANNING")
        print("=" * 60)

        if self.feature_matrix is None:
            self.feature_matrix = pd.read_csv(
                PROCESSED_DIR / "feature_matrix.csv", parse_dates=["date"]
            )

        if not self.model.is_trained:
            self.model.load()

        if target_date:
            date = pd.Timestamp(target_date)
        else:
            date = self.feature_matrix["date"].max()

        print(f"\n  Planning for: {date.date()}")

        night_features = self.feature_matrix[self.feature_matrix["date"] == date].copy()
        if len(night_features) == 0:
            print(f"  ERROR: No data for {date.date()}")
            return {}

        # 4a. Rule engine
        print("\n  --- Rule Engine ---")
        rule_results = self.rule_engine.apply_rules(self.feature_matrix, date)
        not_eligible = rule_results[~rule_results["eligible_for_service"]]
        must_ibl = rule_results[rule_results["must_ibl"]]
        print(f"  Not eligible for service: {len(not_eligible)}")
        print(f"  Must go to IBL: {len(must_ibl)}")

        # 4b. ML ranking
        print("\n  --- ML Ranking ---")
        ml_rankings = self.model.rank_trainsets(night_features)
        print(ml_rankings[["rank", "trainset_id", "ml_assignment",
                           "predicted_outcome_score"]].head(10).to_string(index=False))

        # 4c. Optimizer
        print("\n  --- Optimization ---")
        final = self.optimizer.optimize(night_features, ml_rankings, rule_results)

        # 4d. Explainability
        explanations = self.model.get_explainability(night_features)
        final = final.merge(explanations, on="trainset_id", how="left")

        # 4e. Validation
        violations = self.rule_engine.validate_assignment(final)
        if violations:
            print("\n  VIOLATIONS:")
            for v in violations:
                print(f"    - {v}")
        else:
            print("\n  All constraints satisfied")

        # Print final list
        print("\n" + "=" * 60)
        print("FINAL INDUCTION LIST")
        print("=" * 60)

        for assignment_type in ["SERVICE", "STANDBY", "IBL"]:
            subset = final[final["final_assignment"] == assignment_type]
            print(f"\n  --- {assignment_type} ({len(subset)} trains) ---")
            for _, row in subset.iterrows():
                score = row.get("service_score", 0)
                reason = row.get("rule_reasons", "")
                expl = row.get("explanation", "")
                print(f"    {row['trainset_id']}  score={score:.3f}  rules=[{reason}]  {str(expl)[:50]}")

        counts = final["final_assignment"].value_counts()
        print(f"\n  Summary: {counts.to_dict()}")

        output_path = PROCESSED_DIR / f"induction_list_{date.date()}.csv"
        final.to_csv(output_path, index=False)
        print(f"  Saved to {output_path}")

        return {
            "date": date,
            "induction_list": final,
            "explanations": explanations,
            "violations": violations,
            "rule_results": rule_results,
            "ml_rankings": ml_rankings,
        }

    def step_5_what_if(self, target_date: str, overrides: dict) -> pd.DataFrame:
        print("\n" + "=" * 60)
        print("STEP 5: WHAT-IF SIMULATION")
        print("=" * 60)

        if self.feature_matrix is None:
            self.feature_matrix = pd.read_csv(
                PROCESSED_DIR / "feature_matrix.csv", parse_dates=["date"]
            )

        if not self.model.is_trained:
            self.model.load()

        date = pd.Timestamp(target_date)
        night_features = self.feature_matrix[self.feature_matrix["date"] == date].copy()
        rule_results = self.rule_engine.apply_rules(self.feature_matrix, date)
        ml_rankings = self.model.rank_trainsets(night_features)

        result = self.optimizer.what_if(night_features, ml_rankings, rule_results, overrides)
        return result

    def run_full_pipeline(self):
        """Execute everything end-to-end."""
        self.step_1_generate_data()
        self.step_2_build_features()
        self.step_3_train_model()
        result = self.step_4_plan_night()
        return result
