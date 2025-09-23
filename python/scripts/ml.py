#!/usr/bin/env python3

from __future__ import annotations

import csv
import json
import math
import random
import statistics
import sys
from copy import deepcopy
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Tuple, Optional

# ------------------------
# Config / Hyperparams
# ------------------------
CONFIG = {
    # weights used in final scoring (can be tuned manually or by learning)
    "weights": {
        "mileage": 0.35,
        "branding": 0.45,
        "cleaning": 0.1,
        "shunting": 0.1,
    },
    # target counts
    "service_count": 15,  # number of trainsets required for revenue service
    "standby_count": 5,
    # cleaning capacity
    "cleaning_bays": 4,  # how many deep-cleans can be done overnight
    "cleaning_manpower": 6,  # number of staff available
    # stabling exit positions (for morning turn-out) with coordinates
    "depot_exits": {
        "north_exit": (0, 100),
        "south_exit": (200, -50),
    },
    # bay coordinates (example layout grid) - override with real geometry
    "bay_coords": {
        "A1": (10, 10), "A2": (10, 30), "A3": (10, 50), "A4": (10, 70), "A5": (10, 90), "A7": (10, 110),
        "B1": (50, 10), "B2": (50, 30), "B3": (50, 50), "B4": (50, 70), "B6": (50, 90), "B7": (50, 110),
        "C1": (90, 10), "C2": (90, 30), "C3": (90, 50), "C4": (90, 70), "C5": (90, 90), "C6": (90, 110),
        "D1": (130, 10),"D2": (130,30),"D3":(130,50),"D5":(130,70),"D6":(130,90),"D7":(130,110),
    },
    # branding exposure targets (hours per day) per contract bucket
    "branding_target_hours": 12.0,
    # maximum allowed shunting distance per night (soft constraint)
    "max_shunting_cost": 250.0,
    # GA params
    "ga": {"pop_size": 200, "gens": 350, "mut_rate": 0.12, "elite_frac": 0.08},
    # audit log path
    "audit_log": "../data/tips_audit_log.json",
    "history_path": "../data/tips_history.json",
    # NEW: Log file for shunting costs
    "daily_shunting_log": "../data/daily_shunting_log.json",
}

