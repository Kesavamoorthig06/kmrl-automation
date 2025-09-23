import React from 'react';
import { 
  Train, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  IndianRupee, 
  Paintbrush, 
  Activity,
  Users,
  Gauge,
  Play,
  Settings,
  AlertCircle,
  Hash,
  Zap,
  Power,
  Check
} from 'lucide-react';

const SystemStatus = ({ realTimeData, optimizationResults, isRealTimeActive, mlData }) => {
  // Use mlData if available, otherwise fall back to realTimeData
  const trains = mlData || (realTimeData?.trains) || [];
  
  if (!trains || trains.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <Train className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">System Status</h3>
      </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading train data...</p>
        </div>
      </div>
    );
  }

  const totalTrains = trains.length;
  const availableTrains = trains.filter(t => t.status === 'Available').length;
  const maintenanceTrains = trains.filter(t => t.status === 'Maintenance').length;

  // Calculate average metrics from ML data
  const avgScore = trains.reduce((sum, train) => sum + (train.score || 0), 0) / totalTrains;
  const avgMileage = trains.reduce((sum, train) => sum + (train.mileage || 0), 0) / totalTrains;

  // Count constraint violations based on ML data
  const constraintViolations = {
    fitnessCertificates: trains.filter(t => !t.fitnessValid).length,
    jobCardStatus: trains.filter(t => t.jobCardStatus !== 'Clear').length,
    cleaningDetailing: trains.filter(t => t.cleaningScore < 80).length
  };

  const totalViolations = Object.values(constraintViolations).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-2 border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-800">System Status</h3>
        <div className="text-xs text-gray-500 font-mono font-bold">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Train Status Overview */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Check className="h-4 w-4 text-gray-600" strokeWidth={2} />
            </div>
            <p className="text-xs text-gray-500">Available</p>
            <p className="text-base text-gray-800">{availableTrains}</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Settings className="h-4 w-4 text-gray-600" strokeWidth={2} />
            </div>
            <p className="text-xs text-gray-500">Maintenance</p>
            <p className="text-base text-gray-800">{maintenanceTrains}</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertCircle className="h-4 w-4 text-gray-600" strokeWidth={2} />
            </div>
            <p className="text-xs text-gray-500">Violations</p>
            <p className="text-base text-gray-800">{totalViolations}</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Hash className="h-4 w-4 text-gray-600" strokeWidth={2} />
            </div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-base text-gray-800">{totalTrains}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="flex items-center space-x-6 mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Avg Score:</span>
          <span className="text-sm text-gray-700">{avgScore.toFixed(1)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Avg Mileage:</span>
          <span className="text-sm text-gray-700">{Math.round(avgMileage).toLocaleString()} km</span>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Train className="h-4 w-4 text-gray-600" strokeWidth={2} />
            </div>
            <p className="text-xs text-gray-500">Service</p>
            <p className="text-base text-gray-800">
              {trains.filter(t => t.assignment === 'Service').length}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Wrench className="h-4 w-4 text-gray-600" strokeWidth={2} />
            </div>
            <p className="text-xs text-gray-500">Maintenance</p>
            <p className="text-base text-gray-800">
              {trains.filter(t => t.assignment === 'Maintenance').length}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <IndianRupee className="h-4 w-4 text-gray-600" strokeWidth={2} />
            </div>
            <p className="text-xs text-gray-500">Cost</p>
            <p className="text-base text-gray-800">
              ₹{Math.round(avgMileage * 0.1).toLocaleString()}M
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Paintbrush className="h-4 w-4 text-gray-600" strokeWidth={2} />
            </div>
            <p className="text-xs text-gray-500">Branding</p>
            <p className="text-base text-gray-800">
              {trains.filter(t => t.brandingShortfall === true).length > 0 ? 'Shortfall' : 'Complete'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SystemStatus;
