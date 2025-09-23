import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, Zap, Activity, Clock, Filter } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import RealTimeDataService from '../services/RealTimeDataService.js';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'critical', 'warning', 'info'
  const [realTimeData, setRealTimeData] = useState(null);

  useEffect(() => {
    // Initialize real-time data service
    const initializeRealTimeData = async () => {
      try {
        await RealTimeDataService.start();
        setIsRealTimeActive(true);
        
        // Register for updates
        RealTimeDataService.onUpdate('data_update', (data) => {
          setRealTimeData(data);
        });
        
        RealTimeDataService.onUpdate('optimization_update', (results) => {
          setOptimizationResults(results);
        });
        
        RealTimeDataService.onUpdate('summary_update', (summary) => {
          setAlerts(summary.alerts || []);
        });
        
        // Get initial data
        const initialData = RealTimeDataService.getCurrentData();
        if (initialData) {
          setRealTimeData(initialData);
        }
      } catch (error) {
        console.error('Failed to initialize real-time data service:', error);
      }
    };

    initializeRealTimeData();

    return () => {
      if (isRealTimeActive) {
        RealTimeDataService.stop();
        setIsRealTimeActive(false);
      }
    };
  }, [isRealTimeActive]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
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

  const getAlertBadgeColor = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length
  };

  const handleNavbarNavigation = (page) => {
    if (page === 'selection') {
      window.location.href = '/';
    } else if (page === 'dashboard') {
      window.location.href = '/';
    } else if (page === 'alerts') {
      // Already on alerts page
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        currentPage="alerts" 
        onPageChange={handleNavbarNavigation}
        userInfo={{ name: 'Admin User', role: 'Operations Manager' }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Alerts</h1>
              <p className="text-gray-600 mt-1">Monitoring and notifications</p>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', count: alertCounts.all },
                { key: 'critical', label: 'Critical', count: alertCounts.critical },
                { key: 'warning', label: 'Warning', count: alertCounts.warning },
                { key: 'info', label: 'Info', count: alertCounts.info }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      filter === key ? 'bg-gray-100' : 'bg-gray-200'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'All systems are running smoothly' 
                  : `No ${filter} alerts at this time`
                }
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg border ${getAlertColor(alert.type)} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start space-x-4">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{alert.message}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getAlertBadgeColor(alert.type)}`}>
                        {alert.type.toUpperCase()}
                      </span>
                    </div>
                    
                    {alert.trainId && (
                      <p className="text-sm opacity-75 mb-2">
                        <span className="font-medium">Train:</span> {alert.trainId}
                      </p>
                    )}
                    
                    {alert.trains && alert.trains.length > 0 && (
                      <p className="text-sm opacity-75 mb-2">
                        <span className="font-medium">Trains:</span> {alert.trains.join(', ')}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs opacity-60">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ML Optimization Status */}
        {optimizationResults && (
          <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">ML Optimization Status</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {optimizationResults.eligibleTrains}
                </div>
                <div className="text-sm text-gray-600">Eligible Trains</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {optimizationResults.totalTrains}
                </div>
                <div className="text-sm text-gray-600">Total Trains</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {optimizationResults.conflicts.length}
                </div>
                <div className="text-sm text-gray-600">Conflicts</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Last optimization: {new Date(optimizationResults.timestamp).toLocaleString()}</span>
                <span>Processing time: {optimizationResults.processingTime}ms</span>
              </div>
            </div>
          </div>
        )}

        {/* System Health Summary */}
        {realTimeData && (
          <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">System Health Summary</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {realTimeData.trains.filter(t => t.operationalData.currentStatus === 'in_service').length}
                </div>
                <div className="text-sm text-gray-600">In Service</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">
                  {realTimeData.trains.filter(t => t.operationalData.currentStatus === 'maintenance').length}
                </div>
                <div className="text-sm text-gray-600">Maintenance</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {realTimeData.trains.filter(t => t.operationalData.currentStatus === 'standby').length}
                </div>
                <div className="text-sm text-gray-600">Standby</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {realTimeData.trains.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
