import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table.jsx";
import { BadgeCheckbox } from "../ui/Badge.jsx";

const TrainTable = ({ 
  trains, 
  selectedTrains, 
  onTrainClick, 
  onUnavailableClick, 
  onAvailableClick, 
  onTrainSelection,
  t
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-full overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{t('trainInductionList')}</h3>
          <div className="text-sm text-gray-600 font-medium">
            {selectedTrains.size} {t('selectedTrains')} {trains.filter(t => t.status === "Available").length} {t('availableTrains')}
          </div>
        </div>
      </div>

      {/* Mobile Card List (<= sm) */}
      <div className="px-2 py-3 sm:hidden">
        <div className="space-y-3">
          {trains.map((train) => (
            <div key={train.id} className="rounded-lg border border-slate-200 p-3 bg-white shadow-xs">
              <div className="flex items-center justify-between">
                <button onClick={() => onTrainClick(train.id)} className="font-semibold text-slate-900">
                  {train.id}
                </button>
                <BadgeCheckbox
                  checked={train.status === "Available"}
                  onUnavailableClick={() => onUnavailableClick(train)}
                  onAvailableClick={onAvailableClick}
                  train={train}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-600">{t('rank')}</div>
                <div className="text-right font-semibold">{train.rank}</div>
                <div className="text-slate-600">{t('score')}</div>
                <div className="text-right font-semibold">{train.score}</div>
                <div className="text-slate-600">Bay</div>
                <div className="text-right font-semibold">{train.stabling_bay}</div>
                <div className="text-slate-600">Branding</div>
                <div className="text-right font-semibold">{train.branding_priority}</div>
                <div className="text-slate-600">{t('mileage')}</div>
                <div className="text-right font-semibold">{train.mileage?.toLocaleString()} km</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">{t('lastCleaned')}: {train.last_cleaned_date}</span>
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTrains.has(train.id)}
                    disabled={train.status === "Unavailable"}
                    onChange={(e) => {
                      if (train.status !== "Unavailable") {
                        onTrainSelection(train.id, e.target.checked);
                      }
                    }}
                    className={`w-5 h-5 border rounded focus:ring-2 focus:ring-gray-500 transition-all ${
                      train.status === "Unavailable" 
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                        : selectedTrains.has(train.id)
                          ? 'text-black border-black bg-black'
                          : 'text-black border-gray-300 bg-white'
                    }`}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table (>= sm) */}
      <div className="hidden sm:block px-6 py-4">
        <div className="w-full max-w-full overflow-x-auto" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
          <table className="w-[920px] sm:w-full table-fixed" style={{ tableLayout: 'fixed', maxWidth: '100%' }}>
            {/* Fixed layout + explicit column widths so headers and body always align */}
            <colgroup>
              <col style={{ width: '7%' }} />   {/* Rank */}
              <col style={{ width: '9%' }} />  {/* Train ID */}
              <col style={{ width: '12%' }} />  {/* Status badge */}
              <col style={{ width: '9%' }} />  {/* Score */}
              <col style={{ width: '11%' }} />  {/* Stabling Bay */}
              <col style={{ width: '12%' }} />  {/* Branding Priority */}
              <col style={{ width: '11%' }} />  {/* Mileage (right) */}
              <col style={{ width: '11%' }} />  {/* Last Cleaned */}
              <col style={{ width: '8%' }} />   {/* Deployable */}
            </colgroup>

            <thead className="hidden sm:table-header-group">
              <tr className="bg-gray-50">
                <th className="text-center font-bold py-4 text-gray-800">{t('rank')}</th>
                <th className="text-center font-bold py-4 text-gray-800">{t('trainId')}</th>
                <th className="text-center font-bold py-4 text-gray-800">{t('status')}</th>
                <th className="text-center font-bold py-4 text-gray-800">{t('score')}</th>
                <th className="text-center font-bold py-4 text-gray-800">{t('stablingBay')}</th>
                <th className="text-center font-bold py-4 text-gray-800">{t('brandingPriority')}</th>
                <th className="text-right font-bold py-4 text-gray-800">{t('mileage')}</th>
                <th className="text-center font-bold py-4 text-gray-800">{t('lastCleaned')}</th>
                <th className="text-center font-bold py-4 text-gray-800">{t('deployable')}</th>
              </tr>
            </thead>

            <tbody className="block sm:table-row-group">
              {trains.map((train) => (
                <tr 
                  key={train.id}
                  className={`hover:bg-gray-50 transition-colors duration-200 sm:table-row block border-b sm:border-0 px-2 sm:px-0 py-2 sm:py-0 ${
                    selectedTrains.has(train.id) ? 'bg-gray-50' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="font-medium text-gray-900 text-center py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-sm font-bold rank-text border border-gray-300">
                        {train.rank}
                      </span>
                    </div>
                  </td>

                  {/* Train ID */}
                  <td className="font-mono text-center py-2 sm:py-4">
                    <div className="flex justify-center items-center w-full">
                      <button
                        onClick={() => onTrainClick(train.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-all duration-200 hover:scale-105 px-3 py-1 rounded-md hover:bg-blue-50"
                      >
                        {train.id}
                      </button>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="text-center py-2 sm:py-4">
                    <div className="flex justify-center items-center w-full">
                      <BadgeCheckbox
                        checked={train.status === "Available"}
                        onUnavailableClick={() => onUnavailableClick(train)}
                        onAvailableClick={onAvailableClick}
                        train={train}
                      />
                    </div>
                  </td>

                  {/* Score */}
                  <td className="font-mono text-center py-2 sm:py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className={`score-badge px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 hover:scale-105 hover:shadow-md ${
                        parseFloat(train.score) >= 0.95 
                          ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400' 
                          : parseFloat(train.score) >= 0.90 
                              ? 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200 hover:border-green-400' 
                              : parseFloat(train.score) >= 0.85 
                              ? 'bg-blue-100 text-blue-800 border-2 border-blue-300 hover:bg-blue-200 hover:border-blue-400' 
                              : parseFloat(train.score) >= 0.80
                              ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300 hover:bg-yellow-200 hover:border-yellow-400'
                              : 'bg-red-100 text-red-800 border-2 border-red-300 hover:bg-red-200 hover:border-red-400'
                      }`}>
                        {train.score}
                      </span>
                    </div>
                  </td>

                  {/* Stabling Bay */}
                  <td className="font-mono text-center py-2 sm:py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className={`stabling-badge px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 hover:scale-105 hover:shadow-md ${
                        train.stabling_bay && train.stabling_bay.toString().includes('A')
                          ? 'bg-purple-100 text-purple-800 border-2 border-purple-300 hover:bg-purple-200 hover:border-purple-400'
                          : train.stabling_bay && train.stabling_bay.toString().includes('B')
                            ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300 hover:bg-indigo-200 hover:border-indigo-400'
                            : train.stabling_bay && train.stabling_bay.toString().includes('C')
                              ? 'bg-pink-100 text-pink-800 border-2 border-pink-300 hover:bg-pink-200 hover:border-pink-400'
                              : 'bg-violet-100 text-violet-800 border-2 border-violet-300 hover:bg-violet-200 hover:border-violet-400'
                      }`}>
                        {train.stabling_bay}
                      </span>
                    </div>
                  </td>

                  {/* Branding Priority */}
                  <td className="text-center py-2 sm:py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className={`branding-badge px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 hover:scale-105 hover:shadow-md ${
                        train.branding_priority >= 8
                          ? 'bg-orange-100 text-orange-800 border-2 border-orange-300 hover:bg-orange-200 hover:border-orange-400'  // High priority
                          : train.branding_priority >= 6
                              ? 'bg-rose-100 text-rose-800 border-2 border-rose-300 hover:bg-rose-200 hover:border-rose-400'  // Medium-high priority
                              : train.branding_priority >= 4
                                  ? 'bg-teal-100 text-teal-800 border-2 border-teal-300 hover:bg-teal-200 hover:border-teal-400'  // Medium priority
                                  : 'bg-slate-100 text-slate-800 border-2 border-slate-300 hover:bg-slate-200 hover:border-slate-400'  // Low priority
                      }`}>
                        {train.branding_priority}
                      </span>
                    </div>
                  </td>

                  {/* Mileage (right-aligned) */}
                  <td className="text-gray-700 py-2 sm:py-4">
                    <div className="flex justify-end items-center w-full">
                      <span className="mileage-text font-semibold text-sm px-2 py-1 bg-gray-50 rounded-md">{train.mileage?.toLocaleString()} km</span>
                    </div>
                  </td>

                  {/* Last Cleaned */}
                  <td className="text-gray-600 text-sm text-center py-2 sm:py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className="last-cleaned-text font-semibold text-sm px-2 py-1 bg-gray-50 rounded-md">{train.last_cleaned_date}</span>
                    </div>
                  </td>

                  {/* Deployable (checkbox) */}
                  <td className="text-center py-2 sm:py-4">
                    <div className="flex justify-center items-center w-full">
                      <label className="relative inline-flex cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedTrains.has(train.id)}
                          disabled={train.status === "Unavailable"}
                          onChange={(e) => {
                            if (train.status !== "Unavailable") {
                              onTrainSelection(train.id, e.target.checked);
                            }
                          }}
                          className={`w-6 h-6 border-2 rounded-md focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 appearance-none ${
                            train.status === "Unavailable" 
                              ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50" 
                              : selectedTrains.has(train.id)
                                ? "text-black border-black bg-black shadow-lg shadow-gray-200"
                                : "text-black border-gray-300 hover:border-gray-500 hover:shadow-md hover:shadow-gray-100 bg-white"
                          }`}
                        />
                        {selectedTrains.has(train.id) && train.status !== "Unavailable" && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg 
                              className="w-4 h-4 text-white drop-shadow-sm" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="3" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        )}
                      </label>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrainTable;

