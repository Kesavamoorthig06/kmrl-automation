import React from 'react';
import { AlertTriangle, CheckCircle, Info, Zap, Activity } from 'lucide-react';

const RealTimeAlerts = ({ alerts, optimizationResults, isRealTimeActive }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Real-Time System Alerts</h3>
        <div className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
          >
            <div className="flex items-start space-x-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <p className="font-medium text-sm">{alert.message}</p>
                {alert.trainId && (
                  <p className="text-xs mt-1 opacity-75">Train: {alert.trainId}</p>
                )}
                {alert.trains && alert.trains.length > 0 && (
                  <p className="text-xs mt-1 opacity-75">
                    Trains: {alert.trains.join(', ')}
                  </p>
                )}
                <p className="text-xs mt-1 opacity-60">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {optimizationResults && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800 text-sm">
              ML Optimization Complete
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            {optimizationResults.eligibleTrains} of {optimizationResults.totalTrains} trains ready for deployment
            {optimizationResults.conflicts.length > 0 && (
              <span className="ml-2 text-orange-600">
                • {optimizationResults.conflicts.length} conflicts detected
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default RealTimeAlerts;
