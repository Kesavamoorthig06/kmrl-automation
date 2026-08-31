/**
 * SwapModal — Lets the admin manually swap a running train with a standby train.
 * Triggered from "Swap Train" button on Dashboard.
 */
import React, { useState, useMemo } from "react";
import { ArrowRightLeft, X, AlertTriangle, CheckCircle, Radio, Train } from "lucide-react";
import { useLiveOperations, LIVE_STATUS } from "../../contexts/LiveOperationsContext.jsx";

const SWAP_REASONS = [
  "Mechanical fault reported",
  "Electrical system warning",
  "Door malfunction",
  "AC / HVAC issue",
  "Braking irregularity",
  "Excessive vibration",
  "Passenger complaint (safety)",
  "Preventive pull-out",
  "Schedule rebalancing",
];

export default function SwapModal({ open, onClose, trains }) {
  const { liveStatuses, manualSwap, getStandbyTrains, getInServiceTrains } = useLiveOperations();

  const [outTrainId, setOutTrainId] = useState("");
  const [inTrainId, setInTrainId] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Running trains (IN_SERVICE or SWAPPED_IN)
  const runningTrains = useMemo(() => {
    return trains.filter((t) => {
      const s = liveStatuses[t.id]?.status;
      return s === LIVE_STATUS.IN_SERVICE || s === LIVE_STATUS.SWAPPED_IN;
    }).sort((a, b) => (a.id > b.id ? 1 : -1));
  }, [trains, liveStatuses]);

  // Standby trains
  const standbyTrains = useMemo(() => {
    return trains.filter((t) => {
      return liveStatuses[t.id]?.status === LIVE_STATUS.STANDBY;
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [trains, liveStatuses]);

  const effectiveReason = reason === "__custom" ? customReason : reason;
  const canSwap = outTrainId && inTrainId && effectiveReason.trim().length > 0;

  const handleSwap = () => {
    if (!canSwap) return;
    manualSwap(outTrainId, inTrainId, effectiveReason);
    setConfirmed(true);
    setTimeout(() => {
      resetAndClose();
    }, 2000);
  };

  const resetAndClose = () => {
    setOutTrainId("");
    setInTrainId("");
    setReason("");
    setCustomReason("");
    setConfirmed(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <ArrowRightLeft className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manual Train Swap</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Replace a running train with a standby</p>
            </div>
          </div>
          <button onClick={resetAndClose} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Success State */}
        {confirmed ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">Swap Successful</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {outTrainId} pulled out &rarr; {inTrainId} deployed
            </p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Step 1 — Select train to pull out */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Pull Out (Running Train)
                </span>
              </label>
              <select
                value={outTrainId}
                onChange={(e) => setOutTrainId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              >
                <option value="">Select train to remove...</option>
                {runningTrains.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — Score {t.score} — Bay {t.stabling_bay} — {liveStatuses[t.id]?.status === LIVE_STATUS.SWAPPED_IN ? "Swapped In" : "In Service"}
                  </option>
                ))}
              </select>
              {runningTrains.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No trains currently in service.</p>
              )}
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRightLeft className="h-6 w-6 text-gray-400 rotate-90" />
            </div>

            {/* Step 2 — Select replacement */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-emerald-500" />
                  Deploy (Standby Train)
                </span>
              </label>
              <select
                value={inTrainId}
                onChange={(e) => setInTrainId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="">Select standby replacement...</option>
                {standbyTrains.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — Score {t.score} — Bay {t.stabling_bay}
                  </option>
                ))}
              </select>
              {standbyTrains.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No standby trains available.</p>
              )}
            </div>

            {/* Step 3 — Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Reason for Swap
              </label>
              <select
                value={reason}
                onChange={(e) => { setReason(e.target.value); if (e.target.value !== "__custom") setCustomReason(""); }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
              >
                <option value="">Select reason...</option>
                {SWAP_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="__custom">Other (type below)</option>
              </select>
              {reason === "__custom" && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Describe the reason..."
                  className="mt-2 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                />
              )}
            </div>

            {/* Preview */}
            {canSwap && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  Swap Preview
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  <span className="font-bold text-red-600 dark:text-red-400">{outTrainId}</span> will be pulled from service and
                  <span className="font-bold text-emerald-600 dark:text-emerald-400"> {inTrainId}</span> will be deployed as replacement.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!confirmed && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={resetAndClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSwap}
              disabled={!canSwap}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                canSwap
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              Confirm Swap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
