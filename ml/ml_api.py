"""
ML API Router — exposes the live pipeline over HTTP.

Mount in the existing FastAPI app to serve:
  GET  /ml/health          → pipeline status
  GET  /ml/scores           → current ranked train list
  GET  /ml/deploy-next      → immediate deployment recommendation
  POST /ml/run              → trigger live pipeline execution
  POST /ml/retrain          → force RL retrain cycle
  GET  /ml/weights          → current optimizer weights
"""

from __future__ import annotations

import json
import logging
import traceback
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ml", tags=["ML Pipeline"])

# Paths — relative to this file's parent
ML_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = ML_DIR.parent / "public"
MODEL_DIR = ML_DIR / "data" / "models"
WEIGHT_HIST = MODEL_DIR / "weight_history.json"
DASHBOARD_CSV = PUBLIC_DIR / "ml_analysis_data.csv"


def _csv_to_records(csv_path: Path) -> list:
    """Read a CSV into a list of dicts."""
    import pandas as pd
    if not csv_path.exists():
        return []
    df = pd.read_csv(csv_path)
    return df.to_dict(orient="records")


# ---------------------------------------------------------------
# GET /ml/health
# ---------------------------------------------------------------
@router.get("/health")
async def ml_health():
    pkl_exists = (ML_DIR / "kmrl_station_master_model.pkl").exists()
    model_exists = (MODEL_DIR / "classifier.joblib").exists()
    csv_exists = DASHBOARD_CSV.exists()
    weights_exist = WEIGHT_HIST.exists()

    last_run = None
    if csv_exists:
        import pandas as pd
        df = pd.read_csv(DASHBOARD_CSV)
        if "generation_timestamp" in df.columns:
            last_run = str(df["generation_timestamp"].iloc[0])

    return {
        "status": "ok",
        "pkl_model": pkl_exists,
        "pipeline_model": model_exists,
        "dashboard_csv": csv_exists,
        "rl_weights": weights_exist,
        "last_run": last_run,
        "train_count": len(_csv_to_records(DASHBOARD_CSV)) if csv_exists else 0,
    }


# ---------------------------------------------------------------
# GET /ml/scores
# ---------------------------------------------------------------
@router.get("/scores")
async def ml_scores():
    """Return the current ranked train list from ml_analysis_data.csv."""
    if not DASHBOARD_CSV.exists():
        return JSONResponse(
            status_code=404,
            content={"error": "Dashboard CSV not found. Run pipeline first."},
        )
    records = _csv_to_records(DASHBOARD_CSV)
    return {
        "count": len(records),
        "trains": records,
    }


# ---------------------------------------------------------------
# GET /ml/deploy-next
# ---------------------------------------------------------------
@router.get("/deploy-next")
async def ml_deploy_next():
    """Return the immediate deployment recommendation."""
    if not DASHBOARD_CSV.exists():
        return JSONResponse(
            status_code=404,
            content={"error": "No data. Run pipeline first."},
        )
    import pandas as pd
    df = pd.read_csv(DASHBOARD_CSV)

    # Filter available/service trains that are deployment-ready
    service = df[df["assignment"] == "Service"].copy()
    if service.empty:
        return {"train": None, "reason": "No service trains available"}

    # Only consider deployment-ready trains for immediate deploy
    if "deployment_ready" in service.columns:
        ready = service[service["deployment_ready"] == "Yes"]
        if not ready.empty:
            service = ready

    # Score: 60% readiness + 40% low shunt cost
    max_shunt = service["total_shunting_cost"].max() or 1
    service["immediate_score"] = (
        0.6 * service["score"]
        + 0.4 * (1 - service["total_shunting_cost"] / max_shunt)
    )
    service = service.sort_values("immediate_score", ascending=False)
    best = service.iloc[0]

    return {
        "train_id": best["train_id"],
        "score": round(float(best["score"]), 4),
        "immediate_score": round(float(best["immediate_score"]), 4),
        "shunting_cost": round(float(best["total_shunting_cost"]), 2),
        "stabling_bay": best["stabling_bay"],
        "assignment": "Service",
        "reason": f"Highest composite deployment score ({best['immediate_score']:.3f})",
    }


