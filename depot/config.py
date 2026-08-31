"""
Configuration for DepotStateIntelligence system.
All timing windows, thresholds, paths, depot geometry loading.
"""

import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, List

BASE_DIR = Path(__file__).parent
STORAGE_DIR = BASE_DIR / "storage"
RAW_LOG_DIR = STORAGE_DIR / "raw_events"
DERIVED_LOG_DIR = STORAGE_DIR / "derived_events"
SNAPSHOT_DIR = STORAGE_DIR / "snapshots"

for d in [RAW_LOG_DIR, DERIVED_LOG_DIR, SNAPSHOT_DIR]:
    d.mkdir(parents=True, exist_ok=True)


# --- Timing ---
SNAPSHOT_WINDOW_START_H = 21
SNAPSHOT_WINDOW_START_M = 30
SNAPSHOT_WINDOW_END_H = 23
SNAPSHOT_WINDOW_END_M = 30
STABILITY_QUIET_SECONDS = 15 * 60  # 15 minutes no shunting
STABLED_THRESHOLD_SECONDS = 120    # speed==0 and berth unchanged for 120s
MINIMUM_TRAINS_FOR_SNAPSHOT = 5

# --- Scaling ---
MAX_TRAINS = 100
MAX_EVENTS_PER_SECOND = 2000

# --- Simulation (live mode) ---
SIM_SPEED = 60.0          # 1 real second = 60 sim seconds (full day in ~24 min)
TICK_INTERVAL = 0.5       # seconds between simulator ticks

# --- API ---
API_HOST = "0.0.0.0"
API_PORT = 8100


@dataclass
class DepotGeometry:
    """Loaded from depot_geometry.json — describes physical depot layout."""
    depot_name: str = ""
    tracks: Dict = field(default_factory=dict)
    depot_prefixes: List[str] = field(default_factory=list)
    mainline_prefixes: List[str] = field(default_factory=list)
    total_capacity: int = 30

    def is_depot_track(self, track: str) -> bool:
        return any(track.startswith(p) for p in self.depot_prefixes)

    def is_mainline_track(self, track: str) -> bool:
        return any(track.startswith(p) for p in self.mainline_prefixes)

    def get_track_type(self, track: str) -> str:
        info = self.tracks.get(track)
        return info["type"] if info else "unknown"

    def get_all_berths(self) -> List[str]:
        berths = []
        for info in self.tracks.values():
            berths.extend(info.get("berths", []))
        return berths


def load_geometry(path: Path = None) -> DepotGeometry:
    path = path or (BASE_DIR / "depot_geometry.json")
    with open(path) as f:
        data = json.load(f)
    return DepotGeometry(
        depot_name=data.get("depot_name", ""),
        tracks=data.get("tracks", {}),
        depot_prefixes=data.get("depot_track_prefixes", []),
        mainline_prefixes=data.get("mainline_track_prefixes", []),
        total_capacity=data.get("total_berth_capacity", 30),
    )