# ------------------------
# Sample / default dataset (if no loader used)
# ------------------------
DEFAULT_INPUT = {
    "trainsets": [
        { "id": 1, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 7, "mileage": 14500, "last_cleaned_date": "2025-09-05", "stabling_bay": "A3" },
        { "id": 2, "fitness_certificate_valid": False, "job_card_status": "open", "branding_priority": 4, "mileage": 11200, "last_cleaned_date": "2025-09-08", "stabling_bay": "B2" },
        { "id": 3, "fitness_certificate_valid": True, "job_card_status": "open", "branding_priority": 6, "mileage": 8700, "last_cleaned_date": "2025-09-01", "stabling_bay": "C5" },
        { "id": 4, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 9, "mileage": 19500, "last_cleaned_date": "2025-08-28", "stabling_bay": "D1" },
        { "id": 5, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 2, "mileage": 5400, "last_cleaned_date": "2025-09-06", "stabling_bay": "B6" },
        { "id": 6, "fitness_certificate_valid": True, "job_card_status": "open", "branding_priority": 8, "mileage": 16700, "last_cleaned_date": "2025-09-03", "stabling_bay": "C7" },
        { "id": 7, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 3, "mileage": 9600, "last_cleaned_date": "2025-08-30", "stabling_bay": "A5" },
        { "id": 8, "fitness_certificate_valid": False, "job_card_status": "open", "branding_priority": 5, "mileage": 12400, "last_cleaned_date": "2025-09-09", "stabling_bay": "D3" },
        { "id": 9, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 10, "mileage": 17800, "last_cleaned_date": "2025-09-04", "stabling_bay": "B4" },
        { "id": 10, "fitness_certificate_valid": True, "job_card_status": "open", "branding_priority": 1, "mileage": 3100, "last_cleaned_date": "2025-09-07", "stabling_bay": "C2" },
        { "id": 11, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 6, "mileage": 15300, "last_cleaned_date": "2025-09-10", "stabling_bay": "A1" },
        { "id": 12, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 7, "mileage": 8900, "last_cleaned_date": "2025-09-02", "stabling_bay": "D7" },
        { "id": 13, "fitness_certificate_valid": False, "job_card_status": "open", "branding_priority": 2, "mileage": 7200, "last_cleaned_date": "2025-09-06", "stabling_bay": "B1" },
        { "id": 14, "fitness_certificate_valid": True, "job_card_status": "open", "branding_priority": 5, "mileage": 13800, "last_cleaned_date": "2025-09-09", "stabling_bay": "C6" },
        { "id": 15, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 9, "mileage": 16400, "last_cleaned_date": "2025-08-27", "stabling_bay": "A7" },
        { "id": 16, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 3, "mileage": 5800, "last_cleaned_date": "2025-09-05", "stabling_bay": "D5" },
        { "id": 17, "fitness_certificate_valid": True, "job_card_status": "open", "branding_priority": 8, "mileage": 14900, "last_cleaned_date": "2025-09-08", "stabling_bay": "B7" },
        { "id": 18, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 4, "mileage": 10100, "last_cleaned_date": "2025-08-31", "stabling_bay": "C1" },
        { "id": 19, "fitness_certificate_valid": False, "job_card_status": "open", "branding_priority": 6, "mileage": 13400, "last_cleaned_date": "2025-09-04", "stabling_bay": "D6" },
        { "id": 20, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 1, "mileage": 4200, "last_cleaned_date": "2025-09-02", "stabling_bay": "A4" },
        { "id": 21, "fitness_certificate_valid": True, "job_card_status": "open", "branding_priority": 7, "mileage": 17100, "last_cleaned_date": "2025-09-07", "stabling_bay": "B3" },
        { "id": 22, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 2, "mileage": 9400, "last_cleaned_date": "2025-09-01", "stabling_bay": "C4" },
        { "id": 23, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 8, "mileage": 18500, "last_cleaned_date": "2025-09-10", "stabling_bay": "D2" },
        { "id": 24, "fitness_certificate_valid": True, "job_card_status": "open", "branding_priority": 5, "mileage": 12200, "last_cleaned_date": "2025-09-03", "stabling_bay": "A2" },
        { "id": 25, "fitness_certificate_valid": True, "job_card_status": "closed", "branding_priority": 10, "mileage": 19900, "last_cleaned_date": "2025-08-29", "stabling_bay": "C3" }
    ]
}

