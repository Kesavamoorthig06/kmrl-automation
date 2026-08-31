"""
FastAPI REST service exposing depot state.

Endpoints:
  GET  /live_state       — current depot train positions
  GET  /latest_snapshot  — last stable planning snapshot
  GET  /events/{date}    — derived events for a date
  GET  /health           — system health check
  POST /replay           — trigger a replay of a date's events
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI(
    title="DepotStateIntelligence",
    description="Real-time depot state tracking for KMRL train induction planning",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# These get injected by main.py at startup
_state_tracker = None
_snapshot_store = None
_derived_store = None
_drift_monitor = None
_stability_monitor = None


def inject_dependencies(state_tracker, snapshot_store, derived_store, drift_monitor, stability_monitor):
    global _state_tracker, _snapshot_store, _derived_store, _drift_monitor, _stability_monitor
    _state_tracker = state_tracker
    _snapshot_store = snapshot_store
    _derived_store = derived_store
    _drift_monitor = drift_monitor
    _stability_monitor = stability_monitor


@app.get("/")
def root():
    return {"service": "DepotStateIntelligence", "status": "running"}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "state_tracker": _state_tracker is not None,
        "snapshot_store": _snapshot_store is not None,
    }


@app.get("/live_state")
def live_state():
    """Current depot train positions."""
    if _state_tracker is None:
        raise HTTPException(status_code=503, detail="State tracker not initialized")
    return _state_tracker.get_live_summary()


@app.get("/latest_snapshot")
def latest_snapshot():
    """Last stable planning snapshot."""
    if _snapshot_store is None:
        raise HTTPException(status_code=503, detail="Snapshot store not initialized")
    snap = _snapshot_store.load_latest()
    if snap is None:
        raise HTTPException(status_code=404, detail="No snapshots available")
    return snap


@app.get("/snapshot/{date_str}")
def snapshot_by_date(date_str: str):
    """Get snapshot for a specific date (YYYY-MM-DD)."""
    if _snapshot_store is None:
        raise HTTPException(status_code=503, detail="Snapshot store not initialized")
    snap = _snapshot_store.load_date(date_str)
    if snap is None:
        raise HTTPException(status_code=404, detail=f"No snapshot for {date_str}")
    return snap


@app.get("/snapshots")
def list_snapshots():
    """List all available snapshot dates."""
    if _snapshot_store is None:
        raise HTTPException(status_code=503, detail="Snapshot store not initialized")
    return {"snapshots": _snapshot_store.list_snapshots()}


@app.get("/events/{date_str}")
def events_by_date(date_str: str):
    """Get derived events for a date."""
    if _derived_store is None:
        raise HTTPException(status_code=503, detail="Derived store not initialized")
    events = _derived_store.read_day(date_str)
    return {"date": date_str, "count": len(events), "events": events}


@app.get("/drift")
def drift_events():
    """Get post-snapshot drift events."""
    if _drift_monitor is None:
        raise HTTPException(status_code=503, detail="Drift monitor not initialized")
    events = _drift_monitor.get_drift_events()
    return {"active": _drift_monitor._active, "drift_count": len(events), "events": events}


@app.get("/stability")
def stability_status():
    """Check current stability status."""
    if _stability_monitor is None:
        raise HTTPException(status_code=503, detail="Stability monitor not initialized")
    import time
    now = time.time()
    return {
        "in_snapshot_window": _stability_monitor.is_in_snapshot_window(now),
        "is_stable": _stability_monitor.is_stable(now),
        "last_shunt_time": _stability_monitor._last_shunt_time,
        "snapshot_taken_today": _stability_monitor._snapshot_taken_today,
    }
