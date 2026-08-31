"""
ML Model for Train Induction Planning.

Two models built from scratch:
  1. CLASSIFIER: Predict optimal assignment (SERVICE / STANDBY / IBL)
  2. REGRESSOR: Predict outcome_score (0-1) for ranking

The classifier recommends assignments.
The regressor scores each possible assignment for the optimizer.
"""

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, mean_squared_error, r2_score
from xgboost import XGBClassifier, XGBRegressor
from config import MODEL_DIR, PROCESSED_DIR, RANDOM_SEED


# All features consumed by the model
FEATURE_COLS = [
    # Mileage (8)
    "daily_km", "cumulative_km", "km_deviation_from_mean", "km_balance_score",
    "bogie_hours", "brake_pad_wear_index", "hvac_run_hours", "door_cycles",
    # Fitness (6)
    "cert_days_rolling_stock", "cert_days_signalling", "cert_days_telecom",
    "min_cert_days", "any_cert_expired", "cert_expiring_soon",
    # Job cards (3)
    "open_job_count", "critical_open_jobs", "has_critical_open",
    # Branding (3)
    "daily_exposure", "exposure_gap", "branding_urgency",
    # Cleaning (4)
    "days_since_deep_clean", "needs_cleaning", "available_cleaning_bays", "available_manpower",
    # Stabling (4)
    "bay_number", "is_ibl_bay", "shunt_cost", "turnout_order",
    # Faults (4)
    "fault_count", "critical_faults", "high_faults", "any_withdrawal",
    # Temporal (1)
    "day_of_week",
]

LABEL_COL = "assignment"
SCORE_COL = "outcome_score"


