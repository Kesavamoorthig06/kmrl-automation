"""
In-memory authoritative state tracker.

Maintains the current state of every train the system has seen.
Each incoming ATS event overwrites the previous state for that train_id.
Deterministic and replayable.
"""

import time
from typing import Dict, Optional, List
from dataclasses import dataclass, field, asdict
from config import load_geometry, DepotGeometry


@dataclass
class TrainState:
    """Current known state of a single train."""
    train_id: str
    track: str = ""
    berth: str = ""
    speed: float = 0.0
    direction: str = ""
    last_update_time: float = 0.0
    stopped_since: Optional[float] = None
    inside_depot: bool = False
    # Previous values for event detection
    prev_track: str = ""
    prev_berth: str = ""

    def to_dict(self) -> dict:
        return {
            "train_id": self.train_id,
            "track": self.track,
            "berth": self.berth,
            "speed": self.speed,
            "direction": self.direction,
            "last_update_time": self.last_update_time,
            "stopped_since": self.stopped_since,
            "inside_depot": self.inside_depot,
        }


class StateTracker:
    """
    Maintains authoritative in-memory state for all trains.
    Thread-safe single-writer model (events processed sequentially).
    """

    def __init__(self, geometry: DepotGeometry = None):
        self.geometry = geometry or load_geometry()
        self._state: Dict[str, TrainState] = {}
        self._event_count = 0

    def process_event(self, event: dict) -> TrainState:
        """
        Process a raw ATS position event and update state.
        Returns the updated TrainState (with prev_ fields set for event detection).
        """
        train_id = event["train_id"]
        ts = event["timestamp"]
        new_track = event.get("track", "")
        new_berth = event.get("berth", "")
        new_speed = float(event.get("speed", 0.0))
        new_direction = event.get("direction", "")

        # Get or create state
        if train_id not in self._state:
            self._state[train_id] = TrainState(train_id=train_id)

        state = self._state[train_id]

        # Handle out-of-order: skip if older than last update
        if ts < state.last_update_time:
            return state

        # Save previous for event detection
        state.prev_track = state.track
        state.prev_berth = state.berth

        # Update fields
        state.track = new_track
        state.berth = new_berth
        state.speed = new_speed
        state.direction = new_direction
        state.last_update_time = ts

        # Stopped tracking
        if new_speed == 0.0:
            if state.stopped_since is None:
                state.stopped_since = ts
        else:
            state.stopped_since = None

        # Depot flag
        state.inside_depot = self.geometry.is_depot_track(new_track)

        self._event_count += 1
        return state

    def get_state(self, train_id: str) -> Optional[TrainState]:
        return self._state.get(train_id)

    def get_all_states(self) -> Dict[str, TrainState]:
        return dict(self._state)

    def get_depot_trains(self) -> Dict[str, TrainState]:
        """Return only trains currently inside the depot."""
        return {tid: s for tid, s in self._state.items() if s.inside_depot}

    def get_stabled_trains(self, current_time: float, threshold: float = 120.0) -> Dict[str, TrainState]:
        """Return trains that are stopped and berth unchanged for >= threshold seconds."""
        result = {}
        for tid, s in self._state.items():
            if (s.inside_depot and s.speed == 0.0
                    and s.stopped_since is not None
                    and (current_time - s.stopped_since) >= threshold):
                result[tid] = s
        return result

    def get_live_summary(self) -> dict:
        depot = self.get_depot_trains()
        return {
            "total_tracked": len(self._state),
            "in_depot": len(depot),
            "events_processed": self._event_count,
            "trains": {tid: s.to_dict() for tid, s in depot.items()},
        }

    def reset(self):
        self._state.clear()
        self._event_count = 0
