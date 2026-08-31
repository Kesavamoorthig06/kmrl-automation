"""
Main orchestrator — LIVE mode.

Wires all modules together as an async streaming system:
  - LiveSimulator publishes ATS events on an accelerated clock
  - Each event flows through: StateTracker → EventDetector → Snapshot → Drift
  - FastAPI + WebSocket expose evolving state in real-time

Usage:
  python main.py                        # Live sim + API (default)
  python main.py --speed 120            # 1 real sec = 2 sim min (faster)
  python main.py --speed 600            # 1 real sec = 10 sim min (very fast)
  python main.py --tick 0.25            # faster tick rate
"""

import sys
import asyncio
import json
from datetime import datetime
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import load_geometry, API_HOST, API_PORT
from state_tracker import StateTracker
from event_detector import EventDetector
from event_store import RawEventLog, DerivedEventStore, SnapshotStore
from snapshot import StabilityMonitor, SnapshotGenerator
from drift_monitor import DriftMonitor
from simulator import LiveSimulator


# ══════════════════════════════════════════════════════════════════
#  Core engine — processes events through the detection pipeline
# ══════════════════════════════════════════════════════════════════

class LiveDepotEngine:
    """Processes each ATS event through the full pipeline."""

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

        # Wire event detector → derived store
        self.event_detector.add_listener(self._on_derived_event)
        self.drift_monitor.add_listener(self._on_derived_event)

        self.stats = {
            "raw_events": 0,
            "derived_events": 0,
            "snapshots": 0,
            "drift_events": 0,
        }

        # Recent derived events buffer for WebSocket broadcast
        self._recent_derived: list = []
        self._recent_limit = 200

    def _on_derived_event(self, event_type: str, data: dict, ts: float):
        self.derived_store.emit(event_type, data, ts)
        self.stats["derived_events"] += 1

        if event_type == "train_shunted":
            self.stability_monitor.record_shunt(ts)
        if event_type == "planning_snapshot_drift":
            self.stats["drift_events"] += 1

        # Buffer for WS
        self._recent_derived.append({"event_type": event_type, "data": data, "ts": ts})
        if len(self._recent_derived) > self._recent_limit:
            self._recent_derived = self._recent_derived[-self._recent_limit:]

    async def process_event(self, event: dict):
        """Process one ATS event through the full pipeline."""
        ts = event["timestamp"]

        # 1. Persist
        self.raw_log.append(event)
        self.stats["raw_events"] += 1

        # 2. State update
        state = self.state_tracker.process_event(event)

        # 3. Derived event detection
        derived = self.event_detector.evaluate(state, ts)

        # 4. Drift check
        self.drift_monitor.check(state, ts)

        # 5. Snapshot check
        depot_count = len(self.state_tracker.get_depot_trains())
        if self.stability_monitor.should_snapshot(ts, depot_count):
            snapshot = self.snapshot_generator.generate(self.state_tracker, ts)
            self.stability_monitor.mark_snapshot_taken(ts)
            self.drift_monitor.activate(snapshot)
            self.stats["snapshots"] += 1

        # 6. Periodic stabled check
        if self.stats["raw_events"] % 50 == 0:
            all_depot = self.state_tracker.get_depot_trains()
            self.event_detector.check_stabled_periodic(all_depot, ts)

        # 7. Broadcast to WebSocket clients
        if derived and ws_clients:
            msg = json.dumps({
                "type": "derived_events",
                "sim_time": datetime.fromtimestamp(ts).strftime("%H:%M:%S"),
                "events": derived,
            }, default=str)
            await _broadcast_ws(msg)

        return derived

    def close(self):
        self.raw_log.close()
        self.derived_store.close()


# ══════════════════════════════════════════════════════════════════
#  WebSocket client management
# ══════════════════════════════════════════════════════════════════

ws_clients: list[WebSocket] = []


async def _broadcast_ws(message: str):
    dead = []
    for ws in ws_clients:
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_clients.remove(ws)


# ══════════════════════════════════════════════════════════════════
#  FastAPI app with lifespan (starts simulator as background task)
# ══════════════════════════════════════════════════════════════════

engine: LiveDepotEngine = None
simulator: LiveSimulator = None

