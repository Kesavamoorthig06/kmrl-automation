"""
Main orchestrator for DepotStateIntelligence.

Wires all modules together:
  - ATS event ingestion (from simulator or replay)
  - State tracking
  - Event detection
  - Stability monitoring + snapshot generation
  - Drift detection
  - API service

Usage:
  python main.py                     # Simulate a day + start API
  python main.py --replay 2025-07-15 # Replay a specific day
  python main.py --api-only          # Start API without ingestion
  python main.py --sim-only          # Simulate without API
"""

import sys
import time
import threading
from datetime import datetime

from config import load_geometry, API_HOST, API_PORT
from state_tracker import StateTracker
from event_detector import EventDetector
from event_store import RawEventLog, DerivedEventStore, SnapshotStore
from snapshot import StabilityMonitor, SnapshotGenerator
from drift_monitor import DriftMonitor
from simulator import generate_day, save_replay, load_replay


class DepotStateEngine:
    """Core engine that processes events through the full pipeline."""

    def __init__(self):
        self.geometry = load_geometry()
        self.state_tracker = StateTracker(self.geometry)
        self.event_detector = EventDetector(self.geometry)
        self.raw_log = RawEventLog()
        self.derived_store = DerivedEventStore()
        self.snapshot_store = SnapshotStore()
        self.stability_monitor = StabilityMonitor()
        self.snapshot_generator = SnapshotGenerator(self.snapshot_store)
        self.drift_monitor = DriftMonitor()

        # Wire event detector to derived store
        self.event_detector.add_listener(self._on_derived_event)
        self.drift_monitor.add_listener(self._on_derived_event)

        self._stats = {
            "raw_events": 0,
            "derived_events": 0,
            "snapshots": 0,
            "drift_events": 0,
        }

    def _on_derived_event(self, event_type: str, data: dict, ts: float):
        """Callback for all derived events — persist them."""
        self.derived_store.emit(event_type, data, ts)
        self._stats["derived_events"] += 1

        # Track shunting for stability monitor
        if event_type == "train_shunted":
            self.stability_monitor.record_shunt(ts)

        # Track drift
        if event_type == "planning_snapshot_drift":
            self._stats["drift_events"] += 1

    def process_event(self, event: dict):
        """Process a single raw ATS event through the full pipeline."""
        ts = event["timestamp"]

        # 1. Persist raw event (immutable)
        self.raw_log.append(event)
        self._stats["raw_events"] += 1

        # 2. Update state
        state = self.state_tracker.process_event(event)

        # 3. Detect derived events
        self.event_detector.evaluate(state, ts)

        # 4. Check for drift (if snapshot was taken)
        self.drift_monitor.check(state, ts)

        # 5. Check snapshot conditions
        depot_count = len(self.state_tracker.get_depot_trains())
        if self.stability_monitor.should_snapshot(ts, depot_count):
            snapshot = self.snapshot_generator.generate(self.state_tracker, ts)
            self.stability_monitor.mark_snapshot_taken(ts)
            self.drift_monitor.activate(snapshot)
            self._stats["snapshots"] += 1

    def process_batch(self, events: list):
        """Process a batch of events (e.g., from replay)."""
        print(f"\n  Processing {len(events)} events...")
        start_time = time.time()

        for i, event in enumerate(events):
            self.process_event(event)

            # Periodic stabled check every 100 events
            if i % 100 == 0:
                ts = event["timestamp"]
                all_states = self.state_tracker.get_depot_trains()
                self.event_detector.check_stabled_periodic(all_states, ts)

            # Progress
            if i % 500 == 0 and i > 0:
                elapsed = time.time() - start_time
                rate = i / elapsed
                print(f"    {i}/{len(events)} events ({rate:.0f} evt/s)")

        elapsed = time.time() - start_time
        print(f"\n  Processed {len(events)} events in {elapsed:.1f}s "
              f"({len(events)/max(elapsed,0.001):.0f} evt/s)")
        self._print_stats()

    def _print_stats(self):
        print(f"\n  --- Pipeline Stats ---")
        print(f"    Raw events:     {self._stats['raw_events']}")
        print(f"    Derived events: {self._stats['derived_events']}")
        print(f"    Snapshots:      {self._stats['snapshots']}")
        print(f"    Drift events:   {self._stats['drift_events']}")
        depot = self.state_tracker.get_depot_trains()
        print(f"    Trains in depot: {len(depot)}")
        for tid in sorted(depot.keys()):
            s = depot[tid]
            print(f"      {tid}: {s.track}/{s.berth} speed={s.speed}")

    def close(self):
        self.raw_log.close()
        self.derived_store.close()


