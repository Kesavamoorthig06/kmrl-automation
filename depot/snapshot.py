"""
Stability Monitor + Snapshot Generator.

Monitors the 21:30–22:30 window. When no shunting events occur for
15 continuous minutes and >= 5 trains are in depot, generates a
stable planning snapshot.

All timing is driven by event timestamps (not wall clock), making
this fully deterministic and replayable.
"""

import time
from typing import Dict, Optional
from datetime import datetime

from state_tracker import StateTracker
from event_store import SnapshotStore
from config import (
    SNAPSHOT_WINDOW_START_H, SNAPSHOT_WINDOW_START_M,
    SNAPSHOT_WINDOW_END_H, SNAPSHOT_WINDOW_END_M,
    STABILITY_QUIET_SECONDS, MINIMUM_TRAINS_FOR_SNAPSHOT,
)


class StabilityMonitor:
    """
    Tracks shunting activity and determines when the depot is stable
    enough to produce a snapshot.
    """

    def __init__(self):
        self._last_shunt_time: float = 0.0
        self._snapshot_taken_today: Optional[str] = None  # date string

    def record_shunt(self, ts: float):
        """Called whenever a train_shunted event is detected."""
        self._last_shunt_time = ts

    def is_in_snapshot_window(self, ts: float) -> bool:
        dt = datetime.fromtimestamp(ts)
        start = dt.replace(hour=SNAPSHOT_WINDOW_START_H, minute=SNAPSHOT_WINDOW_START_M, second=0)
        end = dt.replace(hour=SNAPSHOT_WINDOW_END_H, minute=SNAPSHOT_WINDOW_END_M, second=0)
        return start <= dt <= end

    def is_stable(self, current_time: float) -> bool:
        """True if no shunting for STABILITY_QUIET_SECONDS."""
        if self._last_shunt_time == 0.0:
            return True  # no shunts ever recorded
        return (current_time - self._last_shunt_time) >= STABILITY_QUIET_SECONDS

    def should_snapshot(self, current_time: float, depot_train_count: int) -> bool:
        """Check all conditions for taking a snapshot."""
        date_str = datetime.fromtimestamp(current_time).strftime("%Y-%m-%d")

        # Already took snapshot today
        if self._snapshot_taken_today == date_str:
            return False

        # Must be in window
        if not self.is_in_snapshot_window(current_time):
            return False

        # Must be stable
        if not self.is_stable(current_time):
            return False

        # Must have enough trains
        if depot_train_count < MINIMUM_TRAINS_FOR_SNAPSHOT:
            return False

        return True

    def mark_snapshot_taken(self, ts: float):
        self._snapshot_taken_today = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")

    def reset(self):
        self._last_shunt_time = 0.0
        self._snapshot_taken_today = None


class SnapshotGenerator:
    """Generates a planning snapshot from current depot state."""

    def __init__(self, snapshot_store: SnapshotStore):
        self.store = snapshot_store

    def generate(self, state_tracker: StateTracker, ts: float) -> dict:
        """
        Create a snapshot of all depot trains at the given timestamp.
        """
        depot_trains = state_tracker.get_depot_trains()

        snapshot = {
            "snapshot_time": ts,
            "snapshot_iso": datetime.fromtimestamp(ts).isoformat(),
            "train_count": len(depot_trains),
            "trains": [],
        }

        for tid in sorted(depot_trains.keys()):
            s = depot_trains[tid]
            snapshot["trains"].append({
                "train_id": s.train_id,
                "track": s.track,
                "berth": s.berth,
                "speed": s.speed,
                "stopped_since": s.stopped_since,
            })

        path = self.store.save(snapshot)
        print(f"  [SNAPSHOT] Saved {path.name} with {len(depot_trains)} trains")
        return snapshot
