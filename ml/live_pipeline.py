"""
Live Pipeline — production-grade integration of:

  1. Public CSV data (6 domain tables)  →  Unified data adapter
  2. Pre-trained .pkl station-master model  →  Service-readiness probability
  3. Pipeline XGBoost (classifier + regressor)  →  Assignment + outcome score
  4. Multi-objective optimizer with RL-tuned weights  →  Final ranked list
  5. Rule engine hard-constraint enforcement
  6. Output: ml_analysis_data.csv  →  Dashboard consumption
  7. 30-day RL retrain trigger

Run modes:
  python live_pipeline.py                    # full live run
  python live_pipeline.py --retrain          # force RL retrain cycle
  python live_pipeline.py --date 2026-02-20  # plan for specific date
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

# -- Internal imports -------------------------------------------------------
from config import (
    PROCESSED_DIR, MODEL_DIR, DAILY_SERVICE_REQUIRED,
    DAILY_STANDBY_REQUIRED, NUM_TRAINSETS,
)
from data_adapter import (
    load_public_csvs, build_pkl_features, build_pipeline_features,
    save_snapshot, normalise_train_id, _ts_to_r, PUBLIC_DIR,
)
from pkl_bridge import get_pkl_model, PKLModel
from model import InductionModel, FEATURE_COLS, LABEL_COL, SCORE_COL
from rule_engine import RuleEngine
from optimizer import InductionOptimizer
from rl_trainer import (
    get_current_weights, retrain_cycle, should_retrain,
    log_rewards, compute_reward, REWARD_LOG,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-22s  %(levelname)-5s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("live_pipeline")

# ---------------------------------------------------------------------------
# Ensemble blending
# ---------------------------------------------------------------------------

def ensemble_scores(pkl_scores: pd.DataFrame,
                    pipeline_scores: pd.DataFrame,
                    pkl_weight: float = 0.4,
                    pipe_weight: float = 0.6) -> pd.DataFrame:
    """
    Blend the .pkl model's service-readiness probability with the
    pipeline regressor's outcome_score prediction → single composite
    score per train.
    """
    merged = pkl_scores.merge(pipeline_scores, on="trainset_id", how="outer")

    # .pkl score (0-1 probability of being service-ready)
    merged["pkl_score"] = merged["pkl_score"].fillna(0.5)
    # pipeline predicted outcome score (0-1)
    merged["pipe_score"] = merged["predicted_outcome_score"].fillna(0.5)

    # Weighted blend
    merged["ensemble_score"] = (
        pkl_weight * merged["pkl_score"]
        + pipe_weight * merged["pipe_score"]
    ).round(4)

    return merged


# ---------------------------------------------------------------------------
# Dashboard CSV writer
# ---------------------------------------------------------------------------

def write_dashboard_csv(final_df: pd.DataFrame, output_path: Path):
    """
    Write ml_analysis_data.csv in exactly the schema the React dashboard
    expects:
      train_id, status, score, stabling_bay, branding_priority, mileage,
      last_cleaned_date, assignment, fitness_certificate_valid,
      job_card_status, mileage_score, branding_score, cleaning_score,
      shunting_score, prelim_score, final_score_ga, total_shunting_cost,
      count_penalty, shunt_penalty, branding_shortfall,
      deployment_ready, bay_type, operational_efficiency,
      generation_timestamp, explanation
    """
    dfs_public = load_public_csvs()
    stab = dfs_public["stabling"]
    brand = dfs_public["branding"]
    mile = dfs_public["mileage"]
    clean = dfs_public["cleaning"]
    fit = dfs_public["fitness"]
    jobs = dfs_public["jobs"]

    rows = []
    now_iso = datetime.utcnow().isoformat(timespec="milliseconds") + "Z"

    # Sort by ensemble/service score descending
    score_col = "ensemble_score" if "ensemble_score" in final_df.columns else "service_score"
    final_sorted = final_df.sort_values(score_col, ascending=False).reset_index(drop=True)

    for _, row in final_sorted.iterrows():
        tid = row["trainset_id"]
        r_id = _ts_to_r(tid)

        assignment = str(row.get("final_assignment", "Service"))
        assignment_label = {
            "SERVICE": "Service",
            "STANDBY": "Standby",
            "IBL": "Maintenance",
        }.get(assignment.upper(), assignment.title())

        status = "Available" if assignment.upper() in ("SERVICE", "STANDBY") else "Unavailable"

        # Composite score
        score = float(row.get(score_col, 0.5))

        # Fetch per-domain data
        s = stab[stab["train_id_norm"] == tid]
        bay = s.iloc[0]["stabling_bay"] if len(s) else "?"
        shunt_dist = float(s.iloc[0].get("shunting_distance_meters", 0)) if len(s) else 0
        shunt_cost = round(shunt_dist * 0.02, 2)
        bay_type = str(s.iloc[0].get("bay_type", "standard")) if len(s) else "standard"
        op_eff = float(s.iloc[0].get("operational_efficiency", 95)) if len(s) else 95

        # Deployment readiness from pipeline features
        deploy_ready = bool(row.get("deployment_ready", True))

        b = brand[brand["train_id_norm"] == tid]
        bprio = int(b.iloc[0].get("branding_priority_level", 5)) if len(b) else 5
        completion = float(b.iloc[0].get("completion_percentage", 100)) if len(b) else 100
        shortfall = completion < 90

        m = mile[mile["train_id_norm"] == tid]
        mileage = int(m.iloc[0].get("total_mileage", 0)) if len(m) else 0

        c = clean[clean["train_id_norm"] == tid]
        last_clean = str(c.iloc[0].get("last_cleaned_date", "")) if len(c) else ""

        f = fit[fit["train_id_norm"] == tid]
        cert_valid = "Yes" if len(f) and str(f.iloc[0].get("compliance_status", "")).lower() == "compliant" else "No"

        j = jobs[jobs["train_id_norm"] == tid]
        job_status = "Clear"
        if len(j):
            js = str(j.iloc[0].get("job_card_status", "")).lower()
            if js != "completed":
                job_status = "Open"

        # Per-dimension scores (normalised 0-1)
        mil_score = float(row.get("km_balance_score", 0))
        mil_score_norm = round(max(0, 1 - mil_score / 50000), 2) if mil_score else 0.94
        brand_score = round(completion / 100, 2)
        clean_sc = float(row.get("days_since_deep_clean", 0))
        clean_score = round(max(0, 1 - clean_sc / 30), 2) if clean_sc else 1.0
        shunt_score = round(max(0, 1 - shunt_cost / 10), 2)

        # Explanations
        explanations = []
        if cert_valid != "Yes":
            explanations.append("Fitness certificates require attention")
        if job_status != "Clear":
            explanations.append("Open job cards need completion")
        if not deploy_ready:
            explanations.append(f"Bay {bay} ({bay_type}) not deployment-ready (efficiency {op_eff}%)")
        if bprio < 5:
            explanations.append("Low branding priority")
        if mil_score_norm < 0.9:
            explanations.append("Mileage efficiency below optimal")
        if clean_score < 0.8:
            explanations.append("Cleaning status needs improvement")
        if shunt_score < 0.8:
            explanations.append("Stabling geometry challenging")
        if not explanations:
            explanations.append("All parameters optimal")

        rows.append({
            "train_id": r_id,
            "status": status,
            "score": round(score, 4),
            "stabling_bay": bay,
            "branding_priority": bprio,
            "mileage": mileage,
            "last_cleaned_date": last_clean,
            "assignment": assignment_label,
            "fitness_certificate_valid": cert_valid,
            "job_card_status": job_status,
            "mileage_score": mil_score_norm,
            "branding_score": brand_score,
            "cleaning_score": clean_score,
            "shunting_score": shunt_score,
            "prelim_score": round(score, 4),
            "final_score_ga": round(score, 4),
            "total_shunting_cost": shunt_cost,
            "count_penalty": 0,
            "shunt_penalty": 0,
            "branding_shortfall": shortfall,
            "deployment_ready": "Yes" if deploy_ready else "No",
            "bay_type": bay_type,
            "operational_efficiency": op_eff,
            "generation_timestamp": now_iso,
            "explanation": ", ".join(explanations),
        })

    out_df = pd.DataFrame(rows)
    out_df.to_csv(output_path, index=False)
    logger.info("Dashboard CSV written -> %s (%d trains)", output_path, len(out_df))
    service_count = (out_df["assignment"] == "Service").sum()
    logger.info("  %d trains in Service, %d Available, %d Unavailable",
                service_count,
                (out_df["status"] == "Available").sum(),
                (out_df["status"] == "Unavailable").sum())
    return out_df


# ---------------------------------------------------------------------------
# Immediate deployment logic
# ---------------------------------------------------------------------------

def next_train_for_immediate_deployment(final_df: pd.DataFrame) -> dict:
    """
    Determine the very next train to deploy based on:
      1. Highest ensemble/service score among SERVICE-assigned trains.
      2. Lowest shunt cost (fastest to get out of depot).
      3. All hard constraints satisfied.

    Returns a dict with the recommended train + reasoning.
    """
    service = final_df[final_df["final_assignment"] == "SERVICE"].copy()
    if service.empty:
        return {"train": None, "reason": "No SERVICE trains available"}

    score_col = "ensemble_score" if "ensemble_score" in service.columns else "service_score"

    # Weighted immediate deploy score: 60% readiness, 40% speed (low shunt)
    max_shunt = service["shunt_cost"].max() or 1
    service["immediate_score"] = (
        0.6 * service[score_col].fillna(0)
        + 0.4 * (1 - service["shunt_cost"].fillna(0) / max_shunt)
    )
    service = service.sort_values("immediate_score", ascending=False)
    best = service.iloc[0]

    return {
        "train": best["trainset_id"],
        "train_id_display": _ts_to_r(best["trainset_id"]),
        "immediate_score": round(float(best["immediate_score"]), 4),
        "readiness_score": round(float(best.get(score_col, 0)), 4),
        "shunt_cost": round(float(best.get("shunt_cost", 0)), 2),
        "assignment": "SERVICE",
        "reason": (
            f"Highest immediate deployment score ({best['immediate_score']:.3f}). "
            f"Readiness={best.get(score_col, 0):.3f}, "
            f"Shunt cost={best.get('shunt_cost', 0):.1f}"
        ),
    }


# ---------------------------------------------------------------------------
# Main live pipeline
# ---------------------------------------------------------------------------

def run_live(target_date: str | None = None, force_retrain: bool = False):
    """
    Full live pipeline execution:
      1. Load live data from public CSVs
      2. Build unified features
      3. Score with .pkl model
      4. Score with pipeline model
      5. Ensemble blend
      6. Apply rules
      7. Optimise with RL-tuned weights
      8. Write dashboard CSV
      9. Check/trigger 30-day retrain
    """
    ref_date = datetime.fromisoformat(target_date) if target_date else datetime.now()

    print("\n" + "=" * 70)
    print("  KMRL LIVE INDUCTION PLANNING PIPELINE")
    print(f"  Date: {ref_date.date()}  |  Time: {ref_date.strftime('%H:%M')}")
    print("=" * 70)

    # --- Step 1: Load data ---
    print("\n[1/9] Loading live data from public CSVs...")
    dfs = load_public_csvs()
    n_trains = len(dfs["fitness"])
    print(f"      {n_trains} trains loaded from 6 data sources")

    # --- Step 2: Build features for both models ---
    print("\n[2/9] Building unified feature sets...")
    pkl_feat = build_pkl_features(dfs, ref_date=ref_date)
    pipe_feat = build_pipeline_features(dfs, ref_date=ref_date)
    print(f"      PKL features: {pkl_feat.shape}  |  Pipeline features: {pipe_feat.shape}")

    # --- Step 3: Score with .pkl model ---
    print("\n[3/9] Scoring with pre-trained station-master model (.pkl)...")
    try:
        pkl_model = get_pkl_model()
        pkl_scores = pkl_model.score_trains(pkl_feat)
        pkl_scores = pkl_scores.rename(columns={"train_id_norm": "trainset_id"})
        print(f"      PKL scores range: {pkl_scores['pkl_score'].min():.3f} -> {pkl_scores['pkl_score'].max():.3f}")
    except Exception as e:
        logger.warning("PKL model scoring failed: %s — using uniform scores", e)
        pkl_scores = pkl_feat[["train_id_norm"]].copy()
        pkl_scores = pkl_scores.rename(columns={"train_id_norm": "trainset_id"})
        pkl_scores["pkl_score"] = 0.5
        pkl_scores["pkl_service_ready"] = 1

    # --- Step 4: Score with pipeline model ---
    print("\n[4/9] Scoring with pipeline XGBoost model...")
    pipeline_model = InductionModel()
    try:
        pipeline_model.load()
        ml_rankings = pipeline_model.rank_trainsets(pipe_feat)
        print(f"      Pipeline scores range: "
              f"{ml_rankings['predicted_outcome_score'].min():.3f} -> "
              f"{ml_rankings['predicted_outcome_score'].max():.3f}")
    except Exception as e:
        logger.warning("Pipeline model not trained yet: %s — training now...", e)
        # Need feature_matrix — generate synthetic + build features + train
        from generate_data import generate_all
        from feature_engine import build_feature_matrix
        print("      Generating training data...")
        generate_all()
        print("      Building feature matrix...")
        fm = build_feature_matrix()
        print("      Training model...")
        pipeline_model.train(fm)
        ml_rankings = pipeline_model.rank_trainsets(pipe_feat)

    # --- Step 5: Ensemble blend ---
    print("\n[5/9] Ensemble blending (PKL 40% + Pipeline 60%)...")
    blended = ensemble_scores(pkl_scores, ml_rankings)
    blended["trainset_id"] = blended["trainset_id"].fillna(
        blended.get("train_id_norm", blended["trainset_id"])
    )
    print(f"      Ensemble scores range: "
          f"{blended['ensemble_score'].min():.3f} -> "
          f"{blended['ensemble_score'].max():.3f}")

    # --- Step 6: Apply rules ---
    print("\n[6/9] Applying hard constraints (rule engine)...")
    rule_engine = RuleEngine()
    rule_results = rule_engine.apply_rules(pipe_feat, ref_date)
    n_ineligible = (~rule_results["eligible_for_service"]).sum()
    n_must_ibl = rule_results["must_ibl"].sum()
    print(f"      Not eligible: {n_ineligible}  |  Must IBL: {n_must_ibl}")

    # --- Step 7: Optimise with RL-tuned weights ---
    print("\n[7/9] Multi-objective optimisation with RL-tuned weights...")
    current_weights = get_current_weights()
    print(f"      Current weights: {current_weights}")
    optimizer = InductionOptimizer(weights=current_weights)

    # Merge ensemble scores into pipe_feat for the optimizer's compute_service_score
    pipe_feat_opt = pipe_feat.merge(
        blended[["trainset_id", "ensemble_score", "pkl_score", "pipe_score"]],
        on="trainset_id", how="left",
    )

    # Override predicted_outcome_score *inside ml_rankings* with the ensemble
    # blend so the optimizer picks up the combined signal.
    ml_rankings_adj = ml_rankings.copy()
    ens_map = blended.set_index("trainset_id")["ensemble_score"].to_dict()
    ml_rankings_adj["predicted_outcome_score"] = (
        ml_rankings_adj["trainset_id"].map(ens_map)
        .fillna(ml_rankings_adj["predicted_outcome_score"])
    )

    final = optimizer.optimize(pipe_feat_opt, ml_rankings_adj, rule_results)
    counts = final["final_assignment"].value_counts().to_dict()
    print(f"      Assignments: {counts}")

    # --- Step 8: Write dashboard CSV ---
    print("\n[8/9] Writing dashboard CSV...")
    dashboard_path = PUBLIC_DIR / "ml_analysis_data.csv"
    build_path = Path(__file__).resolve().parent.parent / "build" / "ml_analysis_data.csv"
    dash_df = write_dashboard_csv(final, dashboard_path)
    # Also write to build/ if it exists
    if build_path.parent.exists():
        dash_df.to_csv(build_path, index=False)
        logger.info("Also wrote to %s", build_path)

    # Save snapshot for RL
    save_snapshot(final, tag="live_run")

    # --- Step 9: RL retrain check ---
    print("\n[9/9] RL retrain check...")
    if force_retrain or should_retrain():
        print("      ⟳ Triggering 30-day RL retrain cycle...")
        # First log synthetic rewards for this run
        outcome_df = final.copy()
        outcome_df["punctuality_score"] = np.where(
            outcome_df["final_assignment"] == "SERVICE",
            np.random.uniform(0.92, 1.0, len(outcome_df)),
            1.0,
        )
        outcome_df["unscheduled_withdrawal"] = np.where(
            outcome_df["final_assignment"] == "SERVICE",
            np.random.random(len(outcome_df)) < 0.05,
            False,
        )
        outcome_df["branding_sla_met"] = True
        max_dev = outcome_df["km_deviation_from_mean"].abs().max() or 1
        outcome_df["max_km_deviation"] = max_dev
        log_rewards(final, outcome_df)
        new_weights = retrain_cycle(force=True)
        print(f"      New weights: {new_weights}")
    else:
        print("      [OK] Retrain not due yet")

    # --- Immediate deployment recommendation ---
    print("\n" + "=" * 70)
    print("  IMMEDIATE DEPLOYMENT RECOMMENDATION")
    print("=" * 70)
    deploy = next_train_for_immediate_deployment(final)
    if deploy["train"]:
        print(f"  >> Deploy {deploy['train_id_display']} NEXT")
        print(f"    Score: {deploy['readiness_score']:.3f}  |  "
              f"Shunt cost: {deploy['shunt_cost']:.1f}  |  "
              f"Immediate score: {deploy['immediate_score']:.3f}")
        print(f"    Reason: {deploy['reason']}")
    else:
        print(f"  [!] {deploy['reason']}")

    # --- Print ranked list ---
    print("\n" + "=" * 70)
    print("  RANKED INDUCTION LIST")
    print("=" * 70)
    score_col = "ensemble_score" if "ensemble_score" in final.columns else "service_score"
    for rank, (_, row) in enumerate(
        final.sort_values(score_col, ascending=False).iterrows(), 1
    ):
        flag = "*" if row["final_assignment"] == "SERVICE" else (
            "+" if row["final_assignment"] == "STANDBY" else "o")
        print(f"  {rank:2d}. {flag} {_ts_to_r(row['trainset_id'])} "
              f"({row['trainset_id']})  "
              f"Score={row.get(score_col, 0):.4f}  "
              f"-> {row['final_assignment']}")

    print("\n" + "=" * 70)
    print(f"  Dashboard CSV updated: {dashboard_path}")
    print(f"  {counts.get('SERVICE', 0)} trains for service, "
          f"{counts.get('STANDBY', 0)} standby, "
          f"{counts.get('IBL', 0)} maintenance")
    print("=" * 70 + "\n")

    # Return result for programmatic use
    return {
        "date": str(ref_date.date()),
        "assignments": counts,
        "immediate_deploy": deploy,
        "dashboard_csv": str(dashboard_path),
        "ensemble_scores": blended[["trainset_id", "ensemble_score"]].to_dict("records"),
        "retrained": force_retrain or should_retrain(),
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="KMRL Live Induction Planning Pipeline")
    parser.add_argument("--date", type=str, default=None,
                        help="Target date (YYYY-MM-DD). Default: today.")
    parser.add_argument("--retrain", action="store_true",
                        help="Force RL retrain cycle.")
    args = parser.parse_args()

    result = run_live(target_date=args.date, force_retrain=args.retrain)
    return result


if __name__ == "__main__":
    main()