def run_simulation(date_str="2025-07-15", num_trains=25):
    """Generate synthetic data and process through the pipeline."""
    print("=" * 60)
    print("DEPOT STATE INTELLIGENCE — SIMULATION")
    print("=" * 60)

    engine = DepotStateEngine()

    # Generate events
    print(f"\n  Generating events for {date_str} ({num_trains} trains)...")
    events = generate_day(date_str, num_trains=num_trains, seed=42)
    save_replay(events)

    # Process
    engine.process_batch(events)

    engine.close()
    return engine


def run_replay(date_str: str):
    """Replay events from a stored log file."""
    print("=" * 60)
    print(f"DEPOT STATE INTELLIGENCE — REPLAY {date_str}")
    print("=" * 60)

    engine = DepotStateEngine()

    # Try replay file first, then raw log
    try:
        events = load_replay("replay_day.jsonl")
        print(f"  Loaded {len(events)} events from replay file")
    except FileNotFoundError:
        events = engine.raw_log.read_day(date_str)
        print(f"  Loaded {len(events)} events from raw log")

    if not events:
        print(f"  ERROR: No events found for {date_str}")
        return None

    engine.process_batch(events)
    engine.close()
    return engine


def start_api(engine: DepotStateEngine = None):
    """Start the FastAPI server."""
    import uvicorn
    from api_service import app, inject_dependencies

    if engine is None:
        engine = DepotStateEngine()

    inject_dependencies(
        state_tracker=engine.state_tracker,
        snapshot_store=engine.snapshot_store,
        derived_store=engine.derived_store,
        drift_monitor=engine.drift_monitor,
        stability_monitor=engine.stability_monitor,
    )

    print(f"\n  Starting API at http://{API_HOST}:{API_PORT}")
    print(f"  Endpoints:")
    print(f"    GET /live_state")
    print(f"    GET /latest_snapshot")
    print(f"    GET /events/2025-07-15")
    print(f"    GET /drift")
    print(f"    GET /health")
    uvicorn.run(app, host=API_HOST, port=API_PORT, log_level="info")


def main():
    if len(sys.argv) < 2:
        # Default: simulate + start API
        engine = run_simulation()
        start_api(engine)
        return

    cmd = sys.argv[1]

    if cmd == "--sim-only":
        date_str = sys.argv[2] if len(sys.argv) > 2 else "2025-07-15"
        num_trains = int(sys.argv[3]) if len(sys.argv) > 3 else 25
        run_simulation(date_str, num_trains)

    elif cmd == "--replay":
        date_str = sys.argv[2] if len(sys.argv) > 2 else "2025-07-15"
        engine = run_replay(date_str)
        if engine:
            start_api(engine)

    elif cmd == "--api-only":
        start_api()

    elif cmd == "--40-train-test":
        # Simulate a 40-train depot for scale testing
        run_simulation("2025-07-15", num_trains=40)

    else:
        print(f"Unknown command: {cmd}")
        print("Usage:")
        print("  python main.py                     # Simulate + API")
        print("  python main.py --sim-only [date] [n_trains]")
        print("  python main.py --replay [date]")
        print("  python main.py --api-only")
        print("  python main.py --40-train-test")


if __name__ == "__main__":
    main()
