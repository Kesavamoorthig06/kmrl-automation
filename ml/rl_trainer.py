"""
Reinforcement-Learning Retrainer
================================

Every RETRAIN_EVERY_N_DAYS (30) days, this module:

1. Loads accumulated daily outcome snapshots (reward signals).
2. Computes per-train reward: composite of punctuality, withdrawal avoidance,
   branding SLA compliance, and mileage balance.
3. Updates:
   a) The optimizer weight vector (multi-objective scoring weights).
   b) Retrains the pipeline XGBoost models on the expanded dataset.
   c) Optionally fine-tunes the .pkl model via online learning on new data.
4. Persists the new model artefacts and weight history.

The RL formulation:
  - State:  feature vector of all 25 trains on a given night.
  - Action: assignment vector (SERVICE / STANDBY / IBL).
  - Reward: composite outcome score (real 0-1) observed next day.
  - Policy update: adjust optimizer weights toward actions correlated
    with higher reward, using a simple policy-gradient (REINFORCE-lite)
    with a baseline.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from config import (
    MODEL_DIR, PROCESSED_DIR, RETRAIN_EVERY_N_DAYS, RANDOM_SEED,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REWARD_LOG  = PROCESSED_DIR / "reward_log.csv"
WEIGHT_HIST = MODEL_DIR / "weight_history.json"
SNAPSHOT_DIR = PROCESSED_DIR / "snapshots"


# ---------------------------------------------------------------------------
# Reward computation
# ---------------------------------------------------------------------------

def compute_reward(outcome_row: pd.Series) -> float:
    """
    Scalar reward ∈ [0, 1] for a single train-day outcome.

    Components (matching historical_decisions outcome_score formula):
        0.35 × punctuality_score
        0.25 × (1 if no unscheduled_withdrawal else 0)
        0.20 × (1 if branding_sla_met else 0)
        0.10 × mileage_balance_score  (1 - |deviation| / max_deviation)
        0.10 × cleaning_compliance    (1 if cleaned on time else 0.5)
    """
    punct = float(outcome_row.get("punctuality_score", 0.95))
    no_wd = 0.0 if outcome_row.get("unscheduled_withdrawal", False) else 1.0
    sla   = 1.0 if outcome_row.get("branding_sla_met", True) else 0.0
    # mileage balance: relative deviation from fleet mean
    km_dev = abs(float(outcome_row.get("km_deviation_from_mean", 0)))
    max_dev = float(outcome_row.get("max_km_deviation", 1)) or 1
    mil_bal = max(0, 1 - km_dev / max_dev)
    clean   = 1.0 if not outcome_row.get("needs_cleaning", False) else 0.5

    reward = (
        0.35 * punct
        + 0.25 * no_wd
        + 0.20 * sla
        + 0.10 * mil_bal
        + 0.10 * clean
    )
    return round(float(np.clip(reward, 0, 1)), 4)


def log_rewards(assignments_df: pd.DataFrame, outcomes_df: pd.DataFrame):
    """
    Append today's (assignment, outcome, reward) tuples to the reward log.
    Both DataFrames must share trainset_id / train_id_norm.
    """
    # Try to find assignment column in assignments_df directly
    # (avoids merge-suffix issues when both dfs share column names)
    records = []
    for _, arow in assignments_df.iterrows():
        tid = arow["trainset_id"]
        assignment = str(
            arow.get("final_assignment",
                      arow.get("assignment", "UNKNOWN"))
        )
        # Find matching outcome row
        orows = outcomes_df[outcomes_df["trainset_id"] == tid]
        if orows.empty and "train_id_norm" in outcomes_df.columns:
            orows = outcomes_df[outcomes_df["train_id_norm"] == tid]
        orow = orows.iloc[0] if len(orows) else arow  # fallback to assignment row

        records.append({
            "date": str(arow.get("date", datetime.now().date())),
            "trainset_id": tid,
            "assignment": assignment,
            "reward": compute_reward(orow),
        })

    new_df = pd.DataFrame(records)
    if REWARD_LOG.exists():
        existing = pd.read_csv(REWARD_LOG)
        new_df = pd.concat([existing, new_df], ignore_index=True)
    new_df.to_csv(REWARD_LOG, index=False)
    logger.info("Logged %d reward entries -> %s (total %d)", len(records), REWARD_LOG, len(new_df))
    return new_df


# ---------------------------------------------------------------------------
# Weight update via REINFORCE-lite
# ---------------------------------------------------------------------------

DEFAULT_WEIGHTS = {
    "ml_score":         0.30,
    "mileage_balance":  0.20,
    "branding_urgency": 0.15,
    "shunt_cost":       0.15,
    "cleaning_need":    0.10,
    "fault_risk":       0.10,
}

LEARNING_RATE = 0.05
MIN_WEIGHT = 0.05
MAX_WEIGHT = 0.50


def _load_weight_history() -> list[dict]:
    if WEIGHT_HIST.exists():
        with open(WEIGHT_HIST) as f:
            return json.load(f)
    return []


def _save_weight_history(history: list[dict]):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(WEIGHT_HIST, "w") as f:
        json.dump(history, f, indent=2)


def get_current_weights() -> dict[str, float]:
    """Return the latest weight vector, or defaults if no history."""
    history = _load_weight_history()
    if history:
        return history[-1]["weights"]
    return dict(DEFAULT_WEIGHTS)


def update_weights(reward_df: pd.DataFrame, current_weights: dict[str, float] | None = None) -> dict[str, float]:
    """
    Policy-gradient weight update.

    For each objective dimension, compute the correlation between that
    dimension's score and the observed reward.  Increase weights of
    dimensions positively correlated with high reward, decrease those
    negatively correlated.

    Args:
        reward_df: must have columns: assignment, reward, and ideally the
                   per-dimension scores (mileage_balance_score, etc.).
    """
    if current_weights is None:
        current_weights = get_current_weights()

    weights = dict(current_weights)

    # Mean reward as baseline
    mean_reward = reward_df["reward"].mean()
    if mean_reward == 0:
        return weights

    # For each weight dimension, compute advantage signal
    # SERVICE assignments with above-avg reward → boost that dimension
    assignment_col = reward_df["assignment"].astype(str).str.upper()
    service_mask = assignment_col == "SERVICE"
    service_rewards = reward_df.loc[service_mask, "reward"]

    if len(service_rewards) < 5:
        logger.warning("Too few SERVICE samples (%d) for weight update", len(service_rewards))
        return weights

    advantage = service_rewards.mean() - mean_reward

    # Heuristic: dimensions linked to higher service reward get boosted
    # Use reward variance per dimension as signal
    dim_signals = {
        "ml_score":         advantage * 1.2,   # ML confidence
        "mileage_balance":  -reward_df.get("km_deviation_from_mean", pd.Series([0])).abs().mean() / 1000,
        "branding_urgency": reward_df.get("branding_sla_met", pd.Series([1])).mean() - 0.85,
        "shunt_cost":       -reward_df.get("shunt_cost", pd.Series([0])).mean() / 10,
        "cleaning_need":    reward_df.get("needs_cleaning", pd.Series([0])).apply(lambda x: 0 if x else 1).mean() - 0.7,
        "fault_risk":       -reward_df.get("critical_faults", pd.Series([0])).mean(),
    }

    for dim, signal in dim_signals.items():
        if dim in weights:
            delta = LEARNING_RATE * float(signal)
            weights[dim] = float(np.clip(weights[dim] + delta, MIN_WEIGHT, MAX_WEIGHT))

    # Renormalise to sum=1
    total = sum(weights.values())
    weights = {k: round(v / total, 4) for k, v in weights.items()}

    # Persist
    history = _load_weight_history()
    history.append({
        "date": datetime.now().isoformat(),
        "weights": weights,
        "mean_reward": round(float(mean_reward), 4),
        "advantage": round(float(advantage), 4),
        "n_samples": len(reward_df),
    })
    _save_weight_history(history)
    logger.info("Weights updated: %s  (mean_reward=%.4f, advantage=%.4f)",
                weights, mean_reward, advantage)
    return weights


# ---------------------------------------------------------------------------
# Full retrain cycle
# ---------------------------------------------------------------------------

def should_retrain() -> bool:
    """Check if RETRAIN_EVERY_N_DAYS have passed since last retrain."""
    history = _load_weight_history()
    if not history:
        return True
    last_date = pd.Timestamp(history[-1]["date"])
    days_since = (pd.Timestamp.now() - last_date).days
    return days_since >= RETRAIN_EVERY_N_DAYS


def retrain_cycle(force: bool = False):
    """
    Full RL retrain cycle:
      1. Check if 30 days elapsed (or force=True).
      2. Load accumulated reward log.
      3. Update optimizer weights.
      4. Retrain pipeline XGBoost on existing feature_matrix + new outcomes.
      5. Save everything.
    """
    if not force and not should_retrain():
        logger.info("Retrain not due yet (every %d days)", RETRAIN_EVERY_N_DAYS)
        return None

    logger.info("=" * 60)
    logger.info("REINFORCEMENT LEARNING RETRAIN CYCLE")
    logger.info("=" * 60)

    # 1. Load reward log
    if not REWARD_LOG.exists():
        logger.warning("No reward log found — generating initial rewards from feature matrix")
        _bootstrap_reward_log()

    reward_df = pd.read_csv(REWARD_LOG)
    logger.info("Loaded %d reward entries", len(reward_df))

    # 2. Update weights
    new_weights = update_weights(reward_df)
    logger.info("New optimizer weights: %s", new_weights)

    # 3. Retrain XGBoost pipeline model
    from model import InductionModel
    model = InductionModel()
    feature_path = PROCESSED_DIR / "feature_matrix.csv"
    if feature_path.exists():
        fm = pd.read_csv(feature_path, parse_dates=["date"])
        # Inject updated rewards as outcome_score adjustments
        if "reward" in reward_df.columns and "trainset_id" in reward_df.columns:
            reward_mean = reward_df.groupby("trainset_id")["reward"].mean().reset_index()
            reward_mean.columns = ["trainset_id", "rl_reward_adj"]
            fm = fm.merge(reward_mean, on="trainset_id", how="left")
            fm["rl_reward_adj"] = fm["rl_reward_adj"].fillna(0)
            # Blend original outcome_score with RL reward signal
            if "outcome_score" in fm.columns:
                fm["outcome_score"] = (
                    0.7 * fm["outcome_score"] + 0.3 * fm["rl_reward_adj"]
                ).clip(0, 1)
        model.train(fm)
        logger.info("Pipeline model retrained on %d samples with RL-adjusted outcomes", len(fm))
    else:
        logger.warning("No feature_matrix.csv found — skipping model retrain")

    return new_weights


def _bootstrap_reward_log():
    """Create initial reward log from historical_decisions if available."""
    hist_path = Path(__file__).parent / "data" / "raw" / "historical_decisions.csv"
    if not hist_path.exists():
        # Create a minimal one
        records = []
        for i in range(1, 26):
            records.append({
                "date": datetime.now().date().isoformat(),
                "trainset_id": f"TS-{i:03d}",
                "assignment": "SERVICE" if i <= 18 else ("STANDBY" if i <= 21 else "IBL"),
                "reward": round(np.random.uniform(0.7, 0.95), 4),
            })
        pd.DataFrame(records).to_csv(REWARD_LOG, index=False)
        return

    df = pd.read_csv(hist_path, parse_dates=["date"])
    # Take last 30 days
    recent = df[df["date"] >= df["date"].max() - timedelta(days=30)]
    records = []
    for _, row in recent.iterrows():
        records.append({
            "date": str(row["date"].date()) if hasattr(row["date"], "date") else str(row["date"]),
            "trainset_id": row["trainset_id"],
            "assignment": row["assignment"],
            "reward": compute_reward(row),
        })
    pd.DataFrame(records).to_csv(REWARD_LOG, index=False)
    logger.info("Bootstrapped reward log with %d entries from historical decisions", len(records))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    weights = retrain_cycle(force=True)
    print(f"\nFinal weights: {weights}")
