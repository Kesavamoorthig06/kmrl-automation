"""
ATS Simulator.

Generates a realistic full day of train movement events for 25-40 trainsets.
Simulates:
  - Morning deployment from depot to mainline (05:00-06:30)
  - Daytime service (06:30-21:00) with occasional returns
  - Evening return to depot (21:00-22:00)
  - Stabling + minor shunting (22:00-23:00)
  - Quiet night (23:00-05:00)

Output: list of ATS events sorted by timestamp, or a .jsonl replay file.
"""

import json
import random
import math
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict

from config import load_geometry, STORAGE_DIR


def generate_day(date_str: str = "2025-07-15", num_trains: int = 25, seed: int = 42) -> List[Dict]:
    """
    Generate a full day of ATS events for the given date.
    Returns events sorted by timestamp.
    """
    random.seed(seed)
    geo = load_geometry()

    # Build available berths from geometry
    stabling_tracks = [t for t, info in geo.tracks.items() if info.get("type") == "stabling"]
    ibl_tracks = [t for t, info in geo.tracks.items() if info.get("type") == "ibl"]
    all_depot_berths = []
    for track in stabling_tracks:
        for b in geo.tracks[track].get("berths", []):
            all_depot_berths.append((track, b))
    ibl_berths = []
    for track in ibl_tracks:
        for b in geo.tracks[track].get("berths", []):
            ibl_berths.append((track, b))

    train_ids = [f"TS-{str(i).zfill(3)}" for i in range(1, num_trains + 1)]
    base_dt = datetime.strptime(date_str, "%Y-%m-%d")
    events = []

    def ts(dt: datetime) -> float:
        return dt.timestamp()

    def emit(train_id, dt, track, berth, speed, direction=""):
        events.append({
            "train_id": train_id,
            "timestamp": ts(dt),
            "track": track,
            "berth": berth,
            "speed": speed,
            "direction": direction,
        })

    # --- Phase 0: All trains start stabled at depot (00:00) ---
    random.shuffle(all_depot_berths)
    initial_positions = {}
    for i, tid in enumerate(train_ids):
        if i < len(all_depot_berths):
            track, berth = all_depot_berths[i]
        else:
            # Overflow to IBL
            idx = i - len(all_depot_berths)
            track, berth = ibl_berths[idx % len(ibl_berths)]

        initial_positions[tid] = (track, berth)
        emit(tid, base_dt.replace(hour=0, minute=0), track, berth, 0.0)

    # --- Phase 1: Morning deployment (05:00 - 06:30) ---
    # 18 trains go to mainline for service
    service_trains = train_ids[:18]
    standby_trains = train_ids[18:21]
    ibl_trains_list = train_ids[21:]

    for i, tid in enumerate(service_trains):
        depart_time = base_dt.replace(hour=5, minute=0) + timedelta(minutes=random.randint(0, 90))
        track, berth = initial_positions[tid]

        # Wake up: speed increases
        emit(tid, depart_time, track, berth, 0.0)
        emit(tid, depart_time + timedelta(seconds=30), track, berth, 5.0, "OUT")

        # Move through yard
        emit(tid, depart_time + timedelta(seconds=60), "DEPOT_YARD", "DY-TRANSIT", 10.0, "OUT")
        emit(tid, depart_time + timedelta(seconds=90), "DEPOT_ENTRY", "DE-A", 15.0, "OUT")

        # Exit to mainline
        direction = random.choice(["UP", "DN"])
        mainline = f"MAINLINE_{direction}"
        berth_name = f"ML-{direction}-{random.randint(1,20):02d}"
        emit(tid, depart_time + timedelta(seconds=120), mainline, berth_name, 40.0, direction)

    # --- Phase 2: Daytime service (06:30 - 21:00) ---
    # Emit periodic mainline position updates for service trains
    for tid in service_trains:
        current_time = base_dt.replace(hour=6, minute=30)
        end_time = base_dt.replace(hour=21, minute=0)

        while current_time < end_time:
            interval = timedelta(minutes=random.randint(8, 25))
            current_time += interval
            if current_time >= end_time:
                break

            direction = random.choice(["UP", "DN"])
            mainline = f"MAINLINE_{direction}"
            berth_name = f"ML-{direction}-{random.randint(1,40):02d}"
            speed = random.uniform(20.0, 80.0)
            emit(tid, current_time, mainline, berth_name, speed, direction)

    # --- Phase 2b: IBL trains get minor shunts during the day ---
    for tid in ibl_trains_list:
        # 0-2 shunt events during the day (moved for maintenance)
        num_shunts = random.randint(0, 2)
        for _ in range(num_shunts):
            shunt_time = base_dt.replace(hour=random.randint(8, 17), minute=random.randint(0, 59))
            src_track, src_berth = initial_positions[tid]
            # Move to IBL or wash
            dest_choices = ibl_berths + [("WASH_LINE", "WL-A"), ("CLEAN_BAY_01", "CB01-A")]
            dest_track, dest_berth = random.choice(dest_choices)
            emit(tid, shunt_time, src_track, src_berth, 5.0, "SHUNT")
            emit(tid, shunt_time + timedelta(seconds=60), "DEPOT_YARD", "DY-TRANSIT", 8.0, "SHUNT")
            emit(tid, shunt_time + timedelta(seconds=120), dest_track, dest_berth, 2.0, "SHUNT")
            emit(tid, shunt_time + timedelta(seconds=150), dest_track, dest_berth, 0.0)
            initial_positions[tid] = (dest_track, dest_berth)

    # --- Phase 3: Evening return (21:00 - 22:00) ---
    random.shuffle(all_depot_berths)
    return_positions = {}
    for i, tid in enumerate(service_trains + standby_trains):
        return_time = base_dt.replace(hour=21, minute=0) + timedelta(minutes=random.randint(0, 55))

        # Last mainline position
        direction = random.choice(["UP", "DN"])
        mainline = f"MAINLINE_{direction}"
        emit(tid, return_time, mainline, f"ML-{direction}-01", 30.0, direction)

        # Enter depot
        emit(tid, return_time + timedelta(seconds=60), "DEPOT_ENTRY", "DE-A", 10.0, "IN")
        emit(tid, return_time + timedelta(seconds=90), "DEPOT_YARD", "DY-TRANSIT", 8.0, "IN")

        # Stable at assigned berth
        if i < len(all_depot_berths):
            track, berth = all_depot_berths[i]
        else:
            track, berth = ibl_berths[0]
        emit(tid, return_time + timedelta(seconds=150), track, berth, 2.0, "IN")
        emit(tid, return_time + timedelta(seconds=180), track, berth, 0.0)
        return_positions[tid] = (track, berth)

    # --- Phase 4: Post-stabling shunting (22:00 - 22:30) ---
    # A few trains get rearranged
    shunt_candidates = random.sample(service_trains, min(4, len(service_trains)))
    for tid in shunt_candidates:
        shunt_time = base_dt.replace(hour=22, minute=random.randint(0, 15))
        if tid in return_positions:
            src_track, src_berth = return_positions[tid]
        else:
            continue

        # Pick a new berth
        new_idx = random.randint(0, len(all_depot_berths) - 1)
        dest_track, dest_berth = all_depot_berths[new_idx]

        emit(tid, shunt_time, src_track, src_berth, 3.0, "SHUNT")
        emit(tid, shunt_time + timedelta(seconds=45), "DEPOT_YARD", "DY-TRANSIT", 5.0, "SHUNT")
        emit(tid, shunt_time + timedelta(seconds=90), dest_track, dest_berth, 2.0, "SHUNT")
        emit(tid, shunt_time + timedelta(seconds=120), dest_track, dest_berth, 0.0)
        return_positions[tid] = (dest_track, dest_berth)

    # --- Phase 5: Quiet night (22:30 - 05:00 next day) ---
    # Heartbeat pings from stabled trains — extra around 22:30 for snapshot window
    for tid in train_ids:
        if tid in return_positions:
            track, berth = return_positions[tid]
        elif tid in initial_positions:
            track, berth = initial_positions[tid]
        else:
            continue

        # Early heartbeat at 22:30-22:40 so snapshot can trigger
        early_ping = base_dt.replace(hour=22, minute=30 + random.randint(0, 10))
        emit(tid, early_ping, track, berth, 0.0)

        for hour in [23, 0, 1, 2, 3, 4]:
            ping_time = base_dt.replace(hour=hour, minute=random.randint(0, 59))
            if hour < 5:
                ping_time += timedelta(days=1) if hour < 5 else timedelta()
            emit(tid, ping_time, track, berth, 0.0)

    # --- Phase 6: Inject one drift event (post-snapshot) ---
    # One unscheduled shunt AFTER snapshot should have been taken
    drift_train = random.choice(service_trains)
    drift_time = base_dt.replace(hour=23, minute=30)
    if drift_train in return_positions:
        src_track, src_berth = return_positions[drift_train]
        dest_track, dest_berth = random.choice(all_depot_berths[:5])
        emit(drift_train, drift_time, src_track, src_berth, 3.0, "SHUNT")
        emit(drift_train, drift_time + timedelta(seconds=60), dest_track, dest_berth, 2.0, "SHUNT")
        emit(drift_train, drift_time + timedelta(seconds=90), dest_track, dest_berth, 0.0)

    # Sort all events by timestamp
    events.sort(key=lambda e: (e["timestamp"], e["train_id"]))

    print(f"  [SIM] Generated {len(events)} events for {date_str} "
          f"with {num_trains} trains")
    return events


def save_replay(events: List[Dict], filename: str = "replay_day.jsonl"):
    """Save events to a JSONL file for deterministic replay."""
    path = STORAGE_DIR / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        for ev in events:
            f.write(json.dumps(ev) + "\n")
    print(f"  [SIM] Saved replay to {path} ({len(events)} events)")
    return path


def load_replay(filename: str = "replay_day.jsonl") -> List[Dict]:
    """Load events from a JSONL replay file."""
    path = STORAGE_DIR / filename
    events = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                events.append(json.loads(line))
    return events


if __name__ == "__main__":
    events = generate_day("2025-07-15", num_trains=25, seed=42)
    save_replay(events)
    print(f"\n  Total events: {len(events)}")
    print(f"  Time span: {datetime.fromtimestamp(events[0]['timestamp'])} "
          f"-> {datetime.fromtimestamp(events[-1]['timestamp'])}")

    # Quick stats
    trains = set(e["train_id"] for e in events)
    print(f"  Unique trains: {len(trains)}")
    depot_entries = sum(1 for e in events if "DEPOT_ENTRY" in e.get("track", ""))
    print(f"  Depot entry events: {depot_entries}")
