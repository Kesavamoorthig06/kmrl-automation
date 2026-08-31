"""
Deterministic Schedule-Based Live ATS Simulator.

Instead of probability rolls every tick, this builds a pre-computed schedule
of events at exact sim-minutes and fires them when the sim clock reaches
each timestamp.  Every run with the same seed produces identical output.

  Phase               Sim Time        Fixed Interval
  ──────────────────  ──────────────  ──────────────────────────────
  Night heartbeat     00:00 – 05:00   30 sim-min per heartbeat batch
  Morning departure   05:00 – 07:10   7 sim-min between departures
  Daytime mainline    07:00 – 21:00   3 sim-min between position updates
  Evening return      21:00 – 22:00   3 sim-min between returns
  Post-stabling       22:00 – 22:30   10 sim-min between shunts
  Quiet heartbeat     22:30 – 23:30   5 sim-min between heartbeat batches
  Drift injection     23:35           single event

Clock speed is configurable: default 1 real second = 60 sim seconds,
so a full 24 h cycle completes in ~24 real minutes.
"""

import asyncio
import random
import time
from collections import deque
from datetime import datetime, timedelta
from typing import Callable, Awaitable, List, Dict, Tuple

from config import load_geometry


class LiveSimulator:
    """Deterministic schedule-driven live ATS event publisher."""

    # ── Fixed intervals (sim-minutes) ────────────────────────────
    DEPARTURE_SPACING   = 7    # one train leaves every 7 sim-min
    MAINLINE_UPDATE     = 3    # position updates every 3 sim-min
    RETURN_SPACING      = 3    # one train returns every 3 sim-min
    NIGHT_SHUNT         = 10   # post-stabling shunt spacing
    HEARTBEAT_SPACING   = 5    # quiet-period heartbeat batch
    NIGHT_HB_SPACING    = 30   # night heartbeat spacing

    def __init__(
        self,
        callback: Callable[[dict], Awaitable[None]],
        num_trains: int = 25,
        sim_speed: float = 60.0,
        tick_interval: float = 0.5,
        seed: int = 42,
    ):
        self.callback = callback
        self.num_trains = num_trains
        self.sim_speed = sim_speed
        self.tick_interval = tick_interval
        self.seed = seed

        self.running = False
        self.event_count = 0

        # Sim clock anchors
        self._real_start: float = 0.0
        self._sim_start: datetime = datetime.now().replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        # Depot geometry
        self.geo = load_geometry()
        self._stabling_berths: List[Tuple[str, str]] = []
        self._ibl_berths: List[Tuple[str, str]] = []
        for t, info in self.geo.tracks.items():
            if info.get("type") == "stabling":
                for b in info.get("berths", []):
                    self._stabling_berths.append((t, b))
            elif info.get("type") == "ibl":
                for b in info.get("berths", []):
                    self._ibl_berths.append((t, b))

        # Train state used by the simulator (NOT the pipeline state tracker)
        self.train_ids = [f"TS-{i:03d}" for i in range(1, num_trains + 1)]
        self._trains: Dict[str, dict] = {}
        self._departed: set = set()
        self._returned: set = set()
        self._shunted_post: set = set()
        self._drift_injected = False

        # Pre-computed schedule (populated in start())
        self._schedule: deque = deque()  # deque of (sim_datetime, coroutine_factory)

    # ── sim clock ─────────────────────────────────────────────────

    def sim_now(self) -> datetime:
        elapsed_real = time.time() - self._real_start
        elapsed_sim = timedelta(seconds=elapsed_real * self.sim_speed)
        return self._sim_start + elapsed_sim

    def sim_ts(self) -> float:
        return self.sim_now().timestamp()

    def _ts_at(self, dt: datetime) -> float:
        """Timestamp for a given sim datetime (used during schedule build)."""
        return dt.timestamp()

    # ── schedule builder ──────────────────────────────────────────

    def _build_schedule(self):
        """Build a deterministic deque of (sim_datetime, action_name, args)."""
        base = self._sim_start  # midnight of sim day
        schedule: list = []

        def at(h, m, s=0):
            return base + timedelta(hours=h, minutes=m, seconds=s)

        # 1. Night heartbeats: 00:00 – 04:30, every NIGHT_HB_SPACING min
        t = at(0, 30)
        while t < at(5, 0):
            schedule.append((t, "night_heartbeat", {}))
            t += timedelta(minutes=self.NIGHT_HB_SPACING)

        # 2. Morning departures: 05:00 onwards, 18 trains, every DEPARTURE_SPACING min
        service = list(self.train_ids[:18])
        random.shuffle(service)
        t = at(5, 0)
        for tid in service:
            schedule.append((t, "depart", {"train_id": tid}))
            t += timedelta(minutes=self.DEPARTURE_SPACING)

        # 3. Daytime mainline updates: 07:00 – 21:00, every MAINLINE_UPDATE min
        t = at(7, 0)
        while t < at(21, 0):
            schedule.append((t, "mainline_update", {}))
            t += timedelta(minutes=self.MAINLINE_UPDATE)

        # 4. Evening return: all departed trains come back every RETURN_SPACING min
        t = at(21, 0)
        for tid in service:  # same order they departed
            schedule.append((t, "return_train", {"train_id": tid}))
            t += timedelta(minutes=self.RETURN_SPACING)

        # 5. Post-stabling shunts: 22:00 – 22:30, every NIGHT_SHUNT min
        t = at(22, 0)
        shunt_tids = list(service[:4])  # first 4 returned trains
        for tid in shunt_tids:
            schedule.append((t, "post_shunt", {"train_id": tid}))
            t += timedelta(minutes=self.NIGHT_SHUNT)

        # 6. Quiet heartbeat batches: 22:30 – 23:30, every HEARTBEAT_SPACING min
        t = at(22, 30)
        while t < at(23, 30):
            schedule.append((t, "quiet_heartbeat", {}))
            t += timedelta(minutes=self.HEARTBEAT_SPACING)

        # 7. Drift injection at 23:35
        schedule.append((at(23, 35), "drift_inject", {}))

        # 8. Final heartbeat at 23:50
        schedule.append((at(23, 50), "night_heartbeat", {}))

        schedule.sort(key=lambda x: x[0])
        self._schedule = deque(schedule)

        print(f"  [SIM-SCHED] Built schedule: {len(schedule)} events")
        # Print summary table
        phases = {}
        for dt, action, _ in schedule:
            phase = action
            phases.setdefault(phase, [0, None, None])
            phases[phase][0] += 1
            if phases[phase][1] is None or dt < phases[phase][1]:
                phases[phase][1] = dt
            if phases[phase][2] is None or dt > phases[phase][2]:
                phases[phase][2] = dt
        for action, (cnt, first, last) in sorted(phases.items(), key=lambda x: x[1][1]):
            print(f"  [SIM-SCHED]   {action:20s} ×{cnt:3d}  "
                  f"{first.strftime('%H:%M')}–{last.strftime('%H:%M')}")

    # ── lifecycle ─────────────────────────────────────────────────

    async def start(self):
        random.seed(self.seed)
        self._real_start = time.time()
        self.running = True

        # Initialise: all trains stabled in depot
        berths = list(self._stabling_berths)
        random.shuffle(berths)
        for i, tid in enumerate(self.train_ids):
            if i < len(berths):
                track, berth = berths[i]
            else:
                idx = i - len(berths)
                track, berth = self._ibl_berths[idx % len(self._ibl_berths)]
            self._trains[tid] = {"track": track, "berth": berth, "speed": 0.0, "dir": ""}

        # Emit initial stabled positions
        for tid, s in self._trains.items():
            await self._emit(tid, s["track"], s["berth"], 0.0, "")

        # Build the deterministic schedule
        self._build_schedule()

        print(f"  [SIM-LIVE] Started — {self.num_trains} trains, DETERMINISTIC mode")
        print(f"  [SIM-LIVE] 1 real sec = {self.sim_speed:.0f} sim sec "
              f"({self.sim_speed/60:.1f} sim min)")
        print(f"  [SIM-LIVE] Full day in ~{86400/self.sim_speed:.0f} real sec")

        while self.running:
            await self._tick()
            await asyncio.sleep(self.tick_interval)

    def stop(self):
        self.running = False
        print(f"  [SIM-LIVE] Stopped after {self.event_count} events")

    # ── emit helper ───────────────────────────────────────────────

    async def _emit(self, train_id: str, track: str, berth: str,
                    speed: float, direction: str):
        event = {
            "train_id": train_id,
            "timestamp": self.sim_ts(),
            "track": track,
            "berth": berth,
            "speed": speed,
            "direction": direction,
        }
        self.event_count += 1
        await self.callback(event)

    # ── main tick — drain due schedule entries ────────────────────

    async def _tick(self):
        now = self.sim_now()
        while self._schedule and self._schedule[0][0] <= now:
            sched_time, action, args = self._schedule.popleft()
            await self._dispatch(action, args)

    async def _dispatch(self, action: str, args: dict):
        handler = {
            "night_heartbeat": self._act_night_heartbeat,
            "depart":          self._act_depart,
            "mainline_update": self._act_mainline_update,
            "return_train":    self._act_return_train,
            "post_shunt":      self._act_post_shunt,
            "quiet_heartbeat": self._act_quiet_heartbeat,
            "drift_inject":    self._act_drift_inject,
        }.get(action)
        if handler:
            await handler(**args)

    # ── deterministic actions ─────────────────────────────────────

    async def _act_night_heartbeat(self):
        """Emit heartbeat for 3 random depot trains."""
        depot_trains = [tid for tid in self.train_ids
                        if self.geo.is_depot_track(self._trains.get(tid, {}).get("track", ""))]
        for tid in random.sample(depot_trains, min(3, len(depot_trains))):
            s = self._trains[tid]
            await self._emit(tid, s["track"], s["berth"], 0.0, "")

    async def _act_depart(self, train_id: str):
        """One train departs to mainline — fixed sequence of 4 events."""
        if train_id in self._departed:
            return
        s = self._trains[train_id]
        # 1. Start moving from stabling
        await self._emit(train_id, s["track"], s["berth"], 5.0, "OUT")
        # 2. Transit through depot yard
        await self._emit(train_id, "DEPOT_YARD", "DY-TRANSIT", 10.0, "OUT")
        # 3. Exit gate
        await self._emit(train_id, "DEPOT_ENTRY", "DE-A", 15.0, "OUT")
        # 4. Onto mainline
        d = random.choice(["UP", "DN"])
        ml = f"MAINLINE_{d}"
        b = f"ML-{d}-{random.randint(1,20):02d}"
        await self._emit(train_id, ml, b, 40.0, d)
        self._trains[train_id] = {"track": ml, "berth": b, "speed": 40.0, "dir": d}
        self._departed.add(train_id)
        print(f"  [SIM-SCHED] Departed: {train_id} → {ml}/{b}")

    async def _act_mainline_update(self):
        """Update position of one departed train on mainline."""
        candidates = list(self._departed - self._returned)
        if not candidates:
            return
        tid = random.choice(candidates)
        d = random.choice(["UP", "DN"])
        ml = f"MAINLINE_{d}"
        b = f"ML-{d}-{random.randint(1,40):02d}"
        speed = random.uniform(15.0, 80.0)
        await self._emit(tid, ml, b, speed, d)
        self._trains[tid] = {"track": ml, "berth": b, "speed": speed, "dir": d}

    async def _act_return_train(self, train_id: str):
        """One train returns from mainline to a stabling berth — 5 events."""
        if train_id not in self._departed or train_id in self._returned:
            return
        # Pick a free stabling berth
        occupied = {(s["track"], s["berth"]) for s in self._trains.values()
                    if self.geo.is_depot_track(s.get("track", ""))}
        free = [b for b in self._stabling_berths if b not in occupied]
        if not free:
            free = self._stabling_berths  # fallback
        track, berth = random.choice(free)

        d = random.choice(["UP", "DN"])
        # 1. Approaching depot from mainline
        await self._emit(train_id, f"MAINLINE_{d}", f"ML-{d}-01", 30.0, d)
        # 2. Enter depot gate
        await self._emit(train_id, "DEPOT_ENTRY", "DE-A", 10.0, "IN")
        # 3. Transit yard
        await self._emit(train_id, "DEPOT_YARD", "DY-TRANSIT", 8.0, "IN")
        # 4. Arriving at stabling (still moving)
        await self._emit(train_id, track, berth, 2.0, "IN")
        # 5. Stopped
        await self._emit(train_id, track, berth, 0.0, "")
        self._trains[train_id] = {"track": track, "berth": berth, "speed": 0.0, "dir": ""}
        self._returned.add(train_id)
        self._departed.discard(train_id)
        print(f"  [SIM-SCHED] Returned: {train_id} → {track}/{berth}")

    async def _act_post_shunt(self, train_id: str):
        """Minor shunting rearrangement — 4 events."""
        if train_id in self._shunted_post:
            return
        s = self._trains.get(train_id)
        if not s:
            return
        dest = random.choice(self._stabling_berths[:8])
        await self._emit(train_id, s["track"], s["berth"], 3.0, "SHUNT")
        await self._emit(train_id, "DEPOT_YARD", "DY-TRANSIT", 5.0, "SHUNT")
        await self._emit(train_id, dest[0], dest[1], 2.0, "SHUNT")
        await self._emit(train_id, dest[0], dest[1], 0.0, "")
        self._trains[train_id] = {"track": dest[0], "berth": dest[1], "speed": 0.0, "dir": ""}
        self._shunted_post.add(train_id)
        print(f"  [SIM-SCHED] Shunted: {train_id} → {dest[0]}/{dest[1]}")

    async def _act_quiet_heartbeat(self):
        """Heartbeat batch for snapshot triggering — all depot trains."""
        for tid in self.train_ids:
            s = self._trains.get(tid)
            if s and s["speed"] == 0.0 and self.geo.is_depot_track(s["track"]):
                await self._emit(tid, s["track"], s["berth"], 0.0, "")

    async def _act_drift_inject(self):
        """Move one train after snapshot window to trigger drift detection."""
        if self._drift_injected:
            return
        drift_tid = self.train_ids[0]  # deterministic pick
        s = self._trains[drift_tid]
        dest = self._stabling_berths[0]
        if (s["track"], s["berth"]) == dest:
            dest = self._stabling_berths[1]
        await self._emit(drift_tid, s["track"], s["berth"], 3.0, "SHUNT")
        await self._emit(drift_tid, dest[0], dest[1], 0.0, "")
        self._trains[drift_tid] = {"track": dest[0], "berth": dest[1], "speed": 0.0, "dir": ""}
        self._drift_injected = True
        print(f"  [SIM-SCHED] Drift injected: {drift_tid} → {dest[0]}/{dest[1]}")

    # ── stats ─────────────────────────────────────────────────────

    def get_stats(self) -> dict:
        now = self.sim_now()
        in_depot = sum(1 for s in self._trains.values()
                       if self.geo.is_depot_track(s["track"]))
        on_mainline = sum(1 for s in self._trains.values()
                          if self.geo.is_mainline_track(s["track"]))
        return {
            "running": self.running,
            "sim_time": now.strftime("%Y-%m-%d %H:%M:%S"),
            "sim_hour": now.hour,
            "events_published": self.event_count,
            "trains_in_depot": in_depot,
            "trains_on_mainline": on_mainline,
            "departed_today": len(self._departed),
            "returned_today": len(self._returned),
            "schedule_remaining": len(self._schedule),
            "mode": "deterministic",
        }
