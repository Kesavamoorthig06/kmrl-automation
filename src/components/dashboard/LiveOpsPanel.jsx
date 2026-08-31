/**
 * LiveOpsPanel — Floating control panel for live train operations.
 *
 * Shows:  event feed · standby pool count · fault / halt / resume controls
 * Allows: triggering test faults, halting, resuming, running auto-sim
 */
import React, { useState } from "react";
import {
  AlertTriangle,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  OctagonX,
  Activity,
  Radio,
  CheckCircle2,
  XCircle,
  Info,
  Clock,
} from "lucide-react";
import { useLiveOperations, LIVE_STATUS } from "../../contexts/LiveOperationsContext.jsx";

// ── Severity → colour map ────────────────────────────────────────
const SEVERITY_STYLES = {
  critical: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};
const SEVERITY_ICON = {
  critical: <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />,
  info: <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />,
};

export default function LiveOpsPanel({ trains = [] }) {
  const {
    events,
    systemHalted,
    scanRunning,
    lastScanTime,
    resolveFault,
    haltSystem,
    resumeOperations,
    getStandbyTrains,
    getInServiceTrains,
    getFaultedTrains,
  } = useLiveOperations();

  const [expanded, setExpanded] = useState(true);

  const inService = getInServiceTrains();
  const standby = getStandbyTrains();
  const faulted = getFaultedTrains();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
      {/* ── Header ──────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${systemHalted ? "bg-red-500 animate-pulse" : scanRunning ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
          <span className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">
            LIVE OPERATIONS
          </span>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
              {inService.length} Active
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">
              {standby.length} Standby
            </span>
            {faulted.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold animate-pulse">
                {faulted.length} Faulted
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-gray-700">
          {/* ── System Halted Banner ──────────────────────────────── */}
          {systemHalted && (
            <div className="mx-4 mt-4 px-4 py-3 bg-red-600 rounded-lg flex items-center gap-3 animate-pulse">
              <OctagonX className="h-6 w-6 text-white flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">SYSTEM HALTED</p>
                <p className="text-red-100 text-xs">All trains shunted — operations suspended</p>
              </div>
              <button
                onClick={resumeOperations}
                className="ml-auto px-3 py-1.5 bg-white text-red-700 text-xs font-bold rounded hover:bg-red-50 transition-colors"
              >
                RESUME
              </button>
            </div>
          )}

          {/* ── Controls ─────────────────────────────────────────── */}
          <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
            {/* Scan Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded">
              <div className={`w-1.5 h-1.5 rounded-full ${scanRunning ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
              {scanRunning ? "Scanning" : "Scan paused"}
              {lastScanTime && (
                <span className="text-[10px] text-slate-400 ml-1">
                  · {lastScanTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Halt / Resume */}
            {!systemHalted ? (
              <button
                onClick={haltSystem}
                disabled={inService.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <OctagonX className="h-3.5 w-3.5" /> HALT ALL
              </button>
            ) : (
              <button
                onClick={resumeOperations}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> RESUME OPS
              </button>
            )}

            {/* Resolve all faults */}
            {faulted.length > 0 && (
              <button
                onClick={() => faulted.forEach((t) => resolveFault(t.id))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> RESOLVE ALL
              </button>
            )}
          </div>

          {/* ── Standby Pool ─────────────────────────────────────── */}
          {standby.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Radio className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Standby Pool</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {standby.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-700"
                  >
                    {t.id}
                    <span className="text-[10px] text-blue-500">({t.score})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Event Feed ───────────────────────────────────────── */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Live Event Feed</span>
              {events.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 font-medium">{events.length}</span>
              )}
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic py-3 text-center">
                  No events yet — trigger a fault or start auto-sim
                </p>
              ) : (
                events.map((evt, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${SEVERITY_STYLES[evt.severity] || SEVERITY_STYLES.info} ${i === 0 ? "animate-fadeIn" : ""}`}
                  >
                    {SEVERITY_ICON[evt.severity] || SEVERITY_ICON.info}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-tight">{evt.message}</p>
                      <p className="text-[10px] opacity-60 mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {evt.ts?.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
