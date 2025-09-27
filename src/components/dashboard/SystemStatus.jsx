import React, { useState, useEffect } from 'react';
import { Activity, Zap, Database, Cpu, Wifi, AlertTriangle, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const SystemStatus = ({ realTimeData, optimizationResults, isRealTimeActive, mlData, t }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use mlData if available, otherwise fall back to realTimeData
  const trains = mlData || (realTimeData?.trains) || [];

  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  if (!trains || trains.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">{t('systemStatus')}</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const totalTrains = trains.length;
  const availableTrains = trains.filter(t => t.status === 'Available').length;
  const maintenanceTrains = trains.filter(t => t.status === 'Unavailable').length;

  // Calculate average metrics from ML data
  const avgScore = trains.reduce((sum, train) => sum + (train.score || 0), 0) / totalTrains;
  const avgMileage = trains.reduce((sum, train) => sum + (train.mileage || 0), 0) / totalTrains;

  // Count constraint violations based on ML data
  const constraintViolations = {
    fitnessCertificates: trains.filter(t => !t.fitnessValid).length,
    jobCardStatus: trains.filter(t => t.jobCardStatus !== 'Clear').length,
    cleaningDetailing: trains.filter(t => (t.cleaningScore || 0) < 0.8).length,
    brandingPriorities: trains.filter(t => (t.brandingScore || 0) < 0.5).length
  };

  const totalViolations = Object.values(constraintViolations).reduce((sum, count) => sum + count, 0);

  // Calculate additional metrics for the second row
  const serviceTrains = 14; // Fixed service count as requested
  const efficiencyScore = Math.round(avgScore * 100); // Convert to percentage
  const reliabilityScore = trains.filter(t => t.score > 0.7).length; // High-performing trains
  const deployedTrains = trains.filter(t => t.status === 'Deployed').length;
  const reliabilityRate = (reliabilityScore / totalTrains) * 100;
  const utilizationRate = (availableTrains / totalTrains) * 100;

  // Chart data preparation
  const fleetStatusData = {
    labels: [t('available'), t('maintenance'), t('deployed'), t('unavailable')],
    datasets: [
      {
        data: [
          availableTrains,
          maintenanceTrains,
          deployedTrains,
          totalTrains - availableTrains - maintenanceTrains - deployedTrains
        ],
        backgroundColor: [
          '#10B981',
          '#F59E0B',
          '#3B82F6',
          '#EF4444'
        ],
        borderColor: [
          '#059669',
          '#D97706',
          '#2563EB',
          '#DC2626'
        ],
        borderWidth: 3,
        hoverOffset: 8
      }
    ]
  };

  const performanceData = {
    labels: [t('avgScore'), t('efficiency'), t('reliability'), t('utilization')],
    datasets: [
      {
        data: [
          avgScore * 100,
          efficiencyScore,
          reliabilityRate,
          utilizationRate
        ],
        backgroundColor: [
          '#8B5CF6',
          '#06B6D4',
          '#10B981',
          '#F59E0B'
        ],
        borderColor: [
          '#7C3AED',
          '#0891B2',
          '#059669',
          '#D97706'
        ],
        borderWidth: 3,
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };

  const violationsData = {
    labels: [
      t('fitnessCertificates'),
      t('jobCardStatus'),
      t('cleaningDetailing'),
      t('brandingPriorities')
    ],
    datasets: [
      {
        data: [
          constraintViolations.fitnessCertificates,
          constraintViolations.jobCardStatus,
          constraintViolations.cleaningDetailing,
          constraintViolations.brandingPriorities
        ],
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 3,
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
            return `${context.label}: ${context.parsed.toFixed(1)}${context.datasetIndex === 1 ? '%' : ''}`;
          }
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    cutout: '65%',
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'bottom'
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
          font: {
            size: 11,
            weight: '600'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          lineWidth: 1
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            weight: '600'
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">{t('systemStatus')}</h3>
        <div className="text-sm text-gray-500 font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Integrated Status Cards with Visualizations */}
      <div className="space-y-6">
        {/* Main Status Cards Row */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Available */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm font-semibold text-green-700 mb-1">{t('available')}</p>
            <p className="text-2xl font-bold text-green-900 group-hover:scale-110 transition-transform duration-300">{availableTrains}</p>
            <div className="text-xs text-green-600 mt-1">
              {Math.round((availableTrains / totalTrains) * 100)}% of fleet
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm font-semibold text-amber-700 mb-1">{t('maintenance')}</p>
            <p className="text-2xl font-bold text-amber-900 group-hover:scale-110 transition-transform duration-300">{maintenanceTrains}</p>
            <div className="text-xs text-amber-600 mt-1">
              {Math.round((maintenanceTrains / totalTrains) * 100)}% of fleet
            </div>
          </div>

          {/* Violations */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm font-semibold text-rose-700 mb-1">{t('violations')}</p>
            <p className="text-2xl font-bold text-rose-900 group-hover:scale-110 transition-transform duration-300">{totalViolations}</p>
            <div className="text-xs text-rose-600 mt-1">
              {totalViolations > 0 ? 'Needs attention' : 'All clear'}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">{t('total')}</p>
            <p className="text-2xl font-bold text-slate-900 group-hover:scale-110 transition-transform duration-300">{totalTrains}</p>
            <div className="text-xs text-slate-600 mt-1">
              Total fleet size
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Fleet Status Doughnut Chart */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-3">
              <h4 className="text-sm font-bold text-gray-800 flex items-center justify-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {t('fleetStatusDistribution')}
              </h4>
            </div>
            <div className="h-48">
              <Doughnut data={fleetStatusData} options={doughnutOptions} />
            </div>
          </div>

          {/* Performance Metrics Bar Chart */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-3">
              <h4 className="text-sm font-bold text-gray-800 flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('performanceOverview')}
              </h4>
            </div>
            <div className="h-48">
              <Bar data={performanceData} options={barOptions} />
            </div>
          </div>

          {/* Constraint Violations Chart */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-3">
              <h4 className="text-sm font-bold text-gray-800 flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('constraintViolations')}
              </h4>
            </div>
            <div className="h-48">
              <Bar data={violationsData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* Additional Metrics Row */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Service */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">{t('service')}</p>
            <p className="text-xl font-bold text-slate-900 group-hover:scale-110 transition-transform duration-300">{serviceTrains}</p>
            <div className="text-xs text-slate-600 mt-1">
              Active services
            </div>
          </div>

          {/* Efficiency */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-emerald-700 mb-1">{t('efficiency')}</p>
            <p className="text-xl font-bold text-emerald-900 group-hover:scale-110 transition-transform duration-300">{efficiencyScore}%</p>
            <div className="text-xs text-emerald-600 mt-1">
              System efficiency
            </div>
          </div>

          {/* Cost */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-2">
              <Database className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-indigo-700 mb-1">{t('cost')}</p>
            <p className="text-xl font-bold text-indigo-900 group-hover:scale-110 transition-transform duration-300">₹11,240M</p>
            <div className="text-xs text-indigo-600 mt-1">
              Total cost
            </div>
          </div>

          {/* Reliability */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-2">
              <Cpu className="h-5 w-5 text-cyan-600" />
            </div>
            <p className="text-sm font-semibold text-cyan-700 mb-1">{t('reliability')}</p>
            <p className="text-xl font-bold text-cyan-900 group-hover:scale-110 transition-transform duration-300">{reliabilityScore}</p>
            <div className="text-xs text-cyan-600 mt-1">
              {reliabilityRate.toFixed(1)}% reliable
            </div>
          </div>
        </div>

        {/* Performance Metrics Row */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-700">{t('avgScore')}</p>
                  <p className="text-xs text-purple-600">Performance score</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-900 group-hover:scale-110 transition-transform duration-300">{(avgScore * 100).toFixed(1)}%</p>
                <div className="flex items-center text-xs text-purple-600">
                  {avgScore >= 0.7 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {avgScore >= 0.7 ? 'Good' : 'Needs improvement'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Wifi className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-700">{t('avgMileage')}</p>
                  <p className="text-xs text-blue-600">Total distance</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900 group-hover:scale-110 transition-transform duration-300">{Math.round(avgMileage).toLocaleString()} km</p>
                <div className="text-xs text-blue-600">
                  Fleet average
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SystemStatus;