# Parse CLI args before FastAPI starts
_sim_speed = 60.0
_tick_interval = 0.5
for i, arg in enumerate(sys.argv):
    if arg == "--speed" and i + 1 < len(sys.argv):
        _sim_speed = float(sys.argv[i + 1])
    if arg == "--tick" and i + 1 < len(sys.argv):
        _tick_interval = float(sys.argv[i + 1])


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, simulator

    engine = LiveDepotEngine()
    simulator = LiveSimulator(
        callback=engine.process_event,
        num_trains=25,
        sim_speed=_sim_speed,
        tick_interval=_tick_interval,
        seed=42,
    )

    print("=" * 60)
    print("  DEPOT STATE INTELLIGENCE — LIVE MODE")
    print("=" * 60)
    print(f"  API: http://{API_HOST}:{API_PORT}")
    print(f"  Sim speed: 1 real sec = {_sim_speed:.0f} sim sec ({_sim_speed/60:.1f} sim min)")
    print(f"  Full day completes in ~{86400/_sim_speed:.0f} real sec")
    print(f"  Tick interval: {_tick_interval}s")
    print(f"  WebSocket: ws://localhost:{API_PORT}/ws/events")
    print("=" * 60)

    task = asyncio.create_task(simulator.start())
    yield
    simulator.stop()
    engine.close()
    task.cancel()


app = FastAPI(
    title="DepotStateIntelligence",
    description="Real-time depot state tracking — LIVE streaming mode",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════
#  REST endpoints
# ══════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    sim = simulator.get_stats() if simulator else {}
    return {
        "service": "DepotStateIntelligence",
        "mode": "LIVE",
        "sim_time": sim.get("sim_time"),
        "events_published": sim.get("events_published", 0),
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "pipeline": engine.stats if engine else {},
        "simulator": simulator.get_stats() if simulator else {},
    }


@app.get("/live_state")
async def live_state():
    """Current depot train positions — changes every call."""
    sim = simulator.get_stats() if simulator else {}
    summary = engine.state_tracker.get_live_summary() if engine else {}
    summary["sim_time"] = sim.get("sim_time")
    summary["sim_hour"] = sim.get("sim_hour")
    return summary


@app.get("/live_state/{train_id}")
async def train_state(train_id: str):
    """State of a specific train."""
    state = engine.state_tracker.get_state(train_id.upper())
    if not state:
        return JSONResponse(status_code=404, content={"error": f"Train {train_id} not found"})
    return state.to_dict()


@app.get("/depot_trains")
async def depot_trains():
    """Trains currently inside the depot."""
    depot = engine.state_tracker.get_depot_trains()
    sim = simulator.get_stats() if simulator else {}
    return {
        "sim_time": sim.get("sim_time"),
        "count": len(depot),
        "trains": {tid: s.to_dict() for tid, s in depot.items()},
    }


@app.get("/latest_snapshot")
async def latest_snapshot():
    snap = engine.snapshot_store.load_latest()
    if not snap:
        sim = simulator.get_stats() if simulator else {}
        return {
            "message": "No snapshot yet — waiting for stability window (21:30-23:30 sim time)",
            "sim_time": sim.get("sim_time"),
        }
    return snap


@app.get("/snapshots")
async def all_snapshots():
    return {"snapshots": engine.snapshot_store.list_snapshots()}


@app.get("/events/recent")
async def recent_events():
    """Last 50 derived operational events."""
    return {
        "count": len(engine._recent_derived),
        "events": engine._recent_derived[-50:],
    }


@app.get("/events/{date_str}")
async def events_by_date(date_str: str):
    events = engine.derived_store.read_day(date_str)
    return {"date": date_str, "count": len(events), "events": events}


@app.get("/drift")
async def drift_events():
    events = engine.drift_monitor.get_drift_events()
    return {
        "active": engine.drift_monitor._active,
        "drift_count": len(events),
        "events": events,
    }


@app.get("/stability")
async def stability_status():
    ts = simulator.sim_ts() if simulator else 0
    sim = simulator.get_stats() if simulator else {}
    return {
        "sim_time": sim.get("sim_time"),
        "in_snapshot_window": engine.stability_monitor.is_in_snapshot_window(ts),
        "is_stable": engine.stability_monitor.is_stable(ts),
        "snapshot_taken_today": engine.stability_monitor._snapshot_taken_today,
        "depot_train_count": len(engine.state_tracker.get_depot_trains()),
    }


@app.get("/simulator")
async def simulator_status():
    """Live simulator stats."""
    if not simulator:
        return {"status": "not started"}
    return simulator.get_stats()


@app.get("/stats")
async def full_stats():
    """Combined pipeline + simulator stats."""
    return {
        "pipeline": engine.stats if engine else {},
        "simulator": simulator.get_stats() if simulator else {},
    }


# ══════════════════════════════════════════════════════════════════
#  WebSocket — real-time event stream
# ══════════════════════════════════════════════════════════════════

@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    """
    Connect to ws://localhost:8100/ws/events for live derived events.
    Events pushed as JSON: {type, sim_time, events: [...]}
    """
    await websocket.accept()
    ws_clients.append(websocket)
    print(f"  [WS] Client connected ({len(ws_clients)} total)")
    try:
        while True:
            await websocket.receive_text()  # keep-alive
    except WebSocketDisconnect:
        ws_clients.remove(websocket)
        print(f"  [WS] Client disconnected ({len(ws_clients)} total)")


# ══════════════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=False)
