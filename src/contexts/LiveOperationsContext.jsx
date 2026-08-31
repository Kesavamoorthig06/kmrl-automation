/**
 * LiveOperationsContext — Real-time train operations management.
 *
 * Tracks live statuses: IN_SERVICE | FAULTED | STANDBY | SWAPPED_IN | HALTED
 * Polls /liveops/fault-scan every 60s to detect real data-driven faults.
 * When a train faults → automatically picks the best standby and swaps it in.
 * When all trains are shunting → system enters HALTED mode.
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

// ── Status constants ─────────────────────────────────────────────
export const LIVE_STATUS = {
  IN_SERVICE: "IN_SERVICE",
  FAULTED: "FAULTED",
  STANDBY: "STANDBY",
  SWAPPED_IN: "SWAPPED_IN",
  HALTED: "HALTED",
};

// Fault scan polling interval (ms) — long interval for data-driven detection
const FAULT_SCAN_INTERVAL_MS = 60_000;

const LiveOperationsContext = createContext(null);

export function useLiveOperations() {
  const ctx = useContext(LiveOperationsContext);
  if (!ctx) throw new Error("useLiveOperations must be inside LiveOperationsProvider");
  return ctx;
}

export function LiveOperationsProvider({ children, allTrains = [], scheduledTrainIds = new Set() }) {
  // trainId → { status, faultReason?, swappedFor?, swappedAt?, faultedAt? }
  const [liveStatuses, setLiveStatuses] = useState({});
  // Ordered event log (newest first)
  const [events, setEvents] = useState([]);
  // System-wide flag
  const [systemHalted, setSystemHalted] = useState(false);
  // Fault scan state
  const scanTimer = useRef(null);
  const [scanRunning, setScanRunning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);
  // Track which faults we've already processed (avoid re-reporting same train)
  const reportedFaults = useRef(new Set());

  // ── Initialise statuses when trains/schedule change ────────────
  useEffect(() => {
    if (allTrains.length === 0) return;
    setLiveStatuses((prev) => {
      const next = {};
      allTrains.forEach((t) => {
        const existing = prev[t.id];
        // If train was manually faulted/swapped/halted, preserve that state
        if (
          existing &&
          existing.status !== LIVE_STATUS.IN_SERVICE &&
          existing.status !== LIVE_STATUS.STANDBY
        ) {
          next[t.id] = existing;
        } else if (scheduledTrainIds.has(t.id) && t.status === "Available") {
          next[t.id] = { status: LIVE_STATUS.IN_SERVICE };
        } else if (t.status === "Available") {
          next[t.id] = { status: LIVE_STATUS.STANDBY };
        }
        // Unavailable trains are not tracked
      });
      return next;
    });
  }, [allTrains, scheduledTrainIds]);

  // ── Helpers ────────────────────────────────────────────────────
  const pushEvent = useCallback((evt) => {
    setEvents((prev) => [{ ...evt, ts: new Date() }, ...prev].slice(0, 50));
  }, []);

  const getStandbyTrains = useCallback(() => {
    return allTrains.filter(
      (t) => liveStatuses[t.id]?.status === LIVE_STATUS.STANDBY && t.status === "Available"
    );
  }, [allTrains, liveStatuses]);

  const getInServiceTrains = useCallback(() => {
    return allTrains.filter(
      (t) =>
        liveStatuses[t.id]?.status === LIVE_STATUS.IN_SERVICE ||
        liveStatuses[t.id]?.status === LIVE_STATUS.SWAPPED_IN
    );
  }, [allTrains, liveStatuses]);

  const getFaultedTrains = useCallback(() => {
    return allTrains.filter((t) => liveStatuses[t.id]?.status === LIVE_STATUS.FAULTED);
  }, [allTrains, liveStatuses]);

  // ── Report a fault & auto-swap ─────────────────────────────────
  const reportFault = useCallback(
    (trainId, reason, suggestedReplacement) => {
      const faultReason = reason || "Data-driven fault detected";

      setLiveStatuses((prev) => {
        const next = { ...prev };
        // Mark faulted
        next[trainId] = { status: LIVE_STATUS.FAULTED, faultReason, faultedAt: new Date() };

        // Use suggested replacement if provided, otherwise find best standby
        let replacement = null;
        if (suggestedReplacement) {
          const sugTrain = allTrains.find((t) => t.id === suggestedReplacement);
          if (sugTrain && next[sugTrain.id]?.status === LIVE_STATUS.STANDBY) {
            replacement = sugTrain;
          }
        }
        if (!replacement) {
          const standbyPool = allTrains
            .filter((t) => next[t.id]?.status === LIVE_STATUS.STANDBY && t.status === "Available")
            .sort((a, b) => (b.score || 0) - (a.score || 0));
          if (standbyPool.length > 0) replacement = standbyPool[0];
        }

        if (replacement) {
          next[replacement.id] = {
            status: LIVE_STATUS.SWAPPED_IN,
            swappedFor: trainId,
            swappedAt: new Date(),
          };

          setTimeout(() => {
            pushEvent({
              type: "FAULT",
              trainId,
              message: `${trainId} removed from service — ${faultReason}`,
              severity: "critical",
            });
            pushEvent({
              type: "SWAP",
              trainId: replacement.id,
              replacedTrain: trainId,
              message: `${replacement.id} (score ${replacement.score}) deployed from standby to replace ${trainId}`,
              severity: "success",
            });
          }, 0);
        } else {
          setTimeout(() => {
            pushEvent({
              type: "FAULT",
              trainId,
              message: `${trainId} removed from service — ${faultReason}`,
              severity: "critical",
            });
            pushEvent({
              type: "NO_STANDBY",
              trainId,
              message: `No standby train available to replace ${trainId}!`,
              severity: "warning",
            });
          }, 0);
        }
        return next;
      });
    },
    [allTrains, pushEvent]
  );

  // ── Halt all operations ────────────────────────────────────────
  const haltSystem = useCallback(() => {
    setSystemHalted(true);
    setLiveStatuses((prev) => {
      const next = {};
      Object.entries(prev).forEach(([id, data]) => {
        if (data.status === LIVE_STATUS.IN_SERVICE || data.status === LIVE_STATUS.SWAPPED_IN) {
          next[id] = { status: LIVE_STATUS.HALTED };
        } else {
          next[id] = data;
        }
      });
      return next;
    });
    pushEvent({
      type: "SYSTEM_HALT",
      message: "All trains shunted — System HALTED",
      severity: "critical",
    });
  }, [pushEvent]);

  // ── Resume operations ─────────────────────────────────────────
  const resumeOperations = useCallback(() => {
    setSystemHalted(false);
    setLiveStatuses((prev) => {
      const next = {};
      Object.entries(prev).forEach(([id, data]) => {
        if (data.status === LIVE_STATUS.HALTED) {
          // Return to in-service if it was scheduled, else standby
          next[id] = { status: scheduledTrainIds.has(id) ? LIVE_STATUS.IN_SERVICE : LIVE_STATUS.STANDBY };
        } else if (data.status === LIVE_STATUS.FAULTED) {
          // Keep faulted trains faulted
          next[id] = data;
        } else {
          next[id] = data;
        }
      });
      return next;
    });
    pushEvent({
      type: "SYSTEM_RESUME",
      message: "Operations resumed — trains returning to service",
      severity: "success",
    });
  }, [pushEvent, scheduledTrainIds]);

  // ── Resolve a fault (manual) ──────────────────────────────────
  const resolveFault = useCallback(
    (trainId) => {
      setLiveStatuses((prev) => {
        const next = { ...prev };
        next[trainId] = { status: LIVE_STATUS.STANDBY }; // Goes to standby after repair
        return next;
      });
      pushEvent({
        type: "FAULT_RESOLVED",
        trainId,
        message: `${trainId} fault resolved — moved to standby pool`,
        severity: "info",
      });
    },
    [pushEvent]
  );

  // ── Manual swap (operator-initiated) ──────────────────────────
  const manualSwap = useCallback(
    (outTrainId, inTrainId, reason) => {
      setLiveStatuses((prev) => {
        const next = { ...prev };
        // Pull the running train out → STANDBY (not faulted, just swapped out)
        next[outTrainId] = { status: LIVE_STATUS.STANDBY, swappedOutAt: new Date() };
        // Bring replacement in
        next[inTrainId] = {
          status: LIVE_STATUS.SWAPPED_IN,
          swappedFor: outTrainId,
          swappedAt: new Date(),
        };
        return next;
      });
      pushEvent({
        type: "MANUAL_SWAP",
        trainId: outTrainId,
        message: `${outTrainId} manually pulled from service — ${reason || 'Operator decision'}`,
        severity: "warning",
      });
      pushEvent({
        type: "SWAP",
        trainId: inTrainId,
        replacedTrain: outTrainId,
        message: `${inTrainId} deployed from standby to replace ${outTrainId}`,
        severity: "success",
      });
    },
    [pushEvent]
  );

  // ── Data-driven fault scanning ──────────────────────────────────
  const fetchFaultScan = useCallback(async () => {
    try {
      const resp = await fetch("/liveops/fault-scan");
      if (!resp.ok) return;
      const data = await resp.json();
      setLastScanTime(new Date(data.scan_time));

      if (!data.faults || data.faults.length === 0) return;

      // Process each detected fault (skip already-reported)
      for (const fault of data.faults) {
        if (reportedFaults.current.has(fault.train_id)) continue;
        reportedFaults.current.add(fault.train_id);

        const reason = fault.reasons.join(" | ");
        const suggestedId = fault.suggestion?.replacement_train || null;
        reportFault(fault.train_id, reason, suggestedId);
      }
    } catch {
      // API not available — skip this scan cycle
    }
  }, [reportFault]);

  const startFaultScan = useCallback(() => {
    if (scanTimer.current) clearInterval(scanTimer.current);
    setScanRunning(true);
    // Immediate first scan
    fetchFaultScan();
    // Then poll at long intervals
    scanTimer.current = setInterval(fetchFaultScan, FAULT_SCAN_INTERVAL_MS);
  }, [fetchFaultScan]);

  const stopFaultScan = useCallback(() => {
    if (scanTimer.current) {
      clearInterval(scanTimer.current);
      scanTimer.current = null;
    }
    setScanRunning(false);
  }, []);

  // Auto-start fault scanning when component mounts (after trains load)
  useEffect(() => {
    if (allTrains.length > 0 && !scanRunning && !scanTimer.current) {
      startFaultScan();
    }
    return () => {
      if (scanTimer.current) clearInterval(scanTimer.current);
    };
  }, [allTrains.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      if (scanTimer.current) clearInterval(scanTimer.current);
    };
  }, []);

  // ── Check if effectively halted (all service trains faulted) ──
  useEffect(() => {
    const serviceStatuses = Object.values(liveStatuses).filter(
      (d) =>
        d.status === LIVE_STATUS.IN_SERVICE ||
        d.status === LIVE_STATUS.SWAPPED_IN ||
        d.status === LIVE_STATUS.FAULTED
    );
    const allFaulted =
      serviceStatuses.length > 0 &&
      serviceStatuses.every((d) => d.status === LIVE_STATUS.FAULTED);
    const noStandby = getStandbyTrains().length === 0;

    if (allFaulted && noStandby && !systemHalted && serviceStatuses.length > 0) {
      setSystemHalted(true);
      pushEvent({
        type: "AUTO_HALT",
        message: "All trains faulted with no standby remaining — System AUTO-HALTED",
        severity: "critical",
      });
    }
  }, [liveStatuses, systemHalted, getStandbyTrains, pushEvent]);

  // ── Context value ─────────────────────────────────────────────
  const value = {
    liveStatuses,
    events,
    systemHalted,
    scanRunning,
    lastScanTime,
    reportFault,
    resolveFault,
    manualSwap,
    haltSystem,
    resumeOperations,
    startFaultScan,
    stopFaultScan,
    getStandbyTrains,
    getInServiceTrains,
    getFaultedTrains,
    LIVE_STATUS,
  };

  return <LiveOperationsContext.Provider value={value}>{children}</LiveOperationsContext.Provider>;
}
