import React from 'react';

const SelectionControls = ({ 
  selectedTrains, 
  trains, 
  onSelectAllAvailable, 
  onClearAll, 
  onConfirmSelection 
}) => {
  return (
    <div className="mt-12 px-4">
      {/* Selection Count Display */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600 tracking-wider uppercase" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}>
              Selected Trains
            </span>
          </div>
          <div className="text-4xl font-bold text-black">
            {selectedTrains.size}
          </div>
          <div className="text-sm font-medium text-gray-600 tracking-wider uppercase" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}>
            of {trains.filter(t => t.status === "Available").length} available
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Select All Button */}
        <button
          onClick={onSelectAllAvailable}
          className="px-6 py-2.5 bg-white text-black border border-black rounded-sm hover:bg-black hover:text-white transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10 min-w-[140px]"
          style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}
        >
          <span className="font-medium tracking-wider uppercase">
            Select All Available
          </span>
        </button>

        {/* Clear All Button */}
        <button
          onClick={onClearAll}
          className="px-6 py-2.5 bg-white text-black border border-black rounded-sm hover:bg-black hover:text-white transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10 min-w-[140px]"
          style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}
        >
          <span className="font-medium tracking-wider uppercase">
            Clear All
          </span>
        </button>

        {/* Confirm Selection Button */}
        <button
          onClick={onConfirmSelection}
          disabled={selectedTrains.size === 0}
          className="px-6 py-2.5 bg-white text-black border border-black rounded-sm hover:bg-black hover:text-white transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black min-w-[140px]"
          style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}
        >
          <span className="font-medium tracking-wider uppercase">
            Confirm Selection ({selectedTrains.size})
          </span>
        </button>
      </div>
    </div>
  );
};

export default SelectionControls;
