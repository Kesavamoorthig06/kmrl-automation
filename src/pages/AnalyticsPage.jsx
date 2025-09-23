import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity, Zap, Users, Wrench, AlertTriangle, Hash, Check, Settings, Train, IndianRupee, Paintbrush, Gauge, ArrowLeft, Play, Target, DollarSign, Brush, AlertCircle, PieChart, MapPin, Clock, Shield, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import DeploymentSuccessPage from '../components/DeploymentSuccessPage.jsx';
import MLDataService from '../services/MLDataService.js';
import { useNavigate, useLocation } from 'react-router-dom';

const AnalyticsPage = () => {
  const [trains, setTrains] = useState([]);
  const [selectedTrains, setSelectedTrains] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showDeploymentSuccess, setShowDeploymentSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadAnalyticsData();
    // Get selected trains from location state or localStorage
    const savedSelectedTrains = location.state?.selectedTrains || 
      JSON.parse(localStorage.getItem('selectedTrains') || '[]');
    setSelectedTrains(new Set(savedSelectedTrains));
  }, [location.state]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load ML data using MLDataService
      const mlData = await MLDataService.loadMLData();
      
      if (!mlData || mlData.length === 0) {
        setError('No train data available for analytics. The ML analysis CSV file may be empty or corrupted.');
        setTrains([]);
        setPerformanceMetrics(null);
        setDashboardSummary(null);
        return;
      }
      
      setTrains(mlData);
      
      // Get performance metrics from MLDataService
      const summary = MLDataService.getDashboardSummary();
      const metrics = MLDataService.getPerformanceMetrics();
      const mlAlerts = MLDataService.getAlerts();
      
      setDashboardSummary(summary);
      setPerformanceMetrics(metrics);
      setAlerts(mlAlerts);
      
      setError(null);
      console.log('✅ Analytics data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading analytics data:', err);
      setError('Failed to load analytics data. Please ensure the ML analysis data is available.');
      setTrains([]);
      setPerformanceMetrics(null);
      setDashboardSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleModifySelection = () => {
    // Save current selection and navigate back to dashboard
    localStorage.setItem('selectedTrains', JSON.stringify(Array.from(selectedTrains)));
    window.location.href = '/dashboard';
  };

  const handleDeploySelected = () => {
    // Get selected train IDs for deployment
    const selectedTrainIds = Array.from(selectedTrains);
    
    // Show deployment success alert with crew notifications
    alert(`Successfully deployed ${selectedTrainIds.length} trains!\n\nDeployment Details:\n- Trains: ${selectedTrainIds.join(', ')}\n- Success Rate: 100%\n- All crews have been notified\n\nDeployment completed successfully!`);
    
    // Show the deployment success page
    setShowDeploymentSuccess(true);
  };

  const handleNewDeployment = () => {
    setShowDeploymentSuccess(false);
    // Navigate back to dashboard for new selection
    window.location.href = '/dashboard';
  };

  const handleViewDashboard = () => {
    setShowDeploymentSuccess(false);
    // Navigate to dashboard
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          currentPage="analytics" 
          onPageChange={() => {}}
          userInfo={{ name: 'Admin User', role: 'Operations Manager' }}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Analytics Data...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we load the ML analysis data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show deployment success page
  if (showDeploymentSuccess) {
    return (
      <DeploymentSuccessPage 
        selectedTrains={Array.from(selectedTrains)}
        onNewDeployment={handleNewDeployment}
        onViewDashboard={handleViewDashboard}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          currentPage="analytics" 
          onPageChange={() => {}}
          userInfo={{ name: 'Admin User', role: 'Operations Manager' }}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter trains to show only selected ones
  const selectedTrainData = trains.filter(train => selectedTrains.has(train.id));
  
  // Calculate additional analytics for selected trains
  const totalSelectedTrains = selectedTrainData.length;
  const availableSelectedTrains = selectedTrainData.filter(t => t.status === 'Available').length;
  const maintenanceSelectedTrains = selectedTrainData.filter(t => t.status === 'Maintenance').length;
  const avgScore = totalSelectedTrains > 0 ? selectedTrainData.reduce((sum, train) => sum + (train.score || 0), 0) / totalSelectedTrains : 0;
  const avgMileage = totalSelectedTrains > 0 ? selectedTrainData.reduce((sum, train) => sum + (train.mileage || 0), 0) / totalSelectedTrains : 0;

  // Score distribution for selected trains
  const scoreDistribution = {
    excellent: selectedTrainData.filter(t => t.score >= 0.9).length,
    good: selectedTrainData.filter(t => t.score >= 0.7 && t.score < 0.9).length,
    fair: selectedTrainData.filter(t => t.score >= 0.5 && t.score < 0.7).length,
    poor: selectedTrainData.filter(t => t.score < 0.5).length
  };

  // Branding priority distribution for selected trains
  const brandingDistribution = {
    high: selectedTrainData.filter(t => t.branding_priority >= 7).length,
    medium: selectedTrainData.filter(t => t.branding_priority >= 4 && t.branding_priority < 7).length,
    low: selectedTrainData.filter(t => t.branding_priority < 4).length
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar 
        currentPage="analytics" 
        onPageChange={() => {}}
        userInfo={{ name: 'Admin User', role: 'Operations Manager' }}
      />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <PieChart className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl font-normal text-gray-900">Selected Trains Analytics</h1>
                <p className="text-gray-600 mt-1">Performance insights for {totalSelectedTrains} selected trains</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {dashboardSummary?.lastUpdate ? new Date(dashboardSummary.lastUpdate).toLocaleString() : 'N/A'}
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white transition-all duration-300 font-medium"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* System Status */}
        <div className="mb-8">
          {/* Main Status Cards */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Check className="h-4 w-4 text-gray-600" strokeWidth={2} />
                </div>
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-base text-gray-800">{availableSelectedTrains}</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Settings className="h-4 w-4 text-gray-600" strokeWidth={2} />
                </div>
                <p className="text-xs text-gray-500">Maintenance</p>
                <p className="text-base text-gray-800">{maintenanceSelectedTrains}</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <AlertCircle className="h-4 w-4 text-gray-600" strokeWidth={2} />
                </div>
                <p className="text-xs text-gray-500">Violations</p>
                <p className="text-base text-gray-800">0</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Hash className="h-4 w-4 text-gray-600" strokeWidth={2} />
                </div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-base text-gray-800">{totalSelectedTrains}</p>
              </div>
            </div>
          </div>

          {/* Average Metrics */}
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
                <p className="text-base text-gray-800">{selectedTrainData.filter(t => t.assignment === 'Service').length}</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Wrench className="h-4 w-4 text-gray-600" strokeWidth={2} />
                </div>
                <p className="text-xs text-gray-500">Maintenance</p>
                <p className="text-base text-gray-800">{selectedTrainData.filter(t => t.assignment === 'Maintenance').length}</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <IndianRupee className="h-4 w-4 text-gray-600" strokeWidth={2} />
                </div>
                <p className="text-xs text-gray-500">Cost</p>
                <p className="text-base text-gray-800">₹{Math.round(avgMileage * 0.1).toLocaleString()}M</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Paintbrush className="h-4 w-4 text-gray-600" strokeWidth={2} />
                </div>
                <p className="text-xs text-gray-500">Branding</p>
                <p className="text-base text-gray-800">Complete</p>
              </div>
            </div>
          </div>

          {/* Maintenance Needed Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Maintenance Needed</p>
                <div className="flex items-center space-x-2 mt-1">
                  <AlertTriangle className="h-3 w-3 text-gray-600" />
                  <span className="text-sm text-gray-700">{maintenanceSelectedTrains}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Trains requiring attention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Score Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Performance Score Distribution
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Excellent (≥90%)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${totalSelectedTrains > 0 ? (scoreDistribution.excellent / totalSelectedTrains) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{scoreDistribution.excellent}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Good (70-89%)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${totalSelectedTrains > 0 ? (scoreDistribution.good / totalSelectedTrains) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{scoreDistribution.good}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Fair (50-69%)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${totalSelectedTrains > 0 ? (scoreDistribution.fair / totalSelectedTrains) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{scoreDistribution.fair}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Poor (&lt;50%)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${totalSelectedTrains > 0 ? (scoreDistribution.poor / totalSelectedTrains) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{scoreDistribution.poor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Branding Priority Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Branding Priority Distribution
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">High Priority (7-8)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${totalSelectedTrains > 0 ? (brandingDistribution.high / totalSelectedTrains) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{brandingDistribution.high}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Medium Priority (4-6)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${totalSelectedTrains > 0 ? (brandingDistribution.medium / totalSelectedTrains) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{brandingDistribution.medium}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Low Priority (1-3)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
                      style={{ width: `${totalSelectedTrains > 0 ? (brandingDistribution.low / totalSelectedTrains) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{brandingDistribution.low}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Service Assignment */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Service Assignment
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Service</span>
                <span className="text-lg font-medium text-gray-900">
                  {selectedTrainData.filter(t => t.assignment === 'Service').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Maintenance</span>
                <span className="text-lg font-medium text-gray-900">
                  {selectedTrainData.filter(t => t.assignment === 'Maintenance').length}
                </span>
              </div>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cost Analysis
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Mileage</span>
                <span className="text-lg font-medium text-gray-900">
                  {Math.round(avgMileage).toLocaleString()} km
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Est. Cost</span>
                <span className="text-lg font-medium text-gray-900">
                  ₹{Math.round(avgMileage * 0.1).toLocaleString()}M
                </span>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              System Alerts
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Alerts</span>
                <span className="text-lg font-bold text-gray-900">{alerts.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical</span>
                <span className="text-lg font-bold text-red-600">
                  {alerts.filter(a => a.type === 'critical').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Trains */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Top Performing Trains
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Train ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branding Priority</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedTrainData
                  .sort((a, b) => b.score - a.score)
                  .map((train, index) => (
                    <tr key={train.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {train.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          train.score >= 0.9 ? 'bg-green-100 text-green-800' :
                          train.score >= 0.7 ? 'bg-blue-100 text-blue-800' :
                          train.score >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(train.score * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          train.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {train.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {train.mileage?.toLocaleString()} km
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-4 py-2 text-sm font-bold rounded-md ${
                          train.branding_priority >= 7 ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          train.branding_priority >= 4 ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}>
                          {train.branding_priority}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={handleModifySelection}
            className="flex items-center px-6 py-3 bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white transition-all duration-300 font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Modify Selection
          </button>
          <button
            onClick={handleDeploySelected}
            className="flex items-center px-6 py-3 bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white transition-all duration-300 font-medium"
          >
            Deploy Selected Trains
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;
