"""
Event Detection Engine.

Processes each state update and detects derived operational events:
  - train_entered_depot: track changed from MAINLINE_* to DEPOT_*
  - train_exited_depot:  track changed from DEPOT_* to MAINLINE_*
  - train_stabled:       speed==0 AND berth unchanged for >= 120 seconds
  - train_shunted:       berth changed within depot

All detection is deterministic and based solely on state transitions.
"""

from typing import Optional, Dict, Any, List, Callable
from state_tracker import TrainState
from config import DepotGeometry, STABLED_THRESHOLD_SECONDS


class EventDetector:
    """Detects derived operational events from state transitions."""

    def __init__(self, geometry: DepotGeometry):
        self.geometry = geometry
        self._stabled_set: set = set()  # train_ids already emitted as stabled
        self._listeners: List[Callable] = []

    def add_listener(self, callback: Callable):
        """Register a callback for derived events: callback(event_type, data, ts)."""
        self._listeners.append(callback)

    def _emit(self, event_type: str, data: Dict[str, Any], ts: float):
        for cb in self._listeners:
            cb(event_type, data, ts)

    def evaluate(self, state: TrainState, current_time: float) -> List[Dict]:
        """
        Evaluate a state update and return any derived events.
        Called after each raw ATS event is processed by StateTracker.
        """
        events = []

        # --- Depot entry ---
        if (state.prev_track and state.track
                and self.geometry.is_mainline_track(state.prev_track)
                and self.geometry.is_depot_track(state.track)):
            ev = {
                "event_type": "train_entered_depot",
                "train_id": state.train_id,
                "from_track": state.prev_track,
                "to_track": state.track,
                "berth": state.berth,
            }
            events.append(ev)
            self._emit("train_entered_depot", ev, state.last_update_time)

        # --- Depot exit ---
        if (state.prev_track and state.track
                and self.geometry.is_depot_track(state.prev_track)
                and self.geometry.is_mainline_track(state.track)):
            ev = {
                "event_type": "train_exited_depot",
                "train_id": state.train_id,
                "from_track": state.prev_track,
                "to_track": state.track,
            }
            events.append(ev)
            self._emit("train_exited_depot", ev, state.last_update_time)
            # Clear stabled if it was stabled
            self._stabled_set.discard(state.train_id)

        # --- Shunting (berth change within depot) ---
        if (state.inside_depot
                and state.prev_berth and state.berth
                and state.prev_berth != state.berth):
            ev = {
                "event_type": "train_shunted",
                "train_id": state.train_id,
                "from_berth": state.prev_berth,
                "to_berth": state.berth,
                "track": state.track,
            }
            events.append(ev)
            self._emit("train_shunted", ev, state.last_update_time)
            # Shunting resets stabled status
            self._stabled_set.discard(state.train_id)

        # --- Stabled detection ---
        if (state.inside_depot
                and state.speed == 0.0
                and state.stopped_since is not None
                and (current_time - state.stopped_since) >= STABLED_THRESHOLD_SECONDS
                and state.train_id not in self._stabled_set):
            ev = {
                "event_type": "train_stabled",
                "train_id": state.train_id,
                "berth": state.berth,
                "track": state.track,
                "stabled_since": state.stopped_since,
            }
            events.append(ev)
            self._emit("train_stabled", ev, current_time)
            self._stabled_set.add(state.train_id)

        return events

    def check_stabled_periodic(self, all_states: Dict[str, TrainState], current_time: float) -> List[Dict]:
        """
        Periodic check for trains that have become stabled since last check.
        Called on a timer to catch stabled events between ATS updates.
        """
        events = []
        for tid, state in all_states.items():
            if (state.inside_depot
                    and state.speed == 0.0
                    and state.stopped_since is not None
                    and (current_time - state.stopped_since) >= STABLED_THRESHOLD_SECONDS
                    and tid not in self._stabled_set):
                ev = {
                    "event_type": "train_stabled",
                    "train_id": tid,
                    "berth": state.berth,
                    "track": state.track,
                    "stabled_since": state.stopped_since,
                }
                events.append(ev)
                self._emit("train_stabled", ev, current_time)
                self._stabled_set.add(tid)
        return events

    def reset(self):
        self._stabled_set.clear()
