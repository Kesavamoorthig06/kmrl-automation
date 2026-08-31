import React, { useState, useEffect } from 'react';
import { Activity, Zap, Database, Cpu, Wifi, AlertTriangle, BarChart3, TrendingUp, TrendingDown, CheckCircle, X, Train, Wrench, AlertCircle, Users, DollarSign, Shield, Clock, Target, IndianRupee } from 'lucide-react';
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
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';
import SystemStatusPopup from './SystemStatusPopup';
import { useTranslation } from '../../hooks/useTranslation';
import KMRLAnalytics, { formatNumber, formatCurrency, formatPercentage, getTrendIcon, getPriorityColor, getTypeColor } from '../../utils/analytics';
import APIService from '../../services/api';

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
  Filler,
  RadialLinearScale
);

const SystemStatusAnalyticsBanner = ({ realTimeData, optimizationResults, mlData, isCollapsed, onToggle }) => {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [performanceSummary, setPerformanceSummary] = useState(null);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [systemStatusData, setSystemStatusData] = useState(null);

  // Use mlData if available, otherwise fall back to realTimeData
  const trains = mlData || (realTimeData?.trains) || [];
  
  console.log('📊 Banner Props Data:', { mlData, realTimeData, trains: trains.length });

  // Get status data for cards
  const statusData = systemStatusData || {
    available: 0,
    maintenance: 0,
    violations: { total: 0, fitness: 0, jobCards: 0, cleaning: 0, branding: 0 },
    efficiency: { overall: 0, reliability: 0, utilization: 0 }
  };

  // Load system status data
  useEffect(() => {
    const loadSystemStatusData = async () => {
      try {
        const apiService = new APIService();
        
        // Load analytics data
        const analyticsResponse = await apiService.request('/get-analytics');
        
        // Load ML optimization results for detailed train data
        const mlResponse = await apiService.request('/ml-optimization');
        
        console.log('🔍 Analytics Response:', analyticsResponse);
        console.log('🔍 ML Response:', mlResponse);
        
        if (analyticsResponse.success && mlResponse.success) {
          // Fix: ML response has results in data.results, not directly in results
          const mlResults = mlResponse.data?.results || [];
          
          const statusData = {
            available: analyticsResponse.data.summary.operational || 0,
            maintenance: analyticsResponse.data.summary.maintenance || 0,
            violations: {
              total: mlResults.filter(t => t.overall_status === 'Unavailable').length || 0,
              fitness: mlResults.filter(t => !t.fitnessValid).length || 0,
              jobCards: mlResults.filter(t => t.jobCardStatus === 'Pending').length || 0,
              cleaning: mlResults.filter(t => t.cleaningScore < 0.7).length || 0,
              branding: mlResults.filter(t => t.brandingScore < 0.7).length || 0
            },
            total: analyticsResponse.data.summary.totalTrains || 0,
            efficiency: {
              overall: Math.round(analyticsResponse.data.performance.overall || 0),
              reliability: Math.round(analyticsResponse.data.performance.performance || 0),
              utilization: Math.round(analyticsResponse.data.performance.operational || 0)
            }
          };
          
          console.log('🎯 Processed Status Data:', statusData);
          setSystemStatusData(statusData);
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading system status data:', error);
        setIsLoaded(true);
      }
    };

    loadSystemStatusData();
  }, []);

  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Initialize analytics
  useEffect(() => {
    if (trains.length === 0) return;

    const analyticsEngine = new KMRLAnalytics();
    analyticsEngine.initialize(trains);
    
    setAnalytics(analyticsEngine);
    setPerformanceSummary(analyticsEngine.getPerformanceSummary());
  }, [trains]);

  // Flip card functionality
  const toggleCardFlip = (cardId) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // Popup functionality
  const handlePopupOpen = (cardType, data) => {
    setPopupData({ cardType, data });
    setPopupOpen(true);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
    setPopupData(null);
  };

  // FlipCard component
  const FlipCard = ({ cardId, frontContent, backContent, className = "", onButtonClick }) => {
    const isFlipped = flippedCards.has(cardId);
    
    return (
      <div 
        className={`relative w-full h-32 cursor-pointer perspective-1000 ${className}`}
        onClick={() => toggleCardFlip(cardId)}
      >
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 w-full h-full backface-hidden">
            {frontContent}
          </div>
          {/* Back */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
            {React.cloneElement(backContent, { onButtonClick })}
          </div>
        </div>
      </div>
    );
  };

  if (!trains || trains.length === 0) {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">{t('systemStatus')}</h3>
            </div>
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">{t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics from systemStatusData or fallback to trains, with defaults
  const totalTrains = systemStatusData ? (systemStatusData.available + systemStatusData.maintenance) : 
                     trains.length > 0 ? trains.length : 25; // Default to 25 if no data
  const availableTrains = systemStatusData ? systemStatusData.available : 
                         trains.length > 0 ? trains.filter(t => t.status === 'Available').length : 18; // Default available
  const maintenanceTrains = systemStatusData ? systemStatusData.maintenance : 
                           trains.length > 0 ? trains.filter(t => t.status === 'Unavailable').length : 5; // Default maintenance
  const deployedTrains = trains.filter(t => t.status === 'Deployed').length;
  const avgScore = trains.length > 0 ? trains.reduce((sum, train) => sum + (train.score || 0), 0) / trains.length : 0;
  const avgMileage = trains.length > 0 ? trains.reduce((sum, train) => sum + (train.mileage || 0), 0) / trains.length : 0;

  const constraintViolations = systemStatusData ? systemStatusData.violations : 
    trains.length > 0 ? {
      fitnessCertificates: trains.filter(t => !t.fitnessValid).length,
      jobCardStatus: trains.filter(t => t.jobCardStatus !== 'Clear').length,
      cleaningDetailing: trains.filter(t => t.cleaningScore < 0.8).length,
      brandingPriorities: trains.filter(t => t.brandingScore < 0.7).length
    } : {
      fitness: 2, // Default violations
      jobCards: 3,
      cleaning: 1,
      branding: 1
    };

  const totalViolations = Object.values(constraintViolations).reduce((sum, count) => sum + count, 0);
  const serviceTrains = 14;
  const efficiencyScore = systemStatusData ? systemStatusData.efficiency.overall : 
                         trains.length > 0 ? Math.round(avgScore * 100) : 85; // Default efficiency
  const reliabilityScore = trains.filter(t => t.score > 0.7).length;
  const reliabilityRate = systemStatusData ? systemStatusData.efficiency.reliability : 
                         trains.length > 0 ? (reliabilityScore / totalTrains) * 100 : 88; // Default reliability
  const utilizationRate = systemStatusData ? systemStatusData.efficiency.utilization : 
                         (availableTrains / totalTrains) * 100; // This will work with defaults

  // Debug logging to check calculated values
  console.log('🚂 Banner Debug - Calculated Values:', {
    systemStatusData,
    totalTrains,
    availableTrains,
    maintenanceTrains,
    totalViolations,
    efficiencyScore,
    reliabilityRate,
    utilizationRate
  });

  // Chart data - Unique charts for each metric
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
        backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
        borderColor: ['#059669', '#D97706', '#2563EB', '#DC2626'],
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  // Available Trains - Line chart showing availability trend over time
  const availabilityTrendData = {
    labels: ['6h ago', '4h ago', '2h ago', '1h ago', '30m ago', 'Now'],
    datasets: [
      {
        label: 'Available Trains',
        data: [
          Math.max(0, availableTrains - 2 + Math.random() * 4),
          Math.max(0, availableTrains - 1 + Math.random() * 2),
          Math.max(0, availableTrains - 1 + Math.random() * 2),
          Math.max(0, availableTrains - 0.5 + Math.random() * 1),
          Math.max(0, availableTrains - 0.5 + Math.random() * 1),
          availableTrains
        ],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  // Maintenance - Gauge-style chart showing maintenance workload
  const maintenanceWorkloadData = {
    labels: ['Scheduled', 'Emergency', 'Preventive', 'Overdue'],
    datasets: [
      {
        data: [
          Math.floor(maintenanceTrains * 0.6),
          Math.floor(maintenanceTrains * 0.2),
          Math.floor(maintenanceTrains * 0.15),
          Math.floor(maintenanceTrains * 0.05)
        ],
        backgroundColor: ['#F59E0B', '#EF4444', '#3B82F6', '#6B7280'],
        borderColor: ['#D97706', '#DC2626', '#2563EB', '#4B5563'],
        borderWidth: 2
      }
    ]
  };

  // Violations - Stacked bar chart showing violation types
  const violationTypesData = {
    labels: ['Fitness', 'Job Cards', 'Cleaning', 'Branding'],
    datasets: [
      {
        label: 'Critical',
        data: [
          Math.floor(constraintViolations.fitness * 0.3),
          Math.floor(constraintViolations.jobCards * 0.2),
          Math.floor(constraintViolations.cleaning * 0.1),
          Math.floor(constraintViolations.branding * 0.4)
        ],
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 1
      },
      {
        label: 'Warning',
        data: [
          Math.floor(constraintViolations.fitness * 0.7),
          Math.floor(constraintViolations.jobCards * 0.8),
          Math.floor(constraintViolations.cleaning * 0.9),
          Math.floor(constraintViolations.branding * 0.6)
        ],
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1
      }
    ]
  };

  // Efficiency - Radar chart showing efficiency dimensions
  const efficiencyRadarData = {
    labels: ['Energy', 'Operations', 'Maintenance', 'Utilization', 'Reliability'],
    datasets: [
      {
        label: 'Current Performance',
        data: [
          efficiencyScore * 0.9,
          efficiencyScore * 1.1,
          efficiencyScore * 0.8,
          utilizationRate,
          reliabilityRate
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10B981',
        borderWidth: 2,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#059669',
        pointRadius: 4
      }
    ]
  };

  // Service Performance - Area chart showing service metrics over time
  const servicePerformanceData = {
    labels: ['6h ago', '4h ago', '2h ago', '1h ago', '30m ago', 'Now'],
    datasets: [
      {
        label: 'Service Quality',
        data: [
          Math.max(0, serviceTrains - 1 + Math.random() * 2),
          Math.max(0, serviceTrains - 0.5 + Math.random() * 1),
          Math.max(0, serviceTrains - 0.5 + Math.random() * 1),
          Math.max(0, serviceTrains - 0.2 + Math.random() * 0.4),
          Math.max(0, serviceTrains - 0.2 + Math.random() * 0.4),
          serviceTrains
        ],
        borderColor: '#6B7280',
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4
      }
    ]
  };

  // Performance overview - Multi-line chart
  const performanceData = {
    labels: [t('avgScore'), t('efficiency'), t('reliability'), t('utilization')],
    datasets: [
      {
        data: [avgScore * 100, efficiencyScore, reliabilityRate, utilizationRate],
        backgroundColor: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'],
        borderColor: ['#7C3AED', '#0891B2', '#059669', '#D97706'],
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
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
          padding: 15,
          font: { size: 10, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    cutout: '70%',
    plugins: {
      ...chartOptions.plugins,
      legend: { ...chartOptions.plugins.legend, position: 'bottom' }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => value + '%',
          font: { size: 9, weight: '600' }
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)', lineWidth: 1 }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 9, weight: '600' } }
      }
    }
  };

  // New chart options for unique visualizations
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { display: false }, x: { display: false } },
    elements: { point: { radius: 2, hoverRadius: 4 }, line: { tension: 0.4 } }
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { display: false }, x: { display: false } }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        display: false,
        ticks: { display: false },
        grid: { display: false },
        angleLines: { display: false }
      }
    }
  };


  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">{t('systemStatus')}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500 font-mono">
              {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              {isCollapsed ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Collapsed View */}
        {isCollapsed ? (
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            {/* Available */}
            <FlipCard
              cardId="available-collapsed"
              frontContent={
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-3 text-center h-full flex flex-col justify-center">
                  <p className="text-xs font-semibold text-green-700 mb-1">{t('available')}</p>
                  <p className="text-xl font-bold text-green-900">{availableTrains}</p>
                </div>
              }
              backContent={
                <div className="bg-gradient-to-r from-green-100 to-green-200 border border-green-300 rounded-lg p-3 h-full flex flex-col relative">
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="text-center mb-2">
                      <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Availability Trend</p>
                    </div>
                    <div className="h-12 mb-2 flex-shrink-0">
                      <Line 
                        data={availabilityTrendData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { display: false, beginAtZero: true },
                            x: { display: false }
                          },
                          elements: { point: { radius: 1 } }
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-center">
                      <div className="bg-white/30 rounded px-1 py-0.5">
                        <div className="text-xs font-bold text-green-800">{Math.round((availableTrains / totalTrains) * 100)}%</div>
                        <div className="text-xs text-green-700">Ready</div>
                      </div>
                      <div className="bg-white/30 rounded px-1 py-0.5">
                        <div className="text-xs font-bold text-green-800">{availableTrains}</div>
                        <div className="text-xs text-green-700">Active</div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePopupOpen('available', {
                        available: availableTrains,
                        percentage: Math.round((availableTrains / totalTrains) * 100)
                      });
                    }}
                    className="absolute top-1 right-1 w-4 h-4 bg-white/80 text-green-700 border border-green-300 rounded-full hover:bg-green-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm text-xs"
                  >
                    →
                  </button>
                </div>
              }
            />

            {/* Maintenance */}
            <FlipCard
              cardId="maintenance-collapsed"
              frontContent={
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-3 text-center h-full flex flex-col justify-center">
                  <p className="text-xs font-semibold text-amber-700 mb-1">{t('maintenance')}</p>
                  <p className="text-xl font-bold text-amber-900">{maintenanceTrains}</p>
                </div>
              }
              backContent={
                <div className="bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300 rounded-lg p-3 h-full flex flex-col relative">
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="text-center mb-2">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Maintenance Types</p>
                    </div>
                    <div className="h-12 mb-2 flex items-center justify-center flex-shrink-0">
                      <div className="w-12 h-12">
                        <Doughnut 
                          data={maintenanceWorkloadData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            cutout: '50%'
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-center">
                      <div className="bg-white/30 rounded px-1 py-0.5">
                        <div className="text-xs font-bold text-amber-800">{Math.round((maintenanceTrains / totalTrains) * 100)}%</div>
                        <div className="text-xs text-amber-700">Fleet</div>
                      </div>
                      <div className="bg-white/30 rounded px-1 py-0.5">
                        <div className="text-xs font-bold text-amber-800">{maintenanceTrains}</div>
                        <div className="text-xs text-amber-700">Units</div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePopupOpen('maintenance', {
                        maintenance: maintenanceTrains,
                        percentage: Math.round((maintenanceTrains / totalTrains) * 100)
                      });
                    }}
                    className="absolute top-1 right-1 w-4 h-4 bg-white/80 text-amber-700 border border-amber-300 rounded-full hover:bg-amber-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm text-xs"
                  >
                    →
                  </button>
                </div>
              }
            />

            {/* Violations */}
            <FlipCard
              cardId="violations-collapsed"
              frontContent={
                <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 rounded-lg p-3 text-center h-full flex flex-col justify-center">
                  <p className="text-xs font-semibold text-rose-700 mb-1">{t('violations')}</p>
                  <p className="text-xl font-bold text-rose-900">{totalViolations}</p>
                </div>
              }
              backContent={
                <div className="bg-gradient-to-r from-rose-100 to-rose-200 border border-rose-300 rounded-lg p-3 h-full flex flex-col relative">
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="text-center mb-2">
                      <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">Violation Types</p>
                    </div>
                    <div className="h-12 mb-2 flex-shrink-0">
                      <Bar 
                        data={violationTypesData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { display: false, beginAtZero: true },
                            x: { display: false }
                          }
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-center">
                      <div className="bg-white/30 rounded px-1 py-0.5">
                        <div className="text-xs font-bold text-rose-800">{totalViolations}</div>
                        <div className="text-xs text-rose-700">Issues</div>
                      </div>
                      <div className="bg-white/30 rounded px-1 py-0.5">
                        <div className="text-xs font-bold text-rose-800">{Math.round((totalViolations / totalTrains) * 100)}%</div>
                        <div className="text-xs text-rose-700">Impact</div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePopupOpen('violations', {
                        total: totalViolations,
                        fitness: constraintViolations.fitnessCertificates || constraintViolations.fitness,
                        jobCards: constraintViolations.jobCardStatus || constraintViolations.jobCards,
                        cleaning: constraintViolations.cleaningDetailing || constraintViolations.cleaning,
                        branding: constraintViolations.brandingPriorities || constraintViolations.branding
                      });
                    }}
                    className="absolute top-1 right-1 w-4 h-4 bg-white/80 text-rose-700 border border-rose-300 rounded-full hover:bg-rose-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm text-xs"
                  >
                    →
                  </button>
                </div>
              }
            />

            {/* Efficiency */}
            <FlipCard
              cardId="efficiency-collapsed"
              frontContent={
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-3 text-center h-full flex flex-col justify-center">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">{t('efficiency')}</p>
                  <p className="text-xl font-bold text-emerald-900">{efficiencyScore}%</p>
                </div>
              }
              backContent={
                <div className="bg-gradient-to-r from-emerald-100 to-emerald-200 border border-emerald-300 rounded-lg p-3 h-full flex flex-col relative">
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="text-center mb-2">
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Performance</p>
                    </div>
                    <div className="h-12 mb-2 flex items-center justify-center flex-shrink-0">
                      <div className="w-12 h-12">
                        <Radar 
                          data={{
                            labels: ['Eff', 'Rel', 'Util'],
                            datasets: [{
                              data: [efficiencyScore, reliabilityRate, utilizationRate],
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              borderColor: '#10B981',
                              borderWidth: 2,
                              pointRadius: 1
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              r: {
                                beginAtZero: true,
                                max: 100,
                                ticks: { display: false },
                                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                                pointLabels: { font: { size: 8 } }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-center">
                      <div className="bg-white/30 rounded px-1 py-0.5">
                        <div className="text-xs font-bold text-emerald-800">{efficiencyScore}%</div>
                        <div className="text-xs text-emerald-700">Avg</div>
                      </div>
                      <div className="bg-white/30 rounded px-1 py-0.5">
                        <div className="text-xs font-bold text-emerald-800">{reliabilityRate.toFixed(0)}%</div>
                        <div className="text-xs text-emerald-700">Uptime</div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePopupOpen('efficiency', {
                        overall: efficiencyScore,
                        reliability: reliabilityRate,
                        utilization: utilizationRate
                      });
                    }}
                    className="absolute top-1 right-1 w-4 h-4 bg-white/80 text-emerald-700 border border-emerald-300 rounded-full hover:bg-emerald-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm text-xs"
                  >
                    →
                  </button>
                </div>
              }
            />
          </div>
        ) : (
          /* Expanded View */
          <div className="space-y-6">
            {/* Main Status Cards */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Available */}
              <FlipCard
                cardId="available-expanded"
                frontContent={
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4 text-center shadow-lg h-full flex flex-col justify-center group">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm font-semibold text-green-700 mb-1">{t('available')}</p>
                    <p className="text-2xl font-bold text-green-900 group-hover:scale-110 transition-transform duration-300">{availableTrains}</p>
                    <div className="text-xs text-green-600 mt-1">
                      {Math.round((availableTrains / totalTrains) * 100)}% of fleet
                    </div>
                  </div>
                }
                backContent={
                  <div className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 rounded-xl p-3 text-center shadow-lg h-full flex flex-col justify-center relative">
                    <div className="flex items-center justify-center mb-1">
                      <Train className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-xs font-semibold text-green-800 mb-1">Available Trains</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-green-700">Ready for deployment</p>
                      <p className="text-xs text-green-700">{Math.round((availableTrains / totalTrains) * 100)}% of fleet</p>
                      <p className="text-xs text-green-700">Operational</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopupOpen('available', {
                          available: availableTrains,
                          percentage: Math.round((availableTrains / totalTrains) * 100)
                        });
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white text-green-700 border border-green-300 rounded-full hover:bg-green-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                }
              />

              {/* Maintenance */}
              <FlipCard
                cardId="maintenance-expanded"
                frontContent={
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-4 text-center shadow-lg h-full flex flex-col justify-center group">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm font-semibold text-amber-700 mb-1">{t('maintenance')}</p>
                    <p className="text-2xl font-bold text-amber-900 group-hover:scale-110 transition-transform duration-300">{maintenanceTrains}</p>
                    <div className="text-xs text-amber-600 mt-1">
                      {Math.round((maintenanceTrains / totalTrains) * 100)}% of fleet
                    </div>
                  </div>
                }
                backContent={
                  <div className="bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-300 rounded-xl p-3 text-center shadow-lg h-full flex flex-col justify-center relative">
                    <div className="flex items-center justify-center mb-1">
                      <Wrench className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-xs font-semibold text-amber-800 mb-1">Maintenance Required</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-amber-700">Under repair/inspection</p>
                      <p className="text-xs text-amber-700">{Math.round((maintenanceTrains / totalTrains) * 100)}% of fleet</p>
                      <p className="text-xs text-amber-700">Offline</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopupOpen('maintenance', {
                          maintenance: maintenanceTrains,
                          percentage: Math.round((maintenanceTrains / totalTrains) * 100)
                        });
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white text-amber-700 border border-amber-300 rounded-full hover:bg-amber-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                }
              />

              {/* Violations */}
              <FlipCard
                cardId="violations-expanded"
                frontContent={
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 rounded-xl p-4 text-center shadow-lg h-full flex flex-col justify-center group">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm font-semibold text-rose-700 mb-1">{t('violations')}</p>
                    <p className="text-2xl font-bold text-rose-900 group-hover:scale-110 transition-transform duration-300">{totalViolations}</p>
                    <div className="text-xs text-rose-600 mt-1">
                      {totalViolations > 0 ? 'Needs attention' : 'All clear'}
                    </div>
                  </div>
                }
                backContent={
                  <div className="bg-gradient-to-br from-rose-100 to-rose-200 border-2 border-rose-300 rounded-xl p-3 text-center shadow-lg h-full flex flex-col justify-center relative">
                    <div className="flex items-center justify-center mb-1">
                      <AlertCircle className="h-5 w-5 text-rose-600" />
                    </div>
                    <p className="text-xs font-semibold text-rose-800 mb-1">Constraint Violations</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-rose-700">Fitness: {constraintViolations.fitnessCertificates}</p>
                      <p className="text-xs text-rose-700">Job Cards: {constraintViolations.jobCardStatus}</p>
                      <p className="text-xs text-rose-700">Cleaning: {constraintViolations.cleaningDetailing}</p>
                      <p className="text-xs text-rose-700">Branding: {constraintViolations.brandingPriorities}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopupOpen('violations', {
                          total: totalViolations,
                          fitness: constraintViolations.fitnessCertificates,
                          jobCards: constraintViolations.jobCardStatus,
                          cleaning: constraintViolations.cleaningDetailing,
                          branding: constraintViolations.brandingPriorities
                        });
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white text-rose-700 border border-rose-300 rounded-full hover:bg-rose-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                }
              />

              {/* Total */}
              <FlipCard
                cardId="total-expanded"
                frontContent={
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-4 text-center shadow-lg h-full flex flex-col justify-center group">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t('total')}</p>
                    <p className="text-2xl font-bold text-slate-900 group-hover:scale-110 transition-transform duration-300">{totalTrains}</p>
                    <div className="text-xs text-slate-600 mt-1">
                      Total fleet size
                    </div>
                  </div>
                }
                backContent={
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 rounded-xl p-3 text-center shadow-lg h-full flex flex-col justify-center relative">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-5 w-5 text-slate-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mb-1">Fleet Overview</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-700">Total: {totalTrains}</p>
                      <p className="text-xs text-slate-700">Available: {availableTrains}</p>
                      <p className="text-xs text-slate-700">Maintenance: {maintenanceTrains}</p>
                      <p className="text-xs text-slate-700">Deployed: {deployedTrains}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopupOpen('fleet', {
                          total: totalTrains,
                          available: availableTrains,
                          maintenance: maintenanceTrains,
                          deployed: deployedTrains,
                          reserve: totalTrains - availableTrains - maintenanceTrains - deployedTrains
                        });
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white text-slate-700 border border-slate-300 rounded-full hover:bg-slate-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                }
              />
            </div>

            {/* Charts Row */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Fleet Status Doughnut Chart */}
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center mb-3">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center justify-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t('fleetStatusDistribution')}
                  </h4>
                </div>
                <div className="h-40">
                  <Doughnut data={fleetStatusData} options={doughnutOptions} />
                </div>
              </div>

              {/* Performance Metrics Bar Chart */}
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center mb-3">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t('performanceOverview')}
                  </h4>
                </div>
                <div className="h-40">
                  <Bar data={performanceData} options={barOptions} />
                </div>
              </div>

              {/* Analytics Insights */}
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center mb-3">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center justify-center gap-2">
                    <Cpu className="h-4 w-4" />
                    {t('systemInsights')}
                  </h4>
                </div>
                <div className="space-y-3">
                  {performanceSummary?.insights?.slice(0, 3).map((insight, index) => {
                    const Icon = insight.type === 'success' ? CheckCircle : 
                                insight.type === 'warning' ? AlertTriangle : Activity;
                    return (
                      <div key={index} className={`p-2 rounded-lg border ${getPriorityColor(insight.priority).split(' ')[2]} ${getPriorityColor(insight.priority).split(' ')[1]}`}>
                        <div className="flex items-center space-x-2">
                          <Icon className={`h-4 w-4 ${getTypeColor(insight.type)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{insight.title}</p>
                            <p className="text-xs text-gray-600 truncate">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Service */}
              <FlipCard
                cardId="service-expanded"
                frontContent={
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-4 text-center shadow-lg h-full flex flex-col justify-center group">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="h-5 w-5 text-slate-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t('service')}</p>
                    <p className="text-xl font-bold text-slate-900 group-hover:scale-110 transition-transform duration-300">{serviceTrains}</p>
                    <div className="text-xs text-slate-600 mt-1">
                      Active services
                    </div>
                  </div>
                }
                backContent={
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 rounded-xl p-3 text-center shadow-lg h-full flex flex-col justify-center relative">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-5 w-5 text-slate-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mb-1">Service Details</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-700">Active: {serviceTrains}</p>
                      <p className="text-xs text-slate-700">Target: 14 trains</p>
                      <p className="text-xs text-slate-700">Operational</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopupOpen('service', {
                          active: serviceTrains,
                          target: 14,
                          percentage: Math.round((serviceTrains / 14) * 100)
                        });
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white text-slate-700 border border-slate-300 rounded-full hover:bg-slate-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                }
              />

              {/* Efficiency */}
              <FlipCard
                cardId="efficiency-expanded"
                frontContent={
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl p-4 text-center shadow-lg h-full flex flex-col justify-center group">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-700 mb-1">{t('efficiency')}</p>
                    <p className="text-xl font-bold text-emerald-900 group-hover:scale-110 transition-transform duration-300">{efficiencyScore}%</p>
                    <div className="text-xs text-emerald-600 mt-1">
                      System efficiency
                    </div>
                  </div>
                }
                backContent={
                  <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-emerald-300 rounded-xl p-3 text-center shadow-lg h-full flex flex-col justify-center relative">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-xs font-semibold text-emerald-800 mb-1">Efficiency Metrics</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-emerald-700">Overall: {efficiencyScore}%</p>
                      <p className="text-xs text-emerald-700">Reliability: {reliabilityRate.toFixed(1)}%</p>
                      <p className="text-xs text-emerald-700">Utilization: {utilizationRate.toFixed(1)}%</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopupOpen('efficiency', {
                          overall: efficiencyScore,
                          reliability: reliabilityRate,
                          utilization: utilizationRate
                        });
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white text-emerald-700 border border-emerald-300 rounded-full hover:bg-emerald-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                }
              />

              {/* Cost */}
              <FlipCard
                cardId="cost-expanded"
                frontContent={
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-4 text-center shadow-lg h-full flex flex-col justify-center group">
                    <div className="flex items-center justify-center mb-2">
                      <Database className="h-5 w-5 text-indigo-600" />
                    </div>
                    <p className="text-sm font-semibold text-indigo-700 mb-1">{t('cost')}</p>
                    <p className="text-xl font-bold text-indigo-900 group-hover:scale-110 transition-transform duration-300">₹11,240M</p>
                    <div className="text-xs text-indigo-600 mt-1">
                      Total cost
                    </div>
                  </div>
                }
                backContent={
                  <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 border-2 border-indigo-300 rounded-xl p-3 text-center shadow-lg h-full flex flex-col justify-center relative">
                    <div className="flex items-center justify-center mb-1">
                      <IndianRupee className="h-5 w-5 text-indigo-600" />
                    </div>
                    <p className="text-xs font-semibold text-indigo-800 mb-1">Cost Breakdown</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-indigo-700">Total: ₹11,240M</p>
                      <p className="text-xs text-indigo-700">Operational: ₹9,500M</p>
                      <p className="text-xs text-indigo-700">Maintenance: ₹1,740M</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopupOpen('cost', {
                          total: '₹11,240M',
                          operational: '₹9,500M',
                          maintenance: '₹1,740M',
                          energy: '₹1,200M'
                        });
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white text-indigo-700 border border-indigo-300 rounded-full hover:bg-indigo-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                }
              />

              {/* Reliability */}
              <FlipCard
                cardId="reliability-expanded"
                frontContent={
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-xl p-4 text-center shadow-lg h-full flex flex-col justify-center group">
                    <div className="flex items-center justify-center mb-2">
                      <Cpu className="h-5 w-5 text-cyan-600" />
                    </div>
                    <p className="text-sm font-semibold text-cyan-700 mb-1">{t('reliability')}</p>
                    <p className="text-xl font-bold text-cyan-900 group-hover:scale-110 transition-transform duration-300">{reliabilityScore}</p>
                    <div className="text-xs text-cyan-600 mt-1">
                      {reliabilityRate.toFixed(1)}% reliable
                    </div>
                  </div>
                }
                backContent={
                  <div className="bg-gradient-to-br from-cyan-100 to-cyan-200 border-2 border-cyan-300 rounded-xl p-3 text-center shadow-lg h-full flex flex-col justify-center relative">
                    <div className="flex items-center justify-center mb-1">
                      <Shield className="h-5 w-5 text-cyan-600" />
                    </div>
                    <p className="text-xs font-semibold text-cyan-800 mb-1">Reliability Stats</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-cyan-700">High performers: {reliabilityScore}</p>
                      <p className="text-xs text-cyan-700">Rate: {reliabilityRate.toFixed(1)}%</p>
                      <p className="text-xs text-cyan-700">Uptime: 99.2%</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopupOpen('reliability', {
                          highPerformers: reliabilityScore,
                          rate: reliabilityRate,
                          total: totalTrains,
                          uptime: 99.2
                        });
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white text-cyan-700 border border-cyan-300 rounded-full hover:bg-cyan-700 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Popup Component */}
      <SystemStatusPopup
        isOpen={popupOpen}
        onClose={handlePopupClose}
        cardType={popupData?.cardType}
        data={popupData?.data}
        trains={trains}
      />
    </div>
  );
};

export default SystemStatusAnalyticsBanner;

