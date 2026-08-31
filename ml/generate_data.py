"""
Generates realistic synthetic data for all 6 inter-dependent variables
plus historical outcomes (labels) for ML training.

Datasets:
  1. mileage.csv          - daily km, cumulative, bogie/brake/hvac wear
  2. fitness_certificates  - 3-department cert validity windows
  3. job_cards.csv         - Maximo-style work orders (open/closed/critical)
  4. branding.csv          - contract exposure hours vs targets
  5. cleaning_slots.csv    - bay + manpower availability, cleanliness state
  6. stabling.csv          - bay positions, shunt cost, turnout order
  7. fault_events.csv      - random fault events per trainset
  8. historical_decisions  - assignment + outcome labels for ML
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from config import (
    NUM_TRAINSETS, TRAINSET_IDS, NUM_DAYS_HISTORY,
    FITNESS_DEPARTMENTS, NUM_BRANDING_CONTRACTS,
    IBL_BAYS, STABLING_BAYS, DAILY_SERVICE_REQUIRED,
    DAILY_STANDBY_REQUIRED, RAW_DIR, RANDOM_SEED
)

np.random.seed(RANDOM_SEED)

START_DATE = datetime(2025, 1, 1)


def generate_mileage_data() -> pd.DataFrame:
    """Daily mileage per trainset. 200-400 km/day when in service, 0 otherwise."""
    rows = []
    cumulative = {ts: np.random.uniform(50000, 200000) for ts in TRAINSET_IDS}

    for day_idx in range(NUM_DAYS_HISTORY):
        date = START_DATE + timedelta(days=day_idx)
        for ts in TRAINSET_IDS:
            in_service = np.random.random() < 0.72
            daily_km = np.random.uniform(200, 420) if in_service else 0
            cumulative[ts] += daily_km
            rows.append({
                "date": date,
                "trainset_id": ts,
                "daily_km": round(daily_km, 1),
                "cumulative_km": round(cumulative[ts], 1),
                "bogie_hours": round(daily_km / 45, 1),
                "brake_pad_wear_index": round(np.random.uniform(0.0, 0.05) if in_service else 0, 4),
                "hvac_run_hours": round(np.random.uniform(14, 18) if in_service else np.random.uniform(2, 6), 1),
                "door_cycles": int(np.random.uniform(800, 1500)) if in_service else 0,
            })

    df = pd.DataFrame(rows)
    df.to_csv(RAW_DIR / "mileage.csv", index=False)
    print(f"  [OK] mileage.csv -> {len(df)} rows")
    return df


def generate_fitness_certificates() -> pd.DataFrame:
    """Fitness certs from 3 departments per trainset.
    Realistic: ~85% of certs valid at any time, ~10% expiring soon, ~5% expired."""
    rows = []
    # Track cert state per (trainset, dept) so it evolves realistically
    cert_state = {}
    for ts in TRAINSET_IDS:
        for dept in FITNESS_DEPARTMENTS:
            # Initial cert: issued recently, long validity
            validity = int(np.random.choice([60, 90, 120]))
            issued_ago = int(np.random.randint(5, validity - 10))
            cert_state[(ts, dept)] = {
                "issue_date": START_DATE - timedelta(days=issued_ago),
                "validity_days": validity,
            }

    for day_idx in range(NUM_DAYS_HISTORY):
        date = START_DATE + timedelta(days=day_idx)
        for ts in TRAINSET_IDS:
            for dept in FITNESS_DEPARTMENTS:
                state = cert_state[(ts, dept)]
                expiry_date = state["issue_date"] + timedelta(days=state["validity_days"])
                days_to_expiry = (expiry_date - date).days

                # If expired or about to expire, renew with 80% probability
                if days_to_expiry <= 0 and np.random.random() < 0.80:
                    new_validity = int(np.random.choice([45, 60, 90, 120]))
                    cert_state[(ts, dept)] = {
                        "issue_date": date,
                        "validity_days": new_validity,
                    }
                    expiry_date = date + timedelta(days=new_validity)
                    days_to_expiry = new_validity

                is_valid = days_to_expiry > 0
                rows.append({
                    "date": date,
                    "trainset_id": ts,
                    "department": dept,
                    "issue_date": state["issue_date"],
                    "expiry_date": expiry_date,
                    "days_to_expiry": days_to_expiry,
                    "is_valid": is_valid,
                })

    df = pd.DataFrame(rows)
    df.to_csv(RAW_DIR / "fitness_certificates.csv", index=False)
    print(f"  [OK] fitness_certificates.csv -> {len(df)} rows")
    return df


def generate_job_cards() -> pd.DataFrame:
    """Maximo-style work orders. Open jobs = not ready for service."""
    rows = []
    job_counter = 0

    for day_idx in range(NUM_DAYS_HISTORY):
        date = START_DATE + timedelta(days=day_idx)
        for ts in TRAINSET_IDS:
            num_new_jobs = np.random.choice([0, 0, 0, 1, 1, 2, 3], p=[0.3, 0.15, 0.1, 0.2, 0.1, 0.1, 0.05])
            for _ in range(num_new_jobs):
                job_counter += 1
                is_critical = np.random.random() < 0.12
                days_to_close = np.random.randint(1, 6) if is_critical else np.random.randint(0, 4)
                close_date = date + timedelta(days=days_to_close)
                job_type = np.random.choice([
                    "brake_inspection", "door_repair", "hvac_service", "signalling_check",
                    "telecom_repair", "bogie_service", "electrical", "general_maintenance",
                ])
                rows.append({
                    "job_id": f"JOB-{job_counter:06d}",
                    "date_opened": date,
                    "trainset_id": ts,
                    "job_type": job_type,
                    "is_critical": is_critical,
                    "date_closed": close_date,
                    "status_on_date": "open",
                })

    df = pd.DataFrame(rows)
    df.to_csv(RAW_DIR / "job_cards.csv", index=False)
    print(f"  [OK] job_cards.csv -> {len(df)} rows")
    return df


def generate_branding_data() -> pd.DataFrame:
    """Branding contracts assigned to trainsets with target exposure hours/month."""
    contracts = []
    for c in range(1, NUM_BRANDING_CONTRACTS + 1):
        assigned_trains = np.random.choice(TRAINSET_IDS, size=np.random.randint(2, 6), replace=False).tolist()
        target_hours_per_month = np.random.choice([200, 300, 400, 500])
        contracts.append({
            "contract_id": f"BRD-{c:03d}",
            "assigned_trainsets": assigned_trains,
            "target_hours_per_month": target_hours_per_month,
            "penalty_per_hour_missed": round(np.random.uniform(500, 2000), 0),
        })

    rows = []
    for day_idx in range(NUM_DAYS_HISTORY):
        date = START_DATE + timedelta(days=day_idx)
        for contract in contracts:
            for ts in contract["assigned_trainsets"]:
                in_service = np.random.random() < 0.72
                exposure_hours = round(np.random.uniform(14, 18), 1) if in_service else 0
                rows.append({
                    "date": date,
                    "contract_id": contract["contract_id"],
                    "trainset_id": ts,
                    "exposure_hours": exposure_hours,
                    "target_hours_per_month": contract["target_hours_per_month"],
                    "penalty_per_hour_missed": contract["penalty_per_hour_missed"],
                })

    df = pd.DataFrame(rows)
    df.to_csv(RAW_DIR / "branding.csv", index=False)
    print(f"  [OK] branding.csv -> {len(df)} rows")
    return df


def generate_cleaning_slots() -> pd.DataFrame:
    """Nightly cleaning bay availability + manpower."""
    rows = []

    for day_idx in range(NUM_DAYS_HISTORY):
        date = START_DATE + timedelta(days=day_idx)
        available_manpower = np.random.randint(4, 12)
        available_bays = int(np.random.choice(range(1, 5), p=[0.05, 0.15, 0.4, 0.4]))
        for ts in TRAINSET_IDS:
            days_since_deep_clean = np.random.randint(1, 30)
            needs_cleaning = days_since_deep_clean > 7
            rows.append({
                "date": date,
                "trainset_id": ts,
                "days_since_deep_clean": days_since_deep_clean,
                "needs_cleaning": needs_cleaning,
                "available_cleaning_bays": available_bays,
                "available_manpower": available_manpower,
            })

    df = pd.DataFrame(rows)
    df.to_csv(RAW_DIR / "cleaning_slots.csv", index=False)
    print(f"  [OK] cleaning_slots.csv -> {len(df)} rows")
    return df


def generate_stabling_geometry() -> pd.DataFrame:
    """Nightly stabling positions. Shunt cost = moves to get train out in morning."""
    all_bays = IBL_BAYS + STABLING_BAYS
    rows = []

    for day_idx in range(NUM_DAYS_HISTORY):
        date = START_DATE + timedelta(days=day_idx)
        shuffled_bays = np.random.choice(all_bays, size=NUM_TRAINSETS, replace=False)
        for idx, ts in enumerate(TRAINSET_IDS):
            bay = shuffled_bays[idx]
            bay_num = int(bay.split("-")[1])
            shunt_cost = max(0, bay_num - 5) * np.random.uniform(0.8, 1.2)
            is_ibl_bay = bay in IBL_BAYS
            rows.append({
                "date": date,
                "trainset_id": ts,
                "bay_id": bay,
                "bay_number": bay_num,
                "is_ibl_bay": is_ibl_bay,
                "shunt_cost": round(shunt_cost, 2),
                "turnout_order": idx + 1,
            })

    df = pd.DataFrame(rows)
    df.to_csv(RAW_DIR / "stabling.csv", index=False)
    print(f"  [OK] stabling.csv -> {len(df)} rows")
    return df


def generate_fault_events() -> pd.DataFrame:
    """Random fault events affecting service readiness."""
    rows = []
    fault_types = [
        "door_malfunction", "brake_fault", "hvac_failure", "signalling_error",
        "telecom_down", "power_supply_issue", "pantograph_fault", "coupling_issue"
    ]
    severity_levels = ["low", "medium", "high", "critical"]

    for day_idx in range(NUM_DAYS_HISTORY):
        date = START_DATE + timedelta(days=day_idx)
        num_faults = np.random.randint(2, 9)
        affected_trains = np.random.choice(TRAINSET_IDS, size=num_faults, replace=True)
        for ts in affected_trains:
            severity = np.random.choice(severity_levels, p=[0.4, 0.3, 0.2, 0.1])
            resolved_hours = {
                "low": np.random.uniform(0.5, 4),
                "medium": np.random.uniform(2, 12),
                "high": np.random.uniform(8, 48),
                "critical": np.random.uniform(24, 120),
            }[severity]
            rows.append({
                "date": date,
                "trainset_id": ts,
                "fault_type": np.random.choice(fault_types),
                "severity": severity,
                "resolved_in_hours": round(resolved_hours, 1),
                "caused_withdrawal": severity in ["high", "critical"] and np.random.random() < 0.6,
            })

    df = pd.DataFrame(rows)
    df.to_csv(RAW_DIR / "fault_events.csv", index=False)
    print(f"  [OK] fault_events.csv -> {len(df)} rows")
    return df


def generate_historical_decisions_and_outcomes() -> pd.DataFrame:
    """
    KEY dataset: feature-driven assignment + correlated outcomes.
    Trains with bad fitness / critical jobs / high faults -> IBL.
    Trains with high mileage deviation or needing cleaning -> STANDBY.
    Best trains -> SERVICE. Outcomes correlate with decision quality.
    """
    # We need fitness + job + fault data to make correlated decisions.
    # Load the already-generated raw CSVs.
    fitness_df = pd.read_csv(RAW_DIR / "fitness_certificates.csv", parse_dates=["date"])
    jobs_df = pd.read_csv(RAW_DIR / "job_cards.csv", parse_dates=["date_opened", "date_closed"])
    mileage_df = pd.read_csv(RAW_DIR / "mileage.csv", parse_dates=["date"])
    faults_df = pd.read_csv(RAW_DIR / "fault_events.csv", parse_dates=["date"])
    cleaning_df = pd.read_csv(RAW_DIR / "cleaning_slots.csv", parse_dates=["date"])

    rows = []

    for day_idx in range(NUM_DAYS_HISTORY):
        date = START_DATE + timedelta(days=day_idx)
        ts_date = pd.Timestamp(date)

        # --- Compute a readiness score per trainset for this night ---
        scores = {}
        for ts in TRAINSET_IDS:
            score = 50.0  # baseline

            # Fitness: any expired cert = big penalty
            fit = fitness_df[(fitness_df["date"] == ts_date) & (fitness_df["trainset_id"] == ts)]
            if len(fit) > 0:
                min_days = fit["days_to_expiry"].min()
                if min_days <= 0:
                    score -= 40  # expired -> strong push to IBL
                elif min_days <= 7:
                    score -= 15  # expiring soon
                else:
                    score += 5

            # Open critical jobs -> penalty
            open_jobs = jobs_df[
                (jobs_df["trainset_id"] == ts) &
                (jobs_df["date_opened"] <= ts_date) &
                (jobs_df["date_closed"] > ts_date)
            ]
            n_critical = open_jobs["is_critical"].sum() if len(open_jobs) > 0 else 0
            n_open = len(open_jobs)
            score -= n_critical * 25
            score -= n_open * 3

            # Recent faults -> penalty
            recent_faults = faults_df[
                (faults_df["trainset_id"] == ts) & (faults_df["date"] == ts_date)
            ]
            if len(recent_faults) > 0:
                score -= len(recent_faults) * 5
                score -= (recent_faults["severity"] == "critical").sum() * 15
                score -= (recent_faults["severity"] == "high").sum() * 8

            # Mileage balance: prefer trains below fleet average
            mil = mileage_df[(mileage_df["date"] == ts_date) & (mileage_df["trainset_id"] == ts)]
            if len(mil) > 0:
                cum_km = mil["cumulative_km"].values[0]
                fleet_mean = mileage_df[mileage_df["date"] == ts_date]["cumulative_km"].mean()
                deviation = (cum_km - fleet_mean) / max(fleet_mean, 1) * 100
                score -= deviation * 0.5  # above average = slight penalty

            # Cleaning need: dirty trains slightly lower
            cl = cleaning_df[(cleaning_df["date"] == ts_date) & (cleaning_df["trainset_id"] == ts)]
            if len(cl) > 0 and cl["needs_cleaning"].values[0]:
                score -= 8

            # Add noise so it's not perfectly deterministic
            score += np.random.normal(0, 5)
            scores[ts] = score

        # --- Rank and assign based on score ---
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        service_trains = [ts for ts, _ in ranked[:DAILY_SERVICE_REQUIRED]]
        standby_trains = [ts for ts, _ in ranked[DAILY_SERVICE_REQUIRED:DAILY_SERVICE_REQUIRED + DAILY_STANDBY_REQUIRED]]
        ibl_trains = [ts for ts, _ in ranked[DAILY_SERVICE_REQUIRED + DAILY_STANDBY_REQUIRED:]]

        for ts in TRAINSET_IDS:
            readiness = scores[ts]
            if ts in service_trains:
                assignment = "SERVICE"
                # Better readiness -> lower withdrawal risk
                withdrawal_prob = max(0.001, 0.08 - readiness * 0.001)
                unscheduled_withdrawal = np.random.random() < withdrawal_prob
                punctuality_score = np.random.uniform(0.96, 1.0) if not unscheduled_withdrawal else np.random.uniform(0.6, 0.85)
                branding_sla_met = np.random.random() < (0.85 + readiness * 0.002)
            elif ts in standby_trains:
                assignment = "STANDBY"
                unscheduled_withdrawal = False
                punctuality_score = np.random.uniform(0.92, 1.0)
                branding_sla_met = True
            else:
                assignment = "IBL"
                unscheduled_withdrawal = False
                punctuality_score = 1.0
                branding_sla_met = True

            outcome_score = (
                0.4 * punctuality_score +
                0.2 * (1.0 if not unscheduled_withdrawal else 0.0) +
                0.2 * (1.0 if branding_sla_met else 0.0) +
                0.2 * np.random.uniform(0.7, 1.0)
            )

            rows.append({
                "date": date,
                "trainset_id": ts,
                "assignment": assignment,
                "unscheduled_withdrawal": unscheduled_withdrawal,
                "punctuality_score": round(punctuality_score, 4),
                "branding_sla_met": branding_sla_met,
                "outcome_score": round(outcome_score, 4),
            })

        if day_idx % 50 == 0:
            print(f"    decisions day {day_idx}/{NUM_DAYS_HISTORY}...")

    df = pd.DataFrame(rows)
    df.to_csv(RAW_DIR / "historical_decisions.csv", index=False)
    print(f"  [OK] historical_decisions.csv -> {len(df)} rows")
    return df


def generate_all():
    """Generate all synthetic datasets."""
    print("=" * 60)
    print("GENERATING SYNTHETIC DATA FOR KMRL INDUCTION PLANNING")
    print("=" * 60)

    generate_mileage_data()
    generate_fitness_certificates()
    generate_job_cards()
    generate_branding_data()
    generate_cleaning_slots()
    generate_stabling_geometry()
    generate_fault_events()
    generate_historical_decisions_and_outcomes()

    print("=" * 60)
    print("ALL DATA GENERATED SUCCESSFULLY")
    print(f"Output directory: {RAW_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    generate_all()
