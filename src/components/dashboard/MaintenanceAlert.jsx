import React from 'react';
import { AlertTriangle } from "lucide-react";

const MaintenanceAlert = ({ conflicts }) => {
  if (conflicts.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200">
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 text-gray-500" />
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-600">Maintenance Needed</p>
            <p className="text-lg font-bold text-gray-900">
              {conflicts.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Trains requiring attention</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAlert;