class InductionModel:
    """Combined classifier + regressor for train induction planning."""

    def __init__(self):
        self.classifier = XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            random_state=RANDOM_SEED,
            eval_metric="mlogloss",
        )
        self.regressor = XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            random_state=RANDOM_SEED,
        )
        self.label_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.is_trained = False

    def _cast_booleans(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        for col in ["needs_cleaning", "is_ibl_bay", "any_cert_expired",
                     "cert_expiring_soon", "has_critical_open"]:
            if col in df.columns:
                df[col] = df[col].astype(int)
        return df

    def prepare_data(self, df: pd.DataFrame):
        df = self._cast_booleans(df)
        df = df.dropna(subset=FEATURE_COLS + [LABEL_COL, SCORE_COL])

        X = df[FEATURE_COLS].values
        y_class = self.label_encoder.fit_transform(df[LABEL_COL].values)
        y_score = df[SCORE_COL].values

        return X, y_class, y_score, df

    def train(self, df: pd.DataFrame = None):
        if df is None:
            df = pd.read_csv(PROCESSED_DIR / "feature_matrix.csv", parse_dates=["date"])

        print(f"  Training on {len(df)} samples...")

        X, y_class, y_score, df_clean = self.prepare_data(df)

        X_scaled = self.scaler.fit_transform(X)

        X_train, X_test, yc_train, yc_test, ys_train, ys_test = train_test_split(
            X_scaled, y_class, y_score, test_size=0.2, random_state=RANDOM_SEED
        )

        # --- Classifier ---
        print("\n  --- Assignment Classifier ---")
        self.classifier.fit(X_train, yc_train)
        yc_pred = self.classifier.predict(X_test)
        print(classification_report(
            yc_test, yc_pred,
            target_names=self.label_encoder.classes_
        ))

        # --- Regressor ---
        print("  --- Outcome Score Regressor ---")
        self.regressor.fit(X_train, ys_train)
        ys_pred = self.regressor.predict(X_test)
        print(f"  MSE:  {mean_squared_error(ys_test, ys_pred):.4f}")
        print(f"  R2:   {r2_score(ys_test, ys_pred):.4f}")

        # --- Feature importance ---
        print("\n  --- Top 10 Features (Classifier) ---")
        importances = self.classifier.feature_importances_
        top_idx = np.argsort(importances)[::-1][:10]
        for rank, idx in enumerate(top_idx):
            print(f"    {rank+1}. {FEATURE_COLS[idx]}: {importances[idx]:.4f}")

        self.is_trained = True
        self.save()
        return self

    def predict_assignment(self, X: np.ndarray) -> np.ndarray:
        X_scaled = self.scaler.transform(X)
        encoded = self.classifier.predict(X_scaled)
        return self.label_encoder.inverse_transform(encoded)

    def predict_assignment_proba(self, X: np.ndarray) -> pd.DataFrame:
        X_scaled = self.scaler.transform(X)
        proba = self.classifier.predict_proba(X_scaled)
        return pd.DataFrame(proba, columns=self.label_encoder.classes_)

    def predict_outcome_score(self, X: np.ndarray) -> np.ndarray:
        X_scaled = self.scaler.transform(X)
        return self.regressor.predict(X_scaled)

    def rank_trainsets(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Produce a ranked induction list for one night's features."""
        features_df = self._cast_booleans(features_df)
        X = features_df[FEATURE_COLS].fillna(0).values

        assignments = self.predict_assignment(X)
        proba = self.predict_assignment_proba(X)
        scores = self.predict_outcome_score(X)

        result = features_df[["trainset_id"]].copy()
        result["ml_assignment"] = assignments
        result["predicted_outcome_score"] = np.round(scores, 4)
        result["confidence_SERVICE"] = np.round(proba["SERVICE"].values, 4)
        result["confidence_STANDBY"] = np.round(proba["STANDBY"].values, 4)
        result["confidence_IBL"] = np.round(proba["IBL"].values, 4)

        # Sort: SERVICE first (by score desc), then STANDBY, then IBL
        order_map = {"SERVICE": 0, "STANDBY": 1, "IBL": 2}
        result["_order"] = result["ml_assignment"].map(order_map)
        result = result.sort_values(["_order", "predicted_outcome_score"],
                                     ascending=[True, False]).drop(columns=["_order"])
        result["rank"] = range(1, len(result) + 1)

        return result.reset_index(drop=True)

    def get_explainability(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Per-trainset explanation based on feature importance + deviation."""
        importances = self.classifier.feature_importances_
        top_features = np.argsort(importances)[::-1][:5]

        features_df = self._cast_booleans(features_df)
        fleet_means = features_df[FEATURE_COLS].mean()

        explanations = []
        for _, row in features_df.iterrows():
            reasons = []
            for idx in top_features:
                feat = FEATURE_COLS[idx]
                val = row.get(feat, 0)
                mean_val = fleet_means[feat]
                if pd.notna(val) and mean_val != 0:
                    direction = "HIGH" if val > mean_val * 1.1 else ("LOW" if val < mean_val * 0.9 else "NORMAL")
                    reasons.append(f"{feat}={val:.1f} ({direction})")
            explanations.append({
                "trainset_id": row["trainset_id"],
                "explanation": " | ".join(reasons[:3]),
            })

        return pd.DataFrame(explanations)

    def save(self):
        joblib.dump(self.classifier, MODEL_DIR / "classifier.joblib")
        joblib.dump(self.regressor, MODEL_DIR / "regressor.joblib")
        joblib.dump(self.label_encoder, MODEL_DIR / "label_encoder.joblib")
        joblib.dump(self.scaler, MODEL_DIR / "scaler.joblib")
        print(f"  [OK] Model saved to {MODEL_DIR}")

    def load(self):
        self.classifier = joblib.load(MODEL_DIR / "classifier.joblib")
        self.regressor = joblib.load(MODEL_DIR / "regressor.joblib")
        self.label_encoder = joblib.load(MODEL_DIR / "label_encoder.joblib")
        self.scaler = joblib.load(MODEL_DIR / "scaler.joblib")
        self.is_trained = True
        print(f"  [OK] Model loaded from {MODEL_DIR}")
        return self


if __name__ == "__main__":
    model = InductionModel()
    model.train()
