import React from 'react';

const PerformanceMetrics = ({ performanceMetrics }) => {
  if (!performanceMetrics) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 hover:shadow-sm transition-all duration-200 group">
        <div className="text-center">
          <p className="text-xs font-medium text-gray-700">Service</p>
          <p className="text-base md:text-lg font-bold text-gray-900 group-hover:scale-105 transition-transform duration-200">
            {performanceMetrics.serviceTrainsCount}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 hover:shadow-sm transition-all duration-200 group">
        <div className="text-center">
          <p className="text-xs font-medium text-gray-700">Maintenance</p>
          <p className="text-base md:text-lg font-bold text-gray-900 group-hover:scale-105 transition-transform duration-200">
            {performanceMetrics.maintenanceTrainsCount}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 hover:shadow-sm transition-all duration-200 group">
        <div className="text-center">
          <p className="text-xs font-medium text-gray-700">Cost</p>
          <p className="text-base md:text-lg font-bold text-gray-900 group-hover:scale-105 transition-transform duration-200">
            ₹{performanceMetrics.totalShuntingCost}M
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 hover:shadow-sm transition-all duration-200 group">
        <div className="text-center">
          <p className="text-xs font-medium text-gray-700">Branding</p>
          <p className="text-base md:text-lg font-bold text-gray-900 group-hover:scale-105 transition-transform duration-200">
            {performanceMetrics.brandingShortfall === 'False' ? 'Met' : 'Shortfall'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
