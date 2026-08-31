import React from 'react';
import { X, Train, Wrench, AlertCircle, Users, Clock, Target, DollarSign, Shield, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, IndianRupee } from 'lucide-react';
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';

const SystemStatusPopup = ({ isOpen, onClose, cardType, data, trains = [] }) => {
  if (!isOpen) return null;

  const getCardDetails = () => {
    switch (cardType) {
      case 'available':
        return {
          title: 'Available Trains',
          icon: <Train className="h-8 w-8 text-green-600" />,
          color: 'green',
          overview: {
            total: data?.available || 0,
            percentage: data?.percentage || 0,
            status: 'Operational',
            description: 'Trains ready for immediate deployment and passenger service'
          },
          insights: [
            { label: 'Peak Hours Ready', value: Math.floor((data?.available || 0) * 0.8), trend: 'up' },
            { label: 'Maintenance Due Soon', value: Math.floor((data?.available || 0) * 0.15), trend: 'down' },
            { label: 'Emergency Reserve', value: Math.floor((data?.available || 0) * 0.05), trend: 'stable' }
          ],
          metrics: [
            { label: 'Average Uptime', value: '99.2%', status: 'excellent' },
            { label: 'Response Time', value: '2.3 min', status: 'good' },
            { label: 'Passenger Capacity', value: '1,200', status: 'optimal' }
          ],
          chartData: {
            type: 'line',
            data: {
              labels: ['6h ago', '4h ago', '2h ago', '1h ago', '30m ago', 'Now'],
              datasets: [
                {
                  label: 'Available Trains',
                  data: [
                    Math.max(0, (data?.available || 0) - 2 + Math.random() * 4),
                    Math.max(0, (data?.available || 0) - 1 + Math.random() * 2),
                    Math.max(0, (data?.available || 0) - 1 + Math.random() * 2),
                    Math.max(0, (data?.available || 0) - 0.5 + Math.random() * 1),
                    Math.max(0, (data?.available || 0) - 0.5 + Math.random() * 1),
                    data?.available || 0
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
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                  grid: { display: false }
                }
              }
            }
          }
        };
      
      case 'maintenance':
        return {
          title: 'Maintenance Status',
          icon: <Wrench className="h-8 w-8 text-amber-600" />,
          color: 'amber',
          overview: {
            total: data?.maintenance || 0,
            percentage: data?.percentage || 0,
            status: 'Under Repair',
            description: 'Trains currently undergoing scheduled maintenance and inspection'
          },
          insights: [
            { label: 'Scheduled Maintenance', value: Math.floor((data?.maintenance || 0) * 0.6), trend: 'stable' },
            { label: 'Emergency Repairs', value: Math.floor((data?.maintenance || 0) * 0.3), trend: 'up' },
            { label: 'Preventive Checks', value: Math.floor((data?.maintenance || 0) * 0.1), trend: 'down' }
          ],
          metrics: [
            { label: 'Avg Repair Time', value: '4.2 hours', status: 'good' },
            { label: 'Parts Availability', value: '94%', status: 'excellent' },
            { label: 'Technician Efficiency', value: '87%', status: 'good' }
          ],
          chartData: {
            type: 'doughnut',
            data: {
              labels: ['Scheduled', 'Emergency', 'Preventive', 'Overdue'],
              datasets: [
                {
                  data: [
                    Math.floor((data?.maintenance || 0) * 0.6),
                    Math.floor((data?.maintenance || 0) * 0.2),
                    Math.floor((data?.maintenance || 0) * 0.15),
                    Math.floor((data?.maintenance || 0) * 0.05)
                  ],
                  backgroundColor: ['#F59E0B', '#EF4444', '#3B82F6', '#6B7280'],
                  borderColor: ['#D97706', '#DC2626', '#2563EB', '#4B5563'],
                  borderWidth: 2
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { 
                  position: 'bottom',
                  labels: { padding: 20, usePointStyle: true }
                }
              }
            }
          }
        };
      
      case 'violations':
        return {
          title: 'Constraint Violations',
          icon: <AlertCircle className="h-8 w-8 text-rose-600" />,
          color: 'rose',
          overview: {
            total: data?.total || 0,
            percentage: data?.percentage || 0,
            status: 'Needs Attention',
            description: 'System constraints and compliance issues requiring immediate resolution'
          },
          insights: [
            { label: 'Fitness Certificate Issues', value: data?.fitness || 0, trend: 'up' },
            { label: 'Job Card Violations', value: data?.jobCards || 0, trend: 'stable' },
            { label: 'Cleaning Standards', value: data?.cleaning || 0, trend: 'down' },
            { label: 'Branding Priorities', value: data?.branding || 0, trend: 'up' }
          ],
          metrics: [
            { label: 'Resolution Rate', value: '78%', status: 'good' },
            { label: 'Avg Resolution Time', value: '6.5 hours', status: 'fair' },
            { label: 'Compliance Score', value: '82%', status: 'good' }
          ],
          chartData: {
            type: 'bar',
            data: {
              labels: ['Fitness', 'Job Cards', 'Cleaning', 'Branding'],
              datasets: [
                {
                  label: 'Critical',
                  data: [
                    Math.floor((data?.fitness || 0) * 0.3),
                    Math.floor((data?.jobCards || 0) * 0.2),
                    Math.floor((data?.cleaning || 0) * 0.1),
                    Math.floor((data?.branding || 0) * 0.4)
                  ],
                  backgroundColor: '#EF4444',
                  borderColor: '#DC2626',
                  borderWidth: 1
                },
                {
                  label: 'Warning',
                  data: [
                    Math.floor((data?.fitness || 0) * 0.7),
                    Math.floor((data?.jobCards || 0) * 0.8),
                    Math.floor((data?.cleaning || 0) * 0.9),
                    Math.floor((data?.branding || 0) * 0.6)
                  ],
                  backgroundColor: '#F59E0B',
                  borderColor: '#D97706',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { 
                  position: 'top',
                  labels: { padding: 20, usePointStyle: true }
                }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                  grid: { display: false }
                }
              }
            }
          }
        };
      
      case 'fleet':
        return {
          title: 'Fleet Overview',
          icon: <Users className="h-8 w-8 text-slate-600" />,
          color: 'slate',
          overview: {
            total: data?.total || 0,
            percentage: 100,
            status: 'Complete Fleet',
            description: 'Comprehensive overview of the entire metro train fleet status'
          },
          insights: [
            { label: 'Available', value: data?.available || 0, trend: 'stable' },
            { label: 'Maintenance', value: data?.maintenance || 0, trend: 'down' },
            { label: 'Deployed', value: data?.deployed || 0, trend: 'up' },
            { label: 'Reserve', value: data?.reserve || 0, trend: 'stable' }
          ],
          metrics: [
            { label: 'Fleet Utilization', value: '89%', status: 'excellent' },
            { label: 'Service Coverage', value: '95%', status: 'excellent' },
            { label: 'Operational Efficiency', value: '91%', status: 'excellent' }
          ],
          chartData: {
            type: 'doughnut',
            data: {
              labels: ['Available', 'Maintenance', 'Deployed', 'Reserve'],
              datasets: [
                {
                  data: [
                    data?.available || 0,
                    data?.maintenance || 0,
                    data?.deployed || 0,
                    data?.reserve || 0
                  ],
                  backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#6B7280'],
                  borderColor: ['#059669', '#D97706', '#2563EB', '#4B5563'],
                  borderWidth: 2
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { 
                  position: 'bottom',
                  labels: { padding: 20, usePointStyle: true }
                }
              }
            }
          }
        };
      
      case 'service':
        return {
          title: 'Service Operations',
          icon: <Clock className="h-8 w-8 text-slate-600" />,
          color: 'slate',
          overview: {
            total: data?.active || 0,
            percentage: data?.percentage || 0,
            status: 'Operational',
            description: 'Active service operations and timing management'
          },
          insights: [
            { label: 'Peak Services', value: Math.floor((data?.active || 0) * 0.7), trend: 'up' },
            { label: 'Off-Peak Services', value: Math.floor((data?.active || 0) * 0.3), trend: 'stable' },
            { label: 'Emergency Services', value: Math.floor((data?.active || 0) * 0.1), trend: 'down' }
          ],
          metrics: [
            { label: 'On-Time Performance', value: '96.8%', status: 'excellent' },
            { label: 'Service Frequency', value: '3.2 min', status: 'optimal' },
            { label: 'Passenger Satisfaction', value: '94%', status: 'excellent' }
          ],
          chartData: {
            type: 'line',
            data: {
              labels: ['6h ago', '4h ago', '2h ago', '1h ago', '30m ago', 'Now'],
              datasets: [
                {
                  label: 'Service Quality',
                  data: [
                    Math.max(0, (data?.active || 0) - 1 + Math.random() * 2),
                    Math.max(0, (data?.active || 0) - 0.5 + Math.random() * 1),
                    Math.max(0, (data?.active || 0) - 0.5 + Math.random() * 1),
                    Math.max(0, (data?.active || 0) - 0.2 + Math.random() * 0.4),
                    Math.max(0, (data?.active || 0) - 0.2 + Math.random() * 0.4),
                    data?.active || 0
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
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { 
                  beginAtZero: true,
                  grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                  grid: { display: false }
                }
              }
            }
          }
        };
      
      case 'efficiency':
        return {
          title: 'System Efficiency',
          icon: <Target className="h-8 w-8 text-emerald-600" />,
          color: 'emerald',
          overview: {
            total: data?.overall || 0,
            percentage: data?.overall || 0,
            status: 'High Performance',
            description: 'Overall system efficiency and performance metrics'
          },
          insights: [
            { label: 'Overall Efficiency', value: `${data?.overall || 0}%`, trend: 'up' },
            { label: 'Reliability Rate', value: `${data?.reliability || 0}%`, trend: 'stable' },
            { label: 'Utilization Rate', value: `${data?.utilization || 0}%`, trend: 'up' },
            { label: 'Energy Efficiency', value: '92%', trend: 'up' },
            { label: 'Operational Efficiency', value: '89%', trend: 'stable' },
            { label: 'Resource Utilization', value: '87%', trend: 'up' }
          ],
          metrics: [
            { label: 'Reliability Rate', value: `${data?.reliability || 0}%`, status: 'excellent' },
            { label: 'Utilization Rate', value: `${data?.utilization || 0}%`, status: 'good' },
            { label: 'Performance Index', value: '94.2', status: 'excellent' }
          ],
          chartData: {
            type: 'line',
            data: {
              labels: ['6h ago', '4h ago', '2h ago', '1h ago', '30m ago', 'Now'],
              datasets: [
                {
                  label: 'Efficiency Trend',
                  data: [
                    Math.max(0, (data?.overall || 0) - 5 + Math.random() * 10),
                    Math.max(0, (data?.overall || 0) - 3 + Math.random() * 6),
                    Math.max(0, (data?.overall || 0) - 2 + Math.random() * 4),
                    Math.max(0, (data?.overall || 0) - 1 + Math.random() * 2),
                    Math.max(0, (data?.overall || 0) - 0.5 + Math.random() * 1),
                    data?.overall || 0
                  ],
                  borderColor: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12, weight: '600' }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    font: { size: 11, weight: '600' },
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                },
                x: {
                  ticks: {
                    font: { size: 11, weight: '600' }
                  }
                }
              }
            }
          }
        };
      
      case 'cost':
        return {
          title: 'Cost Analysis',
          icon: <DollarSign className="h-8 w-8 text-indigo-600" />,
          color: 'indigo',
          overview: {
            total: '₹11,240M',
            percentage: 100,
            status: 'Within Budget',
            description: 'Comprehensive cost breakdown and financial analysis'
          },
          insights: [
            { label: 'Operational Costs', value: '₹9,500M', trend: 'stable' },
            { label: 'Maintenance Costs', value: '₹1,740M', trend: 'down' },
            { label: 'Energy Costs', value: '₹1,200M', trend: 'up' },
            { label: 'Infrastructure', value: '₹2,100M', trend: 'stable' },
            { label: 'Personnel', value: '₹3,400M', trend: 'up' },
            { label: 'Technology', value: '₹1,800M', trend: 'down' }
          ],
          metrics: [
            { label: 'Cost per Trip', value: '₹45.2', status: 'good' },
            { label: 'Budget Utilization', value: '94%', status: 'excellent' },
            { label: 'ROI', value: '18.5%', status: 'excellent' }
          ],
          chartData: {
            type: 'bar',
            data: {
              labels: ['Operational', 'Maintenance', 'Energy', 'Infrastructure', 'Personnel', 'Technology'],
              datasets: [
                {
                  label: 'Cost Breakdown (₹M)',
                  data: [9500, 1740, 1200, 2100, 3400, 1800],
                  backgroundColor: [
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
                  ],
                  borderColor: [
                    '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'
                  ],
                  borderWidth: 2
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12, weight: '600' }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    font: { size: 11, weight: '600' },
                    callback: function(value) {
                      return '₹' + value + 'M';
                    }
                  }
                },
                x: {
                  ticks: {
                    font: { size: 11, weight: '600' }
                  }
                }
              }
            }
          }
        };
      
      case 'reliability':
        return {
          title: 'Reliability Metrics',
          icon: <Shield className="h-8 w-8 text-cyan-600" />,
          color: 'cyan',
          overview: {
            total: data?.highPerformers || 0,
            percentage: data?.rate || 0,
            status: 'Highly Reliable',
            description: 'System reliability and performance consistency metrics'
          },
          insights: [
            { label: 'High Performers', value: data?.highPerformers || 0, trend: 'up' },
            { label: 'Average Performers', value: Math.floor((data?.total || 0) * 0.3), trend: 'stable' },
            { label: 'Under Performers', value: Math.floor((data?.total || 0) * 0.05), trend: 'down' }
          ],
          metrics: [
            { label: 'Uptime', value: '99.2%', status: 'excellent' },
            { label: 'MTBF', value: '1,250 hrs', status: 'excellent' },
            { label: 'MTTR', value: '2.1 hrs', status: 'good' }
          ],
          chartData: {
            type: 'radar',
            data: {
              labels: ['Energy', 'Operations', 'Maintenance', 'Utilization', 'Reliability'],
              datasets: [
                {
                  label: 'Current Performance',
                  data: [
                    (data?.rate || 0) * 0.9,
                    (data?.rate || 0) * 1.1,
                    (data?.rate || 0) * 0.8,
                    (data?.rate || 0) * 0.95,
                    data?.rate || 0
                  ],
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  borderColor: '#10B981',
                  borderWidth: 2,
                  pointBackgroundColor: '#10B981',
                  pointBorderColor: '#059669',
                  pointRadius: 4
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { display: false },
                  grid: { color: 'rgba(0, 0, 0, 0.1)' },
                  angleLines: { color: 'rgba(0, 0, 0, 0.1)' }
                }
              }
            }
          }
        };
      
      default:
        return null;
    }
  };

  const cardDetails = getCardDetails();
  if (!cardDetails) return null;

  // Chart data for visualizations
  const getChartData = () => {
    const baseData = {
      labels: cardDetails.insights.map(insight => insight.label),
      datasets: [{
        data: cardDetails.insights.map(insight => insight.value),
        backgroundColor: [
          '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#06B6D4'
        ],
        borderColor: [
          '#059669', '#D97706', '#DC2626', '#2563EB', '#7C3AED', '#0891B2'
        ],
        borderWidth: 2
      }]
    };

    return baseData;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 10, weight: '600' }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${cardDetails.color}-50 to-${cardDetails.color}-100 border-b border-${cardDetails.color}-200 p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {cardDetails.icon}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{cardDetails.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{cardDetails.overview.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`bg-${cardDetails.color}-50 border border-${cardDetails.color}-200 rounded-lg p-4`}>
                <p className="text-sm font-medium text-gray-600">Total Count</p>
                <p className={`text-3xl font-bold text-${cardDetails.color}-600`}>
                  {typeof cardDetails.overview.total === 'string' ? cardDetails.overview.total : cardDetails.overview.total}
                </p>
              </div>
              <div className={`bg-${cardDetails.color}-50 border border-${cardDetails.color}-200 rounded-lg p-4`}>
                <p className="text-sm font-medium text-gray-600">Percentage</p>
                <p className={`text-3xl font-bold text-${cardDetails.color}-600`}>
                  {cardDetails.overview.percentage}%
                </p>
              </div>
              <div className={`bg-${cardDetails.color}-50 border border-${cardDetails.color}-200 rounded-lg p-4`}>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className={`text-lg font-semibold text-${cardDetails.color}-600`}>
                  {cardDetails.overview.status}
                </p>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Detailed Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cardDetails.insights.map((insight, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">{insight.label}</p>
                    {getTrendIcon(insight.trend)}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{insight.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visualization */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance Visualization
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="h-64">
                {cardDetails.chartData ? (
                  cardDetails.chartData.type === 'line' ? (
                    <Line data={cardDetails.chartData.data} options={cardDetails.chartData.options} />
                  ) : cardDetails.chartData.type === 'bar' ? (
                    <Bar data={cardDetails.chartData.data} options={cardDetails.chartData.options} />
                  ) : cardDetails.chartData.type === 'radar' ? (
                    <Radar data={cardDetails.chartData.data} options={cardDetails.chartData.options} />
                  ) : (
                    <Doughnut data={cardDetails.chartData.data} options={cardDetails.chartData.options} />
                  )
                ) : (
                  <Doughnut data={getChartData()} options={chartOptions} />
                )}
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Key Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cardDetails.metrics.map((metric, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getStatusColor(metric.status)}`}>
                  <p className="text-sm font-medium text-gray-700 mb-1">{metric.label}</p>
                  <p className="text-xl font-bold">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusPopup;
