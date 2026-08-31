"""
Feature Engineering: joins all raw data sources into a single feature matrix
per (date, trainset_id) — the "nightly planning view".
"""

import pandas as pd
import numpy as np
from config import RAW_DIR, PROCESSED_DIR, FITNESS_DEPARTMENTS


def load_raw():
    data = {}
    date_cols = {
        "mileage": ["date"],
        "fitness_certificates": ["date", "issue_date", "expiry_date"],
        "job_cards": ["date_opened", "date_closed"],
        "branding": ["date"],
        "cleaning_slots": ["date"],
        "stabling": ["date"],
        "fault_events": ["date"],
        "historical_decisions": ["date"],
    }
    for name in date_cols:
        path = RAW_DIR / f"{name}.csv"
        data[name] = pd.read_csv(path, parse_dates=date_cols[name])
    return data


def build_mileage_features(mileage: pd.DataFrame) -> pd.DataFrame:
    fleet_mean = mileage.groupby("date")["cumulative_km"].transform("mean")
    mileage = mileage.copy()
    mileage["km_deviation_from_mean"] = mileage["cumulative_km"] - fleet_mean
    mileage["km_balance_score"] = mileage["km_deviation_from_mean"].abs()

    return mileage[[
        "date", "trainset_id", "daily_km", "cumulative_km",
        "km_deviation_from_mean", "km_balance_score",
        "bogie_hours", "brake_pad_wear_index", "hvac_run_hours", "door_cycles"
    ]].copy()


def build_fitness_features(fitness: pd.DataFrame) -> pd.DataFrame:
    pivot = fitness.pivot_table(
        index=["date", "trainset_id"],
        columns="department",
        values="days_to_expiry",
        aggfunc="min"
    ).reset_index()

    pivot.columns = ["date", "trainset_id"] + [f"cert_days_{d}" for d in FITNESS_DEPARTMENTS]
    pivot["min_cert_days"] = pivot[[f"cert_days_{d}" for d in FITNESS_DEPARTMENTS]].min(axis=1)
    pivot["any_cert_expired"] = (pivot["min_cert_days"] <= 0).astype(int)
    pivot["cert_expiring_soon"] = ((pivot["min_cert_days"] > 0) & (pivot["min_cert_days"] <= 7)).astype(int)

    return pivot


def build_jobcard_features(jobs: pd.DataFrame) -> pd.DataFrame:
    jobs = jobs.copy()
    jobs["date_opened"] = pd.to_datetime(jobs["date_opened"])
    jobs["date_closed"] = pd.to_datetime(jobs["date_closed"])

    all_dates = sorted(jobs["date_opened"].unique())
    rows = []

    for date in all_dates:
        open_jobs = jobs[(jobs["date_opened"] <= date) & (jobs["date_closed"] > date)]
        summary = open_jobs.groupby("trainset_id").agg(
            open_job_count=("job_id", "count"),
            critical_open_jobs=("is_critical", "sum"),
        ).reset_index()
        summary["date"] = date
        rows.append(summary)

    result = pd.concat(rows, ignore_index=True)
    result["has_critical_open"] = (result["critical_open_jobs"] > 0).astype(int)
    return result


def build_branding_features(branding: pd.DataFrame) -> pd.DataFrame:
    branding = branding.copy()
    branding["month"] = branding["date"].dt.to_period("M")
    monthly_cum = branding.groupby(["month", "trainset_id"]).agg(
        monthly_exposure=("exposure_hours", "sum"),
        target_hours=("target_hours_per_month", "first"),
        max_penalty=("penalty_per_hour_missed", "first"),
    ).reset_index()

    monthly_cum["exposure_gap"] = monthly_cum["target_hours"] - monthly_cum["monthly_exposure"]
    monthly_cum["exposure_gap"] = monthly_cum["exposure_gap"].clip(lower=0)
    monthly_cum["branding_urgency"] = monthly_cum["exposure_gap"] * monthly_cum["max_penalty"]

    branding_daily = branding.groupby(["date", "trainset_id"]).agg(
        daily_exposure=("exposure_hours", "sum"),
    ).reset_index()
    branding_daily["month"] = branding_daily["date"].dt.to_period("M")

    merged = branding_daily.merge(
        monthly_cum[["month", "trainset_id", "exposure_gap", "branding_urgency"]],
        on=["month", "trainset_id"], how="left"
    )
    merged = merged.drop(columns=["month"])
    return merged


def build_cleaning_features(cleaning: pd.DataFrame) -> pd.DataFrame:
    return cleaning[[
        "date", "trainset_id", "days_since_deep_clean", "needs_cleaning",
        "available_cleaning_bays", "available_manpower"
    ]].copy()


def build_stabling_features(stabling: pd.DataFrame) -> pd.DataFrame:
    return stabling[[
        "date", "trainset_id", "bay_number", "is_ibl_bay", "shunt_cost", "turnout_order"
    ]].copy()


def build_fault_features(faults: pd.DataFrame) -> pd.DataFrame:
    daily_faults = faults.groupby(["date", "trainset_id"]).agg(
        fault_count=("fault_type", "count"),
        critical_faults=("severity", lambda x: (x == "critical").sum()),
        high_faults=("severity", lambda x: (x == "high").sum()),
        any_withdrawal=("caused_withdrawal", "any"),
    ).reset_index()
    daily_faults["any_withdrawal"] = daily_faults["any_withdrawal"].astype(int)
    return daily_faults


def build_feature_matrix() -> pd.DataFrame:
    """Master join: merge all feature sets on (date, trainset_id) + labels."""
    print("  Loading raw data...")
    raw = load_raw()

    print("  Building mileage features...")
    f_mileage = build_mileage_features(raw["mileage"])

    print("  Building fitness features...")
    f_fitness = build_fitness_features(raw["fitness_certificates"])

    print("  Building job-card features (this takes a moment)...")
    f_jobs = build_jobcard_features(raw["job_cards"])

    print("  Building branding features...")
    f_branding = build_branding_features(raw["branding"])

    print("  Building cleaning features...")
    f_cleaning = build_cleaning_features(raw["cleaning_slots"])

    print("  Building stabling features...")
    f_stabling = build_stabling_features(raw["stabling"])

    print("  Building fault features...")
    f_faults = build_fault_features(raw["fault_events"])

    decisions = raw["historical_decisions"]

    print("  Merging into unified feature matrix...")
    df = f_mileage.copy()
    for feat_df in [f_fitness, f_jobs, f_branding, f_cleaning, f_stabling, f_faults]:
        df = df.merge(feat_df, on=["date", "trainset_id"], how="left")

    # Join labels
    df = df.merge(
        decisions[["date", "trainset_id", "assignment", "unscheduled_withdrawal",
                    "punctuality_score", "branding_sla_met", "outcome_score"]],
        on=["date", "trainset_id"], how="left"
    )

    # Fill NaN
    fill_zero_cols = [
        "fault_count", "critical_faults", "high_faults", "any_withdrawal",
        "open_job_count", "critical_open_jobs", "has_critical_open",
        "exposure_gap", "branding_urgency", "daily_exposure"
    ]
    for col in fill_zero_cols:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    # Day of week
    df["day_of_week"] = df["date"].dt.dayofweek

    df.to_csv(PROCESSED_DIR / "feature_matrix.csv", index=False)
    print(f"  [OK] feature_matrix.csv -> {df.shape}")
    return df


if __name__ == "__main__":
    build_feature_matrix()
