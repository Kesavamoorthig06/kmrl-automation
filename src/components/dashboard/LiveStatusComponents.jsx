/**
 * LiveStatusCell — Table cell that shows real-time train status.
 * Must be rendered INSIDE a LiveOperationsProvider.
 */
import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  OctagonX,
  Radio,
  Activity,
} from "lucide-react";
import { useLiveOperations, LIVE_STATUS } from "../../contexts/LiveOperationsContext.jsx";

const STATUS_CONFIG = {
  [LIVE_STATUS.IN_SERVICE]: {
    label: "In Service",
    icon: CheckCircle,
    classes: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
  },
  [LIVE_STATUS.SWAPPED_IN]: {
    label: "Swapped In",
    icon: ArrowRightLeft,
    classes: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-700 animate-pulse",
  },
  [LIVE_STATUS.FAULTED]: {
    label: "Faulted",
    icon: AlertTriangle,
    classes: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700 animate-pulse",
  },
  [LIVE_STATUS.STANDBY]: {
    label: "Standby",
    icon: Radio,
    classes: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  },
  [LIVE_STATUS.HALTED]: {
    label: "Halted",
    icon: OctagonX,
    classes: "bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-300 border-red-300 dark:border-red-700 animate-pulse",
  },
};

export function LiveStatusCell({ trainId }) {
  const { liveStatuses } = useLiveOperations();
  const data = liveStatuses[trainId];
  if (!data) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700">
        <CheckCircle className="h-3 w-3 mr-1" /> Deployed
      </span>
    );
  }

  const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG[LIVE_STATUS.IN_SERVICE];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${cfg.classes}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {cfg.label}
      </span>
      {data.status === LIVE_STATUS.FAULTED && data.faultReason && (
        <span className="text-[10px] text-red-500 dark:text-red-400 max-w-[140px] truncate text-center" title={data.faultReason}>
          {data.faultReason}
        </span>
      )}
      {data.status === LIVE_STATUS.SWAPPED_IN && data.swappedFor && (
        <span className="text-[10px] text-blue-500 dark:text-blue-400">
          replacing {data.swappedFor}
        </span>
      )}
    </div>
  );
}

/**
 * SystemHaltBanner — Full-width banner when system is halted.
 * Must be rendered INSIDE a LiveOperationsProvider.
 */
export function SystemHaltBanner() {
  const { systemHalted, resumeOperations } = useLiveOperations();
  if (!systemHalted) return null;

  return (
    <div className="mb-6 px-6 py-4 bg-red-600 rounded-xl flex items-center gap-4 shadow-lg animate-pulse">
      <OctagonX className="h-8 w-8 text-white flex-shrink-0" />
      <div className="flex-1">
        <p className="text-white font-bold text-lg">SYSTEM HALTED</p>
        <p className="text-red-100 text-sm">All trains have been shunted — operations are suspended. No trains currently in service.</p>
      </div>
      <button
        onClick={resumeOperations}
        className="px-5 py-2 bg-white text-red-700 font-bold text-sm rounded-lg hover:bg-red-50 transition-colors shadow-md"
      >
        RESUME OPERATIONS
      </button>
    </div>
  );
}

/**
 * LiveDeployedTable — Replaces the static deployed trains table with live status awareness.
 */