# ---------------------------------------------------------------
# POST /ml/run
# ---------------------------------------------------------------
@router.post("/run")
async def ml_run(date: str = None, retrain: bool = False):
    """Trigger the live pipeline. Runs synchronously."""
    import sys
    sys.path.insert(0, str(ML_DIR))

    try:
        from live_pipeline import run_live
        result = run_live(target_date=date, force_retrain=retrain)
        return {
            "status": "success",
            "date": result.get("date"),
            "assignments": result.get("assignments"),
            "immediate_deploy": result.get("immediate_deploy"),
            "dashboard_csv": result.get("dashboard_csv"),
            "retrained": result.get("retrained", False),
        }
    except Exception as e:
        logger.exception("ML pipeline failed")
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "traceback": traceback.format_exc()},
        )


# ---------------------------------------------------------------
# POST /ml/retrain
# ---------------------------------------------------------------
@router.post("/retrain")
async def ml_retrain():
    """Force RL retrain cycle."""
    import sys
    sys.path.insert(0, str(ML_DIR))

    try:
        from rl_trainer import retrain_cycle
        new_weights = retrain_cycle(force=True)
        return {
            "status": "success",
            "new_weights": new_weights,
        }
    except Exception as e:
        logger.exception("RL retrain failed")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )


# ---------------------------------------------------------------
# GET /ml/weights
# ---------------------------------------------------------------
@router.get("/weights")
async def ml_weights():
    """Return current RL optimizer weights."""
    if not WEIGHT_HIST.exists():
        return {
            "weights": {
                "ml_score": 0.30,
                "mileage_balance": 0.20,
                "branding_urgency": 0.15,
                "shunt_cost": 0.15,
                "cleaning_need": 0.10,
                "fault_risk": 0.10,
            },
            "source": "defaults",
        }
    with open(WEIGHT_HIST) as f:
        history = json.load(f)
    latest = history[-1] if history else {}
    return {
        "weights": latest.get("weights", {}),
        "date": latest.get("date"),
        "mean_reward": latest.get("mean_reward"),
        "n_samples": latest.get("n_samples"),
        "history_length": len(history),
        "source": "rl_trained",
    }


# ---------------------------------------------------------------
# GET /ml/stabling-readiness
# ---------------------------------------------------------------
@router.get("/stabling-readiness")
async def ml_stabling_readiness():
    """Return stabling bay deployment readiness for all trains."""
    import pandas as pd
    stab_path = PUBLIC_DIR / "train_stabling_geometry.csv"
    if not stab_path.exists():
        return JSONResponse(status_code=404, content={"error": "Stabling geometry CSV not found"})

    stab = pd.read_csv(stab_path)
    records = []
    for _, row in stab.iterrows():
        op_eff = float(row.get("operational_efficiency", 0))
        deploy_time = float(row.get("deployment_time_minutes", 99))
        complexity = str(row.get("shunting_complexity", "high")).lower()
        water = str(row.get("water_supply_available", "no")).lower() == "yes"
        power = str(row.get("power_supply_available", "no")).lower() == "yes"
        ready = (
            op_eff >= 80
            and deploy_time <= 12
            and complexity in ["low", "medium"]
            and water
            and power
        )
        records.append({
            "train_id": row["train_id"],
            "stabling_bay": row["stabling_bay"],
            "bay_type": row.get("bay_type", "unknown"),
            "operational_efficiency": op_eff,
            "deployment_time_minutes": deploy_time,
            "shunting_complexity": complexity,
            "water_supply": water,
            "power_supply": power,
            "deployment_ready": ready,
        })

    ready_count = sum(1 for r in records if r["deployment_ready"])
    return {
        "total": len(records),
        "deployment_ready": ready_count,
        "not_ready": len(records) - ready_count,
        "trains": records,
    }
