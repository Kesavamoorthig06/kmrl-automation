"""
Unified Data Adapter — bridges the 6 public CSVs into a single
normalised DataFrame that both the .pkl station-master model and
the pipeline's own XGBoost models can consume.

Key responsibilities:
  1. Normalise train IDs (R-001 ↔ TS-001) into a canonical format.
  2. Map heterogeneous CSV columns → .pkl model features.
  3. Map heterogeneous CSV columns → pipeline feature_engine features.
  4. Persist a unified snapshot for RL reward tracking.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from config import (
    PROCESSED_DIR, RAW_DIR, TRAINSET_IDS, NUM_TRAINSETS,
    MIN_OPERATIONAL_EFFICIENCY, MAX_DEPLOYMENT_TIME_MINUTES,
    ALLOWED_SHUNTING_COMPLEXITY, REQUIRE_WATER_SUPPLY,
    REQUIRE_POWER_SUPPLY,
)

# ---------------------------------------------------------------------------
# Train ID normalisation helpers
# ---------------------------------------------------------------------------
# Dashboard uses R-001..R-025, pipeline uses TS-001..TS-025

def _r_to_ts(r_id: str) -> str:
    """R-004 → TS-004"""
    num = int(r_id.split("-")[1])
    return f"TS-{num:03d}"

def _ts_to_r(ts_id: str) -> str:
    """TS-004 → R-004"""
    num = int(ts_id.split("-")[1])
    return f"R-{num:03d}"

def normalise_train_id(raw_id: str) -> str:
    """Accept any format (R-004, TS-004, 4, Train-4) → canonical TS-XXX"""
    raw = str(raw_id).strip().upper()
    if raw.startswith("TS-"):
        return raw
    if raw.startswith("R-"):
        return _r_to_ts(raw)
    if raw.startswith("TRAIN-"):
        num = int(raw.replace("TRAIN-", ""))
        return f"TS-{num:03d}"
    # Bare integer
    try:
        num = int(raw)
        return f"TS-{num:03d}"
    except ValueError:
        return raw  # pass-through if unknown format

# ---------------------------------------------------------------------------
# Canonical data directory for public CSVs
# ---------------------------------------------------------------------------
PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"

# ---------------------------------------------------------------------------
# Loader: 6 public CSVs → one merged DataFrame (one row per train)
# ---------------------------------------------------------------------------

def load_public_csvs(public_dir: Path = PUBLIC_DIR) -> dict[str, pd.DataFrame]:
    """Load all 6 domain CSVs and normalise train_id."""
    files = {
        "fitness":  "train_fitness_certificates.csv",
        "jobs":     "train_job_cards.csv",
        "branding": "train_branding_priorities.csv",
        "mileage":  "train_mileage_data.csv",
        "cleaning": "train_cleaning_status.csv",
        "stabling": "train_stabling_geometry.csv",
    }
    dfs = {}
    for key, fname in files.items():
        path = public_dir / fname
        df = pd.read_csv(path)
        df["train_id_norm"] = df["train_id"].apply(normalise_train_id)
        dfs[key] = df
    return dfs


def build_pkl_features(dfs: dict[str, pd.DataFrame],
                       ref_date: datetime | None = None) -> pd.DataFrame:
    """
    Map the 6 public CSVs → the 14 features expected by
    kmrl_station_master_model.pkl.

    Returns one row per train with columns:
      days_to_rs_expiry, days_to_sig_expiry, open_job_cards,
      maximo_fault_severity, iot_vibration_score, iot_brake_pressure,
      iot_comms_latency, iot_temp_anomaly, monthly_exposure_gap,
      curr_mileage_km, mileage_target_delta, hrs_since_last_clean,
      is_branded, cleaning_bay_avail
    """
    if ref_date is None:
        ref_date = datetime.now()

    fit   = dfs["fitness"]
    jobs  = dfs["jobs"]
    brand = dfs["branding"]
    mile  = dfs["mileage"]
    clean = dfs["cleaning"]
    stab  = dfs["stabling"]

    rows = []
    for _, fr in fit.iterrows():
        tid = fr["train_id_norm"]

        # --- Fitness cert days -----------------------------------------------------------
        # If compliance_status is Compliant, treat certs as valid regardless of
        # stale expiry dates in the snapshot CSV (data may be from an older period).
        compliant = str(fr.get("compliance_status", "")).lower() == "compliant"
        expiry = pd.to_datetime(fr.get("certificate_expiry_date", None), errors="coerce")
        raw_days = (expiry - pd.Timestamp(ref_date)).days if pd.notna(expiry) else 90
        # If compliant but expiry is in the past, assume cert was renewed
        base_days = max(raw_days, 60) if compliant else raw_days
        rs_valid  = 1 if str(fr.get("rolling_stock_certificate", "")).lower() == "valid" else 0
        sig_valid = 1 if str(fr.get("signalling_certificate", "")).lower() == "valid" else 0
        days_to_rs  = base_days if rs_valid else max(base_days, 0) - 30
        days_to_sig = base_days if sig_valid else max(base_days, 0) - 30

        # --- Job cards -------------------------------------------------------------------
        jrow = jobs[jobs["train_id_norm"] == tid]
        open_jobs = 0
        max_sev = 0
        if len(jrow):
            j = jrow.iloc[0]
            status = str(j.get("job_card_status", "")).lower()
            open_jobs = 0 if status == "completed" else 1
            prio = str(j.get("priority_level", "")).lower()
            max_sev = {"low": 1, "medium": 2, "high": 3, "critical": 4}.get(prio, 1)
            open_jobs += int(j.get("critical_issues", 0))

        # --- IoT (simulated from mileage + stabling) ------------------------------------
        mrow = mile[mile["train_id_norm"] == tid]
        brake_hours = 0
        curr_km = 0
        target_delta = 0
        if len(mrow):
            m = mrow.iloc[0]
            curr_km = float(m.get("total_mileage", 0))
            brake_hours = float(m.get("brake_usage_hours", 0))
            next_svc = float(m.get("next_service_due", curr_km + 5000))
            target_delta = curr_km - next_svc
            wear = float(m.get("wear_factor", 0.5))
        else:
            wear = 0.5

        # Derive IoT proxies from wear/performance data
        np.random.seed(hash(tid) % (2**31))
        iot_vib   = round(np.clip(wear * 100 + np.random.normal(0, 5), 0, 100), 2)
        iot_brake = round(np.clip(brake_hours / 50 + np.random.normal(0, 2), 0, 100), 2)
        iot_comms = round(np.clip(np.random.exponential(10), 1, 100), 2)
        iot_temp  = round(np.clip(np.random.normal(0, 0.3), -1, 1), 2)

        # --- Branding -------------------------------------------------------------------
        brow = brand[brand["train_id_norm"] == tid]
        monthly_gap = 0
        is_branded = "no"
        if len(brow):
            b = brow.iloc[0]
            completion = float(b.get("completion_percentage", 100))
            monthly_gap = max(0, 100 - completion)
            adv_status = str(b.get("advertisement_status", "")).lower()
            is_branded = "yes" if adv_status == "active" else "no"

        # --- Cleaning -------------------------------------------------------------------
        crow = clean[clean["train_id_norm"] == tid]
        hrs_since = 0
        bay_avail = 1
        if len(crow):
            c = crow.iloc[0]
            last_clean = pd.to_datetime(c.get("last_cleaned_date", None), errors="coerce")
            if pd.notna(last_clean):
                hrs_since = max(0, (pd.Timestamp(ref_date) - last_clean).total_seconds() / 3600)
            bay_avail = 1  # always at least 1 available in snapshot

        rows.append({
            "train_id_norm": tid,
            "days_to_rs_expiry": days_to_rs,
            "days_to_sig_expiry": days_to_sig,
            "open_job_cards": open_jobs,
            "maximo_fault_severity": max_sev,
            "iot_vibration_score": iot_vib,
            "iot_brake_pressure": iot_brake,
            "iot_comms_latency": iot_comms,
            "iot_temp_anomaly": iot_temp,
            "monthly_exposure_gap": monthly_gap,
            "curr_mileage_km": curr_km,
            "mileage_target_delta": target_delta,
            "hrs_since_last_clean": hrs_since,
            "is_branded": is_branded,
            "cleaning_bay_avail": bay_avail,
        })

    return pd.DataFrame(rows)


def build_pipeline_features(dfs: dict[str, pd.DataFrame],
                            ref_date: datetime | None = None) -> pd.DataFrame:
    """
    Map the 6 public CSVs → a single-date snapshot compatible with
    the pipeline's feature_engine.FEATURE_COLS (33 features).

    Returns one row per train for the given date.
    """
    if ref_date is None:
        ref_date = datetime.now()
    ts_date = pd.Timestamp(ref_date)

    fit   = dfs["fitness"]
    jobs  = dfs["jobs"]
    brand = dfs["branding"]
    mile  = dfs["mileage"]
    clean = dfs["cleaning"]
    stab  = dfs["stabling"]

    rows = []
    for tid_norm in sorted(fit["train_id_norm"].unique()):
        fr = fit[fit["train_id_norm"] == tid_norm].iloc[0]
        mrow = mile[mile["train_id_norm"] == tid_norm]
        jrow = jobs[jobs["train_id_norm"] == tid_norm]
        brow = brand[brand["train_id_norm"] == tid_norm]
        crow = clean[clean["train_id_norm"] == tid_norm]
        srow = stab[stab["train_id_norm"] == tid_norm]

        m = mrow.iloc[0] if len(mrow) else pd.Series(dtype=float)
        j = jrow.iloc[0] if len(jrow) else pd.Series(dtype=float)
        b = brow.iloc[0] if len(brow) else pd.Series(dtype=float)
        c = crow.iloc[0] if len(crow) else pd.Series(dtype=float)
        s = srow.iloc[0] if len(srow) else pd.Series(dtype=float)

        # Mileage features
        daily_km = float(m.get("daily_average", 0)) if len(mrow) else 0
        cumulative_km = float(m.get("total_mileage", 0)) if len(mrow) else 0
        fleet_mean_km = mile["total_mileage"].astype(float).mean() if len(mile) else cumulative_km
        km_dev = cumulative_km - fleet_mean_km
        bogie_hrs = float(m.get("engine_hours", 0)) / 1000 if len(mrow) else 0
        brake_wear = float(m.get("wear_factor", 0)) if len(mrow) else 0
        hvac_hrs = float(m.get("operational_hours", 0)) / 1000 if len(mrow) else 0
        door_cyc = int(daily_km * 12)  # approx

        # Fitness — handle stale expiry dates in snapshot CSVs
        compliant = str(fr.get("compliance_status", "")).lower() == "compliant"
        expiry = pd.to_datetime(fr.get("certificate_expiry_date", None), errors="coerce")
        raw_days = int((expiry - ts_date).days) if pd.notna(expiry) else 90
        base_days = max(raw_days, 60) if compliant else raw_days
        rs_ok  = str(fr.get("rolling_stock_certificate", "")).lower() == "valid"
        sig_ok = str(fr.get("signalling_certificate", "")).lower() == "valid"
        tel_ok = str(fr.get("telecom_certificate", "")).lower() == "valid"
        cert_rs  = base_days if rs_ok else -10
        cert_sig = base_days if sig_ok else -10
        cert_tel = base_days if tel_ok else -10
        min_cert = min(cert_rs, cert_sig, cert_tel)
        any_expired = 1 if min_cert <= 0 else 0
        cert_soon = 1 if 0 < min_cert <= 7 else 0

        # Job cards
        open_count = 0
        crit_count = 0
        if len(jrow):
            status = str(j.get("job_card_status", "")).lower()
            if status != "completed":
                open_count = 1
            crit_count = int(j.get("critical_issues", 0))

        # Branding
        daily_exp = 0
        exp_gap = 0
        urgency = 0
        if len(brow):
            completion = float(b.get("completion_percentage", 100))
            daily_exp = completion / 100 * 18  # proxy
            exp_gap = max(0, 100 - completion)
            contract_val = float(b.get("contract_value", 0))
            urgency = exp_gap * (contract_val / 100000)

        # Cleaning
        days_since = 0
        needs_clean = 0
        if len(crow):
            last_dt = pd.to_datetime(c.get("last_cleaned_date", None), errors="coerce")
            if pd.notna(last_dt):
                days_since = max(0, (ts_date - last_dt).days)
            needs_clean = 1 if days_since > 7 else 0
        avail_bays = 3
        avail_man = 8

        # Stabling
        bay_num = 1
        is_ibl = 0
        shunt_cost = 0
        turnout = 1
        deployment_ready = True  # default
        operational_efficiency = 95
        deployment_time = 8
        shunting_complexity = "low"
        if len(srow):
            bay_str = str(s.get("stabling_bay", "A1"))
            bay_num = int("".join(c for c in bay_str if c.isdigit()) or "1")
            shunt_dist = float(s.get("shunting_distance_meters", 0))
            shunt_cost = shunt_dist / 100
            is_ibl = 1 if bay_num <= 5 else 0
            turnout = bay_num
            # Stabling geometry deployment readiness
            operational_efficiency = float(s.get("operational_efficiency", 95))
            deployment_time = float(s.get("deployment_time_minutes", 8))
            shunting_complexity = str(s.get("shunting_complexity", "low")).lower()
            water_ok = str(s.get("water_supply_available", "yes")).lower() == "yes" if REQUIRE_WATER_SUPPLY else True
            power_ok = str(s.get("power_supply_available", "yes")).lower() == "yes" if REQUIRE_POWER_SUPPLY else True
            deployment_ready = (
                operational_efficiency >= MIN_OPERATIONAL_EFFICIENCY
                and deployment_time <= MAX_DEPLOYMENT_TIME_MINUTES
                and shunting_complexity in ALLOWED_SHUNTING_COMPLEXITY
                and water_ok
                and power_ok
            )

        # Faults (derive from job card critical issues)
        fault_count = crit_count
        crit_faults = crit_count
        high_faults = 0
        any_withdrawal = 0

        rows.append({
            "date": ts_date,
            "trainset_id": tid_norm,
            # Mileage (8)
            "daily_km": daily_km, "cumulative_km": cumulative_km,
            "km_deviation_from_mean": km_dev,
            "km_balance_score": abs(km_dev),
            "bogie_hours": bogie_hrs, "brake_pad_wear_index": brake_wear,
            "hvac_run_hours": hvac_hrs, "door_cycles": door_cyc,
            # Fitness (6)
            "cert_days_rolling_stock": cert_rs,
            "cert_days_signalling": cert_sig,
            "cert_days_telecom": cert_tel,
            "min_cert_days": min_cert,
            "any_cert_expired": any_expired,
            "cert_expiring_soon": cert_soon,
            # Jobs (3)
            "open_job_count": open_count, "critical_open_jobs": crit_count,
            "has_critical_open": 1 if crit_count > 0 else 0,
            # Branding (3)
            "daily_exposure": daily_exp, "exposure_gap": exp_gap,
            "branding_urgency": urgency,
            # Cleaning (4)
            "days_since_deep_clean": days_since, "needs_cleaning": needs_clean,
            "available_cleaning_bays": avail_bays, "available_manpower": avail_man,
            # Stabling (4 + 4 deployment readiness)
            "bay_number": bay_num, "is_ibl_bay": is_ibl,
            "shunt_cost": shunt_cost, "turnout_order": turnout,
            "deployment_ready": deployment_ready,
            "operational_efficiency": operational_efficiency,
            "deployment_time_minutes": deployment_time,
            "shunting_complexity": shunting_complexity,
            # Faults (4)
            "fault_count": fault_count, "critical_faults": crit_faults,
            "high_faults": high_faults, "any_withdrawal": any_withdrawal,
            # Temporal (1)
            "day_of_week": ts_date.dayofweek,
        })

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Snapshot persistence for RL reward tracking
# ---------------------------------------------------------------------------
SNAPSHOT_DIR = PROCESSED_DIR / "snapshots"
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)


def save_snapshot(df: pd.DataFrame, tag: str = ""):
    """Persist a dated snapshot for RL accumulation."""
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    name = f"snapshot_{tag}_{ts}.csv" if tag else f"snapshot_{ts}.csv"
    path = SNAPSHOT_DIR / name
    df.to_csv(path, index=False)
    return path


if __name__ == "__main__":
    dfs = load_public_csvs()
    print("=== PKL features ===")
    pkl_df = build_pkl_features(dfs)
    print(pkl_df.head(5).to_string())
    print(f"\nShape: {pkl_df.shape}")
    print("\n=== Pipeline features ===")
    pipe_df = build_pipeline_features(dfs)
    print(pipe_df.head(3).to_string())
    print(f"\nShape: {pipe_df.shape}")