export function LiveDeployedTable({ trains, selectedTrains, onTrainClick, t }) {
  const { liveStatuses, systemHalted } = useLiveOperations();

  // Build the visible trains list: originally selected + any swapped-in trains
  const visibleTrains = trains.filter((train) => {
    const status = liveStatuses[train.id]?.status;
    // Show: originally selected trains (any status) OR swapped-in trains
    return selectedTrains.has(train.id) || status === LIVE_STATUS.SWAPPED_IN;
  });

  // Count active (in service + swapped in)
  const activeCount = visibleTrains.filter((t) => {
    const s = liveStatuses[t.id]?.status;
    return s === LIVE_STATUS.IN_SERVICE || s === LIVE_STATUS.SWAPPED_IN;
  }).length;

  return (
    <div className="mb-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('currentlyDeployedTrains')}</h3>
        <div className="flex items-center space-x-3">
          {systemHalted ? (
            <span className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-pulse">
              <OctagonX className="h-4 w-4" /> HALTED
            </span>
          ) : (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {activeCount} {t('trainsInService')}
            </span>
          )}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '7%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="text-center font-bold py-4 text-gray-800 dark:text-gray-200">{t('rank')}</th>
              <th className="text-center font-bold py-4 text-gray-800 dark:text-gray-200">{t('trainId')}</th>
              <th className="text-center font-bold py-4 text-gray-800 dark:text-gray-200">Live Status</th>
              <th className="text-center font-bold py-4 text-gray-800 dark:text-gray-200">{t('score')}</th>
              <th className="text-center font-bold py-4 text-gray-800 dark:text-gray-200">{t('stablingBay')}</th>
              <th className="text-center font-bold py-4 text-gray-800 dark:text-gray-200">{t('brandingPriority')}</th>
              <th className="text-right font-bold py-4 text-gray-800 dark:text-gray-200">{t('mileage')}</th>
              <th className="text-center font-bold py-4 text-gray-800 dark:text-gray-200">{t('lastCleaned')}</th>
              <th className="text-center font-bold py-4 text-gray-800 dark:text-gray-200">Assignment</th>
            </tr>
          </thead>
          <tbody>
            {visibleTrains.map((train) => {
              const ls = liveStatuses[train.id]?.status;
              const isFaulted = ls === LIVE_STATUS.FAULTED;
              const isHalted = ls === LIVE_STATUS.HALTED;
              const isSwappedIn = ls === LIVE_STATUS.SWAPPED_IN;

              return (
                <tr
                  key={train.id}
                  className={`transition-all duration-500 border-b border-gray-100 dark:border-gray-700 ${
                    isFaulted
                      ? "bg-red-50/80 dark:bg-red-900/20 opacity-60"
                      : isHalted
                        ? "bg-red-50/50 dark:bg-red-900/10 opacity-50"
                        : isSwappedIn
                          ? "bg-blue-50/50 dark:bg-blue-900/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <td className="text-center py-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold border border-gray-300 dark:border-gray-600">
                      {train.rank}
                    </span>
                  </td>
                  <td className="text-center py-4">
                    <button
                      onClick={() => onTrainClick(train.id)}
                      className={`font-semibold transition-all duration-200 hover:scale-105 px-3 py-1 rounded-md ${
                        isFaulted
                          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 line-through"
                          : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      }`}
                    >
                      {train.id}
                    </button>
                  </td>
                  <td className="text-center py-4">
                    <LiveStatusCell trainId={train.id} />
                  </td>
                  <td className="text-center py-4">
                    <span className={`px-4 py-2 text-sm font-bold rounded-md ${
                      parseFloat(train.score) >= 0.95 ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                        : parseFloat(train.score) >= 0.90 ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : parseFloat(train.score) >= 0.85 ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : parseFloat(train.score) >= 0.80 ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}>{train.score}</span>
                  </td>
                  <td className="text-center py-4">
                    <span className={`px-4 py-2 text-sm font-bold rounded-md ${
                      train.stabling_bay?.toString().includes('A') ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                        : train.stabling_bay?.toString().includes('B') ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300'
                        : 'bg-pink-100 text-pink-800 border-2 border-pink-300'
                    }`}>{train.stabling_bay}</span>
                  </td>
                  <td className="text-center py-4">
                    <span className={`px-4 py-2 text-sm font-bold rounded-md ${
                      train.branding_priority >= 8 ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                        : train.branding_priority >= 6 ? 'bg-rose-100 text-rose-800 border-2 border-rose-300'
                        : 'bg-teal-100 text-teal-800 border-2 border-teal-300'
                    }`}>{train.branding_priority}</span>
                  </td>
                  <td className="text-right py-4">
                    <span className="font-semibold text-sm px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-md">{train.mileage?.toLocaleString()} km</span>
                  </td>
                  <td className="text-center py-4">
                    <span className="font-semibold text-sm px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-md">{train.last_cleaned_date}</span>
                  </td>
                  <td className="text-center py-4">
                    {isSwappedIn ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                        Swap-In
                      </span>
                    ) : isFaulted ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-700">
                        Removed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                        Service
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibleTrains.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No trains currently deployed</p>
            <p className="text-sm mt-1">Go to <button className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Schedule</button> to select and deploy trains.</p>
          </div>
        )}
      </div>
    </div>
  );
}