# ------------------------
# Generate randomized train data for fresh simulation runs
# ------------------------
def generate_randomized_trains(num_trains: int = 25) -> List[Dict[str, Any]]:
    """Generate fresh randomized train data for each simulation run"""
    random.seed()  # Use current time as seed for true randomization
    
    # Available stabling bays
    bays = ["A1", "A2", "A3", "A4", "A5", "A7", "B1", "B2", "B3", "B4", "B6", "B7", 
            "C1", "C2", "C3", "C4", "C5", "C6", "C7", "D1", "D2", "D3", "D5", "D6", "D7"]
    
    trains = []
    today = datetime.today().date()
    
    # Shuffle bays to ensure different distribution each time
    random.shuffle(bays)
    
    for i in range(1, num_trains + 1):
        # Randomize fitness certificate (90% valid - fewer maintenance trains)
        fitness_valid = random.random() > 0.10
        
        # Randomize job card status (85% closed - fewer open jobs)
        job_status = "closed" if random.random() > 0.15 else "open"
        
        # Randomize branding priority with weighted distribution (more high priority)
        branding_priority = random.choices(
            range(1, 11), 
            weights=[1, 1, 2, 2, 3, 3, 4, 4, 5, 6],  # Higher weights for higher priorities
            k=1
        )[0]
        
        # Randomize mileage with different ranges for different train ages
        if random.random() > 0.7:  # 30% chance for high mileage trains
            mileage = random.randint(15000, 25000)
        elif random.random() > 0.4:  # 30% chance for medium mileage
            mileage = random.randint(8000, 15000)
        else:  # 40% chance for low mileage
            mileage = random.randint(2000, 8000)
        
        # Randomize last cleaned date with weighted distribution (more recent cleaning)
        days_ago = random.choices(
            range(0, 31),
            weights=[5, 4, 4, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            k=1
        )[0]
        last_cleaned = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        # Assign stabling bay (cycle through shuffled bays)
        stabling_bay = bays[(i - 1) % len(bays)]
        
        train = {
            "id": i,
            "fitness_certificate_valid": fitness_valid,
            "job_card_status": job_status,
            "branding_priority": branding_priority,
            "mileage": mileage,
            "last_cleaned_date": last_cleaned,
            "stabling_bay": stabling_bay
        }
        trains.append(train)
    
    return trains

# ------------------------
# Utility helpers
# ------------------------

def parse_date(s: str) -> date:
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except Exception:
        return datetime.today().date()


def days_since(s: str) -> int:
    return max(0, (datetime.today().date() - parse_date(s)).days)


def dist(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    return math.hypot(a[0]-b[0], a[1]-b[1])


# ------------------------
# Data loaders (mocked)
# ------------------------

def load_from_json(path: Optional[str] = None) -> Dict[str, Any]:
    """Load a JSON file exported from ops, or return default dataset if path is None."""
    if not path:
        return deepcopy(DEFAULT_INPUT)
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"{path} not found")
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def load_from_csv(path: str) -> Dict[str, Any]:
    """Simple CSV loader expecting headers matching keys in DEFAULT_INPUT train dicts."""
    out = {"trainsets": []}
    with open(path, newline='', encoding='utf-8') as csvfile:
        r = csv.DictReader(csvfile)
        for row in r:
            # cast some fields
            row2 = {}
            for k, v in row.items():
                if k in ("id", "mileage", "branding_priority"):
                    row2[k] = int(v)
                else:
                    row2[k] = v
            out["trainsets"].append(row2)
    return out


# ------------------------
# Rule engine (extensible)
# ------------------------

class ConstraintViolation(Exception):
    pass


def check_hard_constraints(train: Dict[str, Any]) -> Optional[str]:
    """Return None if ok, else string reason for maintenance assignment."""
    if not bool(train.get("fitness_certificate_valid", False)):
        return "Fitness certificate invalid"
    job_status = str(train.get("job_card_status", "")).lower()
    if job_status not in ["closed", "completed"]:
        return "Open job card"
    # Placeholder: add more hard constraints (e.g., signalling clearance timestamps)
    return None


# ------------------------
# Stabling geometry / shunting cost
# ------------------------

def compute_shunting_cost(bay: str, depot_exits: Dict[str, Tuple[float,float]], bay_coords: Dict[str, Tuple[float,float]]) -> float:
    """Compute minimal distance from bay to any exit as proxy for shunting cost."""
    if bay not in bay_coords:
        # unknown bay -> penalty
        return 999.0
    pos = bay_coords[bay]
    costs = [dist(pos, ex) for ex in depot_exits.values()]
    return min(costs)


# ------------------------
# Scoring functions (normalized)
# ------------------------

def normalize_scores(values: List[float], invert: bool = False) -> List[float]:
    if not values:
        return []
    mn, mx = min(values), max(values)
    if mx == mn:
        return [1.0 for _ in values]
    out = []
    for v in values:
        s = (v - mn) / (mx - mn)
        if invert:
            s = 1.0 - s
        out.append(max(0.0, min(1.0, s)))
    return out


# ------------------------
# Genetic algorithm optimizer
# ------------------------

def evaluate_solution(solution: List[int], eligible: List[Dict[str,Any]], cfg: Dict[str,Any]) -> Tuple[float, Dict[str,Any]]:
    """score a binary solution vector (1 -> service, 0 -> standby) for eligible trains.
    We expect exactly service_count ones; remainder up to standby_count are standby.
    Returns (fitness, diagnostics)
    """
    weights = cfg["weights"]
    # Build lists for scoring
    mileages = [t["mileage"] for t in eligible]
    branding = [t.get("branding_priority", 0) for t in eligible]
    days_clean = [days_since(t.get("last_cleaned_date", "1970-01-01")) for t in eligible]
    shunt_costs = [compute_shunting_cost(t.get("stabling_bay", ""), cfg["depot_exits"], cfg["bay_coords"]) for t in eligible]

    # normalize
    mileage_scores = normalize_scores(mileages, invert=True)  # lower mileage better
    branding_scores = normalize_scores(branding, invert=False)
    cleaning_scores = normalize_scores(days_clean, invert=True)  # recently-cleaned -> better
    shunting_scores = normalize_scores(shunt_costs, invert=True)  # less distance better

    # calculate score per train
    per_train_scores = []
    for i, t in enumerate(eligible):
        s = (
            weights["mileage"] * mileage_scores[i]
            + weights["branding"] * branding_scores[i]
            + weights["cleaning"] * cleaning_scores[i]
            + weights["shunting"] * shunting_scores[i]
        )
        per_train_scores.append(s)

    # fitness: sum of selected scores - penalty for violating counts or high shunting
    service_count = cfg["service_count"]
    standby_count = cfg["standby_count"]
    selected_indices = [i for i, bit in enumerate(solution) if bit == 1]
    selected_count = len(selected_indices)

    # penalty for wrong count
    count_penalty = abs(service_count - selected_count) * 1.0

    # total score is sum of selected train scores minus penalties
    total_score = sum(per_train_scores[i] for i in selected_indices) - count_penalty

    # add shunting penalty proportional to total shunt distance for selected units
    total_shunt = sum(shunt_costs[i] for i in selected_indices)
    shunt_penalty = max(0.0, (total_shunt - cfg.get("max_shunting_cost", 9999)) / 1000.0)

    fitness = total_score - shunt_penalty

    diagnostics = {
        "per_train_scores": per_train_scores,
        "selected_indices": selected_indices,
        "total_shunt": total_shunt,
        "count_penalty": count_penalty,
        "shunt_penalty": shunt_penalty,
    }
    return fitness, diagnostics


def run_ga_optimizer(eligible: List[Dict[str,Any]], cfg: Dict[str,Any]) -> Tuple[List[int], Dict[str,Any]]:
    ga = cfg["ga"]
    n = len(eligible)
    pop_size = max(20, ga.get("pop_size", 200))
    gens = ga.get("gens", 200)
    mut_rate = ga.get("mut_rate", 0.1)
    elite_k = max(1, int(pop_size * ga.get("elite_frac", 0.05)))

    # helper to create valid individual with exactly service_count ones
    def random_individual() -> List[int]:
        arr = [0]*n
        # pick service_count distinct indices
        picks = random.sample(range(n), min(cfg["service_count"], n))
        for p in picks:
            arr[p] = 1
        return arr

    # initialize population
    population = [random_individual() for _ in range(pop_size)]
    scored_pop = []
    for indiv in population:
        fitness, _ = evaluate_solution(indiv, eligible, cfg)
        scored_pop.append((fitness, indiv))

    for gen in range(gens):
        # sort descending
        scored_pop.sort(key=lambda x: x[0], reverse=True)
        next_pop = [deepcopy(ind) for (_, ind) in scored_pop[:elite_k]]

        # fill remainder by crossover + mutation
        while len(next_pop) < pop_size:
            # tournament selection
            a = random.choice(scored_pop)[1]
            b = random.choice(scored_pop)[1]
            # single point crossover
            cut = random.randint(1, n-1) if n>1 else 1
            child = a[:cut] + b[cut:]
            # mutate
            for i in range(n):
                if random.random() < mut_rate:
                    child[i] = 1 - child[i]
            # fix count to roughly service_count by trimming or adding
            ones = sum(child)
            target = cfg["service_count"]
            if ones > target:
                # turn off random ones
                ones_to_disable = ones - target
                ones_idx = [i for i,v in enumerate(child) if v==1]
                for j in random.sample(ones_idx, ones_to_disable):
                    child[j] = 0
            elif ones < target:
                zeros_idx = [i for i,v in enumerate(child) if v==0]
                for j in random.sample(zeros_idx, min(target-ones, len(zeros_idx))):
                    child[j] = 1
            next_pop.append(child)

        # recompute scored_pop
        scored_pop = []
        for ind in next_pop:
            f, _ = evaluate_solution(ind, eligible, cfg)
            scored_pop.append((f, ind))

        # small progress print occasionally
        if gen % max(1, gens//5) == 0:
            best_f = max(scored_pop, key=lambda x: x[0])[0]
            print(f"GA gen {gen}/{gens} best_f={best_f:.4f}")

    # final best
    scored_pop.sort(key=lambda x: x[0], reverse=True)
    best = scored_pop[0]
    best_f, best_ind = best
    fitness, diagnostics = evaluate_solution(best_ind, eligible, cfg)
    print(f"GA finished best_f={best_f:.4f}")
    return best_ind, diagnostics


# ------------------------
# Main decision pipeline
# ------------------------

def generate_induction_plan(all_trains: List[Dict[str,Any]], cfg: Dict[str,Any], what_if: Dict[str,Any] = None) -> Dict[str,Any]:
    """Return a complete plan: eligible ranked list, maintenance list with reasons,
    and assignment sets for service/standby/maintenance with explanations.
    what_if: dict to simulate events (e.g. {'fail_ids':[3,7], 'force_clean_ids':[5]})
    """
    today = datetime.today().date()
    trains = deepcopy(all_trains)

    # apply what-if modifications
    if what_if:
        for t in trains:
            if "fail_ids" in what_if and t.get("id") in what_if["fail_ids"]:
                t["fitness_certificate_valid"] = False
            if "force_clean_ids" in what_if and t.get("id") in what_if["force_clean_ids"]:
                t["last_cleaned_date"] = (today - timedelta(days=0)).isoformat()
            if "override_job_open" in what_if and t.get("id") in what_if["override_job_open"]:
                t["job_card_status"] = "open"

    maintenance = []
    eligible = []

    # hard constraints
    for t in trains:
        reason = check_hard_constraints(t)
        if reason:
            maintenance.append({**t, "reason": reason})
        else:
            eligible.append(dict(t))

    # If eligible less than service_count, we still run optimizer but will show shortage
    if not eligible:
        return {"eligible": [], "maintenance": maintenance, "assignments": {}}

    # compute baseline scores (for explainability)
    mileages = [t["mileage"] for t in eligible]
    branding = [t.get("branding_priority", 0) for t in eligible]
    days_clean = [days_since(t.get("last_cleaned_date", "1970-01-01")) for t in eligible]
    shunt_costs = [compute_shunting_cost(t.get("stabling_bay", ""), cfg["depot_exits"], cfg["bay_coords"]) for t in eligible]

    mileage_scores = normalize_scores(mileages, invert=True)
    branding_scores = normalize_scores(branding, invert=False)
    cleaning_scores = normalize_scores(days_clean, invert=True)
    shunting_scores = normalize_scores(shunt_costs, invert=True)

    for i, t in enumerate(eligible):
        t["score_components"] = {
            "mileage_score": round(mileage_scores[i], 4),
            "branding_score": round(branding_scores[i], 4),
            "cleaning_score": round(cleaning_scores[i], 4),
            "shunting_score": round(shunting_scores[i], 4),
        }
        # preliminary weighted score
        w = cfg["weights"]
        t["prelim_score"] = round(
            w["mileage"]*mileage_scores[i] + w["branding"]*branding_scores[i] + w["cleaning"]*cleaning_scores[i] + w["shunting"]*shunting_scores[i]
            , 4)

    # Run optimizer to select service_count trains
    solution, diag = run_ga_optimizer(eligible, cfg)

    # build assignments
    service_indices = diag.get("selected_indices", [])
    service = [eligible[i] for i in service_indices]
    # remaining eligible that are not service go to standby pool (top standby_count by score)
    remaining = [eligible[i] for i in range(len(eligible)) if i not in service_indices]
    remaining.sort(key=lambda x: x["prelim_score"], reverse=True)
    standby = remaining[:cfg["standby_count"]]

    # attach final_score from GA per_train_scores
    per_train_scores = diag.get("per_train_scores", [])
    for i, t in enumerate(eligible):
        t["final_score_ga"] = round(per_train_scores[i], 4)

    # conflict detection (branding shortfall etc.)
    # compute branding exposure from selected service set
    avg_branding_hours = sum(t.get("branding_priority",0) for t in service)
    branding_shortfall = False
    if avg_branding_hours < cfg.get("branding_target_hours", 0):
        branding_shortfall = True

    assignments = {
        "service": [t["id"] for t in service],
        "standby": [t["id"] for t in standby],
        "maintenance": [t["id"] for t in maintenance],
        "branding_shortfall": branding_shortfall,
        "diagnostics": diag,
    }

    result = {
        "eligible": eligible,
        "maintenance": maintenance,
        "assignments": assignments,
    }

    # audit log result
    audit_path = Path(cfg.get("audit_log"))
    entry = {
        "timestamp": datetime.now().isoformat(),
        "cfg": cfg,
        "assignments": assignments,
        "service_details": [{"id":t["id"], "bay":t.get("stabling_bay"), "final_score_ga":t.get("final_score_ga"), "prelim_score":t.get("prelim_score")} for t in service]
    }
    try:
        if audit_path.exists():
            old = json.loads(audit_path.read_text())
        else:
            old = []
        old.append(entry)
        audit_path.write_text(json.dumps(old, indent=2))
    except Exception as e:
        print(f"Warning: failed to write audit log: {e}")

    return result

# ------------------------
# New Feedback Loop Functions
# ------------------------

def log_daily_shunting_cost(cost: float, log_path: str):
    """
    Appends the total shunting cost and timestamp to a log file.
    This acts as the "separate sheet" to track daily performance.
    """
    log_path = Path(log_path)
    if log_path.exists():
        try:
            with open(log_path, "r", encoding="utf-8") as f:
                log_data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            log_data = []
    else:
        log_data = []

    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "total_shunting_cost": round(cost, 2)
    }
    log_data.append(log_entry)

    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(log_data, f, indent=2)
    print(f"Logged today's shunting cost: {round(cost, 2)} meters")

def update_weights_if_needed(cfg: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
    """
    Checks the daily shunting log. If there are 30 entries, it updates the weights
    based on the average cost and resets the log.
    """
    log_path = Path(cfg.get("daily_shunting_log"))
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            costs_log = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return cfg, 0

    day_count = len(costs_log)

    # We only update after a full 30-day cycle
    if day_count < 30:
        print(f"Day {day_count} of 30. No weight update needed yet.")
        return cfg, day_count

    # After 30 days, perform the update
    # Get the costs from the last 30 days, in case the file has more than 30 entries
    recent_costs = [entry["total_shunting_cost"] for entry in costs_log[-30:]]
    average_cost = sum(recent_costs) / len(recent_costs)
    target_cost = cfg.get("max_shunting_cost", 1500)

    print("\n--- 30-Day Performance Review ---")
    print(f"Average shunting cost over 30 days: {average_cost:.2f} meters")

    new_config = deepcopy(cfg)
    if average_cost > target_cost:
        print("Performance is below target. Increasing shunting weight to learn from this.")
        new_config["weights"]["shunting"] = round(cfg["weights"]["shunting"] * 1.5, 2)
        new_config["weights"]["branding"] = round(cfg["weights"]["branding"] * 0.95, 2)
    else:
        print("Performance is excellent. No weight change needed.")

    # Reset the log file for the next month
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump([], f)

    print("Log file reset for the new cycle.")

    return new_config, day_count

# ------------------------
# Reporting / export
# ------------------------

def print_plan(plan: Dict[str,Any], cfg: Dict[str,Any], top_n: int = 20) -> None:
    eligible = plan.get("eligible", [])
    maintenance = plan.get("maintenance", [])
    assignments = plan.get("assignments", {})

    print("\n=== Recommended Induction (service) ===\n")
    
    # Get the list of service trains with their full data
    service_trains = []
    for tid in assignments.get("service", []):
        t = next((x for x in eligible if x["id"] == tid), None)
        if t:
            service_trains.append(t)
            
    # Sort the service trains in descending order by final score
    service_trains.sort(key=lambda x: x.get("final_score_ga", 0), reverse=True)

    for i, t in enumerate(service_trains, start=1):
        print(f"{i:02d}. Train {t['id']:2d} | bay={t.get('stabling_bay')} | final_score={t.get('final_score_ga'):.4f} | prelim={t.get('prelim_score'):.4f}")
        print(f"     components={t.get('score_components')} | last_cleaned={t.get('last_cleaned_date')}")

    print("\n=== Standby ===\n")
    for tid in assignments.get("standby", []):
        t = next((x for x in eligible if x["id"]==tid), None)
        if not t: continue
        print(f" - Train {t['id']:2d} | bay={t.get('stabling_bay')} | score={t.get('final_score_ga'):.4f}")
    
    print("\n=== Maintenance ===\n")
    for m in maintenance:
        print(f" - Train {m['id']:2d} | reason={m.get('reason')} | bay={m.get('stabling_bay')}")
    
    if assignments.get("branding_shortfall"):
        print("\n! Branding exposure below target for selected service set. Consider swapping a low-branding train for a higher-branding one to meet SLAs.")


def export_plan_json(plan: Dict[str,Any], out_path: str) -> None:
    Path(out_path).write_text(json.dumps(plan, default=str, indent=2))
    print(f"Exported plan to {out_path}")


# ------------------------
# CLI / demo harness
# ------------------------

def demo_run(input_path: Optional[str] = None, what_if: Dict[str,Any] = None):
    if input_path:
        # Load from specified input file
        data = load_from_json(input_path)
        trains = data.get("trainsets", [])
    else:
        # Generate fresh randomized data for each run
        print("Generating fresh randomized train data...")
        trains = generate_randomized_trains(25)
        print(f"Generated {len(trains)} trains with randomized parameters")

    # NEW: Allow the learning step to update the config before each run
    cfg = deepcopy(CONFIG)
    updated_config, day_count = update_weights_if_needed(cfg)
    
    # Add some randomization to GA parameters for varied results
    updated_config["ga"]["pop_size"] = random.randint(150, 250)
    updated_config["ga"]["gens"] = random.randint(300, 400)
    updated_config["ga"]["mut_rate"] = round(random.uniform(0.08, 0.15), 3)
    
    # Slightly randomize weights for different optimization focus
    weight_variation = 0.1
    updated_config["weights"]["mileage"] = max(0.1, min(0.5, updated_config["weights"]["mileage"] + random.uniform(-weight_variation, weight_variation)))
    updated_config["weights"]["branding"] = max(0.1, min(0.6, updated_config["weights"]["branding"] + random.uniform(-weight_variation, weight_variation)))
    updated_config["weights"]["cleaning"] = max(0.05, min(0.2, updated_config["weights"]["cleaning"] + random.uniform(-weight_variation/2, weight_variation/2)))
    updated_config["weights"]["shunting"] = max(0.05, min(0.2, updated_config["weights"]["shunting"] + random.uniform(-weight_variation/2, weight_variation/2)))
    
    # Normalize weights to sum to 1.0
    total_weight = sum(updated_config["weights"].values())
    for key in updated_config["weights"]:
        updated_config["weights"][key] = round(updated_config["weights"][key] / total_weight, 3)

    print("\n--- Today's Run ---")
    print(f"Using weights for day {day_count + 1}:")
    print(updated_config)

    plan = generate_induction_plan(trains, updated_config, what_if=what_if)

    # NEW: Log the shunting cost from today's plan
    if "assignments" in plan and "diagnostics" in plan["assignments"]:
        shunting_cost = plan["assignments"]["diagnostics"]["total_shunt"]
        log_daily_shunting_cost(shunting_cost, updated_config["daily_shunting_log"])
    else:
        print("Warning: No diagnostics found in plan, skipping shunting cost logging")

    print_plan(plan, updated_config)
    export_plan_json(plan, "../data/tips_latest_plan.json")


# ------------------------
# If module executed directly
# ------------------------
if __name__ == "__main__":
    # parse args minimally
    args = sys.argv[1:]
    input_path = None
    what_if = None
    if args:
        # support: --input path and simple comma-separated what-if flags
        for i, a in enumerate(args):
            if a.startswith("--input="):
                input_path = a.split("=",1)[1]
            if a.startswith("--whatif="):
                # e.g. --whatif=fail:3;7,force_clean:5
                raw = a.split("=",1)[1]
                wi = {}
                for part in raw.split(','):
                    if ':' in part:
                        k, v = part.split(':',1)
                        vals = [int(x) for x in v.split(';') if x]
                        if k=='fail': wi.setdefault('fail_ids', []).extend(vals)
                        if k=='force_clean': wi.setdefault('force_clean_ids', []).extend(vals)
                what_if = wi
    print("Running TIPS demo...\n")
    demo_run(input_path=input_path, what_if=what_if)