"""
Depot State client — query depot API (port 8100) for live train status.

Wraps the key depot REST endpoints and formats results for WhatsApp.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx

from config import DEPOT_BASE_URL

logger = logging.getLogger(__name__)


async def get_live_state() -> dict:
    """GET /live_state — all trains currently tracked."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{DEPOT_BASE_URL}/live_state")
    return resp.json() if resp.status_code == 200 else {"error": resp.text[:300]}


async def get_train_state(train_id: str) -> dict:
    """GET /live_state/{train_id} — single train status."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{DEPOT_BASE_URL}/live_state/{train_id}")
    if resp.status_code == 200:
        return {"success": True, **resp.json()}
    elif resp.status_code == 404:
        return {"success": False, "error": f"Train {train_id} not found in depot"}
    else:
        return {"success": False, "error": f"Depot API error ({resp.status_code})"}


async def get_depot_trains() -> dict:
    """GET /depot_trains — summary of trains in the depot."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{DEPOT_BASE_URL}/depot_trains")
    return resp.json() if resp.status_code == 200 else {"error": resp.text[:300]}


async def get_latest_snapshot() -> dict:
    """GET /latest_snapshot — most recent stabling snapshot."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{DEPOT_BASE_URL}/latest_snapshot")
    return resp.json() if resp.status_code == 200 else {"error": resp.text[:300]}


async def get_stats() -> dict:
    """GET /stats — depot statistics."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{DEPOT_BASE_URL}/stats")
    return resp.json() if resp.status_code == 200 else {"error": resp.text[:300]}


async def get_recent_events(limit: int = 10) -> dict:
    """GET /events/recent — latest derived events."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{DEPOT_BASE_URL}/events/recent", params={"limit": limit})
    return resp.json() if resp.status_code == 200 else {"error": resp.text[:300]}


# ── Formatting for WhatsApp ──────────────────────────────────────

def format_depot_summary(data: dict) -> str:
    """Format /depot_trains or /live_state into a WhatsApp-friendly summary."""
    if "error" in data:
        return f"❌ Depot API: {data['error']}"

    trains = data if isinstance(data, list) else data.get("trains", data.get("states", []))
    if not trains:
        return "📭 No trains currently tracked in the depot."

    # If it's a dict keyed by train_id
    if isinstance(trains, dict):
        items = trains.items()
    elif isinstance(trains, list) and trains and isinstance(trains[0], dict):
        items = [(t.get("train_id", "?"), t) for t in trains]
    else:
        return f"🚆 Depot: {len(trains)} trains tracked."

    lines = [f"🏗️ *Depot Live State* ({len(list(items))} trains)\n"]
    for tid, info in (trains.items() if isinstance(trains, dict) else [(t.get("train_id", "?"), t) for t in trains]):
        loc = info.get("location", info.get("track", "?"))
        status = info.get("status", info.get("state", "?"))
        lines.append(f"  🚆 *{tid}*  →  {loc}  ({status})")

    return "\n".join(lines[:30])  # Cap at 30 lines


def format_train_detail(data: dict) -> str:
    """Format single train state for WhatsApp."""
    if not data.get("success"):
        return f"❌ {data.get('error', 'Unknown error')}"

    tid = data.get("train_id", "?")
    loc = data.get("location", data.get("track", "?"))
    status = data.get("status", data.get("state", "?"))
    ts = data.get("timestamp", data.get("last_seen", ""))

    return (
        f"🚆 *Train {tid}*\n"
        f"📍 Location: {loc}\n"
        f"🔄 Status: {status}\n"
        f"🕐 Last update: {ts}"
    )


def format_snapshot(data: dict) -> str:
    """Format stabling snapshot for WhatsApp."""
    if "error" in data:
        return f"❌ {data['error']}"

    ts = data.get("timestamp", data.get("generated_at", "?"))
    berths = data.get("berths", data.get("stabling", {}))

    lines = [f"📋 *Stabling Snapshot* ({ts})\n"]
    if isinstance(berths, dict):
        for track, occupants in berths.items():
            occ_str = ", ".join(occupants) if isinstance(occupants, list) else str(occupants)
            lines.append(f"  {track}: {occ_str or '— empty —'}")
    elif isinstance(berths, list):
        for b in berths[:20]:
            lines.append(f"  {b}")

    return "\n".join(lines[:30])


def format_stats(data: dict) -> str:
    """Format /stats for WhatsApp."""
    if "error" in data:
        return f"❌ {data['error']}"

    lines = ["📊 *Depot Statistics*\n"]
    for key, val in data.items():
        lines.append(f"  • {key}: {val}")
    return "\n".join(lines[:25])
