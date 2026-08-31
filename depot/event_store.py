"""
Persistence layer.

Three stores:
  1. RawEventLog    — append-only immutable log of ATS position events
  2. DerivedEventStore — operational events (entered_depot, stabled, shunted)
  3. SnapshotStore  — nightly stable planning snapshots (JSON files)

All writes are synchronous file appends for simplicity.
Designed to be replayable from raw log.
"""

import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

from config import RAW_LOG_DIR, DERIVED_LOG_DIR, SNAPSHOT_DIR


class RawEventLog:
    """Append-only immutable log of raw ATS position events."""

    def __init__(self, directory: Path = RAW_LOG_DIR):
        self.directory = directory
        self.directory.mkdir(parents=True, exist_ok=True)
        self._current_date = None
        self._file = None

    def _get_file(self, ts: float):
        dt = datetime.fromtimestamp(ts)
        date_str = dt.strftime("%Y-%m-%d")
        if date_str != self._current_date:
            if self._file:
                self._file.close()
            self._current_date = date_str
            path = self.directory / f"{date_str}.jsonl"
            self._file = open(path, "a")
        return self._file

    def append(self, event: Dict[str, Any]):
        ts = event.get("timestamp", time.time())
        f = self._get_file(ts)
        f.write(json.dumps(event, default=str) + "\n")
        f.flush()

    def read_day(self, date_str: str) -> List[Dict]:
        """Read all events for a given date (for replay)."""
        path = self.directory / f"{date_str}.jsonl"
        if not path.exists():
            return []
        events = []
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line:
                    events.append(json.loads(line))
        return events

    def close(self):
        if self._file:
            self._file.close()
            self._file = None


class DerivedEventStore:
    """Store for operational derived events (depot entry, stabled, shunted, drift)."""

    def __init__(self, directory: Path = DERIVED_LOG_DIR):
        self.directory = directory
        self.directory.mkdir(parents=True, exist_ok=True)
        self._current_date = None
        self._file = None

    def _get_file(self, ts: float):
        dt = datetime.fromtimestamp(ts)
        date_str = dt.strftime("%Y-%m-%d")
        if date_str != self._current_date:
            if self._file:
                self._file.close()
            self._current_date = date_str
            path = self.directory / f"{date_str}.jsonl"
            self._file = open(path, "a")
        return self._file

    def emit(self, event_type: str, data: Dict[str, Any], ts: float = None):
        ts = ts or time.time()
        record = {
            "event_type": event_type,
            "timestamp": ts,
            "data": data,
        }
        f = self._get_file(ts)
        f.write(json.dumps(record, default=str) + "\n")
        f.flush()
        return record

    def read_day(self, date_str: str) -> List[Dict]:
        path = self.directory / f"{date_str}.jsonl"
        if not path.exists():
            return []
        events = []
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line:
                    events.append(json.loads(line))
        return events

    def close(self):
        if self._file:
            self._file.close()
            self._file = None


class SnapshotStore:
    """Object storage for nightly planning snapshots."""

    def __init__(self, directory: Path = SNAPSHOT_DIR):
        self.directory = directory
        self.directory.mkdir(parents=True, exist_ok=True)

    def save(self, snapshot: Dict[str, Any]) -> Path:
        ts = snapshot.get("snapshot_time", time.time())
        dt = datetime.fromtimestamp(ts)
        date_str = dt.strftime("%Y-%m-%d")
        path = self.directory / f"{date_str}.json"
        with open(path, "w") as f:
            json.dump(snapshot, f, indent=2, default=str)
        return path

    def load_latest(self) -> Optional[Dict]:
        files = sorted(self.directory.glob("*.json"), reverse=True)
        if not files:
            return None
        with open(files[0]) as f:
            return json.load(f)

    def load_date(self, date_str: str) -> Optional[Dict]:
        path = self.directory / f"{date_str}.json"
        if not path.exists():
            return None
        with open(path) as f:
            return json.load(f)

    def list_snapshots(self) -> List[str]:
        return sorted([f.stem for f in self.directory.glob("*.json")])
