"""
Drift Monitor.

After a planning snapshot is taken, monitors for any berth change.
If detected, emits a planning_snapshot_drift_event.
"""

from typing import Optional, Callable, List, Dict
from state_tracker import TrainState


class DriftMonitor:
    """Monitors for post-snapshot berth changes."""

    def __init__(self):
        self._snapshot_state: Optional[Dict[str, str]] = None  # train_id -> berth at snapshot time
        self._active = False
        self._listeners: List[Callable] = []
        self._drift_events: List[Dict] = []

    def add_listener(self, callback: Callable):
        self._listeners.append(callback)

    def _emit(self, event_type: str, data: dict, ts: float):
        for cb in self._listeners:
            cb(event_type, data, ts)

    def activate(self, snapshot: dict):
        """Activate drift monitoring after a snapshot is taken."""
        self._snapshot_state = {
            t["train_id"]: t["berth"] for t in snapshot.get("trains", [])
        }
        self._active = True
        self._drift_events.clear()
        print(f"  [DRIFT] Monitoring activated for {len(self._snapshot_state)} trains")

    def deactivate(self):
        self._active = False
        self._snapshot_state = None

    def check(self, state: TrainState, ts: float) -> Optional[Dict]:
        """Check if a state update constitutes drift from the snapshot."""
        if not self._active or self._snapshot_state is None:
            return None

        if state.train_id not in self._snapshot_state:
            return None

        snapshot_berth = self._snapshot_state[state.train_id]
        if state.berth != snapshot_berth:
            ev = {
                "event_type": "planning_snapshot_drift",
                "train_id": state.train_id,
                "snapshot_berth": snapshot_berth,
                "current_berth": state.berth,
                "track": state.track,
            }
            self._drift_events.append(ev)
            self._emit("planning_snapshot_drift", ev, ts)
            print(f"  [DRIFT] {state.train_id}: {snapshot_berth} -> {state.berth}")
            return ev

        return None

    def get_drift_events(self) -> List[Dict]:
        return list(self._drift_events)

    def reset(self):
        self._active = False
        self._snapshot_state = None
        self._drift_events.clear()
