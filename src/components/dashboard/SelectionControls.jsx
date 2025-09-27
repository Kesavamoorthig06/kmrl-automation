import React from 'react';

const SelectionControls = ({ 
  selectedTrains, 
  trains, 
  onSelectAllAvailable, 
  onClearAll, 
  onConfirmSelection,
  t
}) => {
  return (
    <div>
      {/* Selection Count Display */}
      <div className="text-center mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:space-x-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            {t('selectedTrainsCount')}
          </span>
          <div className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-200">
            {selectedTrains ? selectedTrains.size : 0}
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            OF {trains ? trains.filter(t => t.status === "Available").length : 0} {t('availableCount')}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Select All Button */}
        <button
          onClick={onSelectAllAvailable}
          className="px-6 py-3 bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300 min-w-[160px]"
        >
          {t('selectAllAvailable')}
        </button>

        {/* Clear All Button */}
        <button
          onClick={onClearAll}
          className="px-6 py-3 bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300 min-w-[120px]"
        >
          {t('clearAll')}
        </button>

        {/* Confirm Selection & Analytics Button */}
        <button
          onClick={onConfirmSelection}
          disabled={selectedTrains.size === 0}
          className="px-6 py-3 bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black min-w-[200px]"
        >
          {t('confirmAnalytics')} ({selectedTrains.size})
        </button>
      </div>
    </div>
  );
};

export default SelectionControls;
