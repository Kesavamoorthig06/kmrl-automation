import React from 'react';
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

const SystemStatusVisualization = ({ metrics, trends, t }) => {
  // Fleet Status Doughnut Chart
  const fleetStatusData = {
    labels: [t('available'), t('maintenance'), t('deployed'), t('unavailable')],
    datasets: [
      {
        data: [
          metrics.availableTrains || 0,
          metrics.maintenanceTrains || 0,
          metrics.deployedTrains || 0,
          (metrics.totalTrains || 0) - (metrics.availableTrains || 0) - (metrics.maintenanceTrains || 0) - (metrics.deployedTrains || 0)
        ],
        backgroundColor: [
          '#10B981', // Green for available
          '#F59E0B', // Amber for maintenance
          '#3B82F6', // Blue for deployed
          '#EF4444'  // Red for unavailable
        ],
        borderColor: [
          '#059669',
          '#D97706',
          '#2563EB',
          '#DC2626'
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const fleetStatusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: t('fleetStatusDistribution'),
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%'
  };

  // Performance Metrics Bar Chart
  const performanceData = {
    labels: [t('avgScore'), t('efficiency'), t('reliability'), t('utilization')],
    datasets: [
      {
        label: t('performanceMetrics'),
        data: [
          metrics.avgScore || 0,
          metrics.efficiencyScore || 0,
          metrics.reliabilityRate || 0,
          metrics.utilizationRate || 0
        ],
        backgroundColor: [
          '#8B5CF6', // Purple
          '#06B6D4', // Cyan
          '#10B981', // Green
          '#F59E0B'  // Amber
        ],
        borderColor: [
          '#7C3AED',
          '#0891B2',
          '#059669',
          '#D97706'
        ],
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  const performanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: t('performanceOverview'),
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: '#E5E7EB'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Constraint Violations Chart
  const violationsData = {
    labels: [
      t('fitnessCertificates'),
      t('jobCardStatus'),
      t('cleaningDetailing'),
      t('brandingPriorities')
    ],
    datasets: [
      {
        label: t('violations'),
        data: [
          metrics.constraintViolations?.fitnessCertificates || 0,
          metrics.constraintViolations?.jobCardStatus || 0,
          metrics.constraintViolations?.cleaningDetailing || 0,
          metrics.constraintViolations?.brandingPriorities || 0
        ],
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  };

  const violationsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: t('constraintViolations'),
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: '#E5E7EB'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Trend Analysis Line Chart
  const trendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: t('availability'),
        data: [85, 78, 82, metrics.utilizationRate || 0],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: t('performance'),
        data: [75, 80, 78, metrics.avgScore || 0],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: t('efficiency'),
        data: [70, 75, 72, metrics.efficiencyScore || 0],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: t('performanceTrends'),
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: '#E5E7EB'
        }
      },
      x: {
        grid: {
          color: '#E5E7EB'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Status Doughnut Chart */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="h-64">
            <Doughnut data={fleetStatusData} options={fleetStatusOptions} />
          </div>
        </div>

        {/* Performance Metrics Bar Chart */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="h-64">
            <Bar data={performanceData} options={performanceOptions} />
          </div>
        </div>
      </div>

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Constraint Violations Chart */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="h-64">
            <Bar data={violationsData} options={violationsOptions} />
          </div>
        </div>

        {/* Performance Trends Line Chart */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="h-64">
            <Line data={trendData} options={trendOptions} />
          </div>
        </div>
      </div>

      {/* Key Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{metrics.totalTrains || 0}</div>
          <div className="text-sm opacity-90">{t('totalFleet')}</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{metrics.availableTrains || 0}</div>
          <div className="text-sm opacity-90">{t('readyForDeployment')}</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{metrics.efficiencyScore || 0}%</div>
          <div className="text-sm opacity-90">{t('systemEfficiency')}</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{metrics.totalViolations || 0}</div>
          <div className="text-sm opacity-90">{t('activeViolations')}</div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusVisualization;

