"""
PKL Bridge — loads the pre-trained kmrl_station_master_model.pkl
with scikit-learn version-compatibility patches, wraps inference
so the rest of the pipeline can call `predict(df)` cleanly.

The .pkl contains:
  sklearn.pipeline.Pipeline([
      ("preprocessor", ColumnTransformer([
          ("num", Pipeline([StandardScaler, SimpleImputer]), numeric_cols),
          ("cat", OneHotEncoder, ["is_branded"]),
      ])),
      ("classifier", XGBClassifier),   # binary: logistic
  ])

Features (14):
  days_to_rs_expiry, days_to_sig_expiry, open_job_cards,
  maximo_fault_severity, iot_vibration_score, iot_brake_pressure,
  iot_comms_latency, iot_temp_anomaly, monthly_exposure_gap,
  curr_mileage_km, mileage_target_delta, hrs_since_last_clean,
  is_branded (cat), cleaning_bay_avail
"""

from __future__ import annotations

import logging
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

PKL_PATH = Path(__file__).parent / "kmrl_station_master_model.pkl"

# Expected ordered feature list (numeric + categorical)
PKL_NUMERIC_FEATURES = [
    "days_to_rs_expiry",
    "days_to_sig_expiry",
    "open_job_cards",
    "maximo_fault_severity",
    "iot_vibration_score",
    "iot_brake_pressure",
    "iot_comms_latency",
    "iot_temp_anomaly",
    "monthly_exposure_gap",
    "curr_mileage_km",
    "mileage_target_delta",
    "hrs_since_last_clean",
    "cleaning_bay_avail",
]
PKL_CAT_FEATURES = ["is_branded"]
PKL_ALL_FEATURES = PKL_NUMERIC_FEATURES + PKL_CAT_FEATURES


def _patch_sklearn():
    """
    Patch missing internal classes that were removed/renamed between
    scikit-learn 1.6 → 1.7+.  This allows unpickling models saved with
    older sklearn versions.
    """
    try:
        import sklearn.compose._column_transformer as ct
        if not hasattr(ct, "_RemainderColsList"):
            # _RemainderColsList was a thin list subclass used to mark
            # remainder columns.  It needs __dict__ for unpickling.
            class _RemainderColsList(list):
                """Shim for sklearn <1.7 pickled ColumnTransformers."""
                def __reduce__(self):
                    return (_RemainderColsList, (list(self),))
            ct._RemainderColsList = _RemainderColsList
            logger.info("Patched sklearn _RemainderColsList for backwards compat")
    except Exception:
        pass


class PKLModel:
    """Wrapper around the pre-trained station-master .pkl model."""

    def __init__(self, path: Path = PKL_PATH):
        self.path = path
        self.pipeline = None
        self._loaded = False

    def load(self) -> "PKLModel":
        if self._loaded:
            return self
        _patch_sklearn()
        import joblib
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.pipeline = joblib.load(self.path)
        self._loaded = True
        logger.info("PKL model loaded from %s", self.path)
        return self

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """
        Return P(positive class) for each row.
        df must contain the 14 PKL_ALL_FEATURES columns.
        """
        if not self._loaded:
            self.load()
        X = df[PKL_ALL_FEATURES].copy()
        # Ensure categorical column is string
        X["is_branded"] = X["is_branded"].astype(str)
        proba = self.pipeline.predict_proba(X)
        # Return probability of the positive class (service-ready)
        return proba[:, 1] if proba.shape[1] == 2 else proba.max(axis=1)

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Binary prediction: 1 = service-ready, 0 = not ready."""
        if not self._loaded:
            self.load()
        X = df[PKL_ALL_FEATURES].copy()
        X["is_branded"] = X["is_branded"].astype(str)
        return self.pipeline.predict(X)

    def score_trains(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convenience: takes a df with train_id_norm + 14 features,
        returns a df with train_id_norm, pkl_score, pkl_service_ready.
        """
        proba = self.predict_proba(df)
        pred  = self.predict(df)
        result = df[["train_id_norm"]].copy()
        result["pkl_score"] = np.round(proba, 4)
        result["pkl_service_ready"] = pred.astype(int)
        return result.reset_index(drop=True)


# Singleton helper
_instance: PKLModel | None = None


def get_pkl_model() -> PKLModel:
    global _instance
    if _instance is None:
        _instance = PKLModel()
        _instance.load()
    return _instance


if __name__ == "__main__":
    from data_adapter import load_public_csvs, build_pkl_features
    dfs = load_public_csvs()
    feat = build_pkl_features(dfs)
    model = get_pkl_model()
    scores = model.score_trains(feat)
    print(scores.to_string())
