import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Activity, Zap, Target } from 'lucide-react';
import KMRLAnalytics, { formatNumber, formatCurrency, formatPercentage, getTrendIcon, getPriorityColor, getTypeColor } from '../../utils/analytics';
import { useTranslation } from '../../hooks/useTranslation.js';

const SystemStatusMetrics = ({ realTimeData, optimizationResults, mlData }) => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [performanceSummary, setPerformanceSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize analytics with train data
  useEffect(() => {
    const trains = mlData || (realTimeData?.trains) || [];
    
    if (trains.length === 0) {
      setIsLoading(false);
      return;
    }

    // Initialize analytics engine
    const analyticsEngine = new KMRLAnalytics();
    analyticsEngine.initialize(trains);
    
    setAnalytics(analyticsEngine);
    setPerformanceSummary(analyticsEngine.getPerformanceSummary());
    setIsLoading(false);

  }, [mlData, realTimeData]);

  if (isLoading || !performanceSummary) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">{t('systemInsights')}</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('analyzingSystemMetrics')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">{t('systemInsightsAnalytics')}</h3>
        </div>
        <div className="text-sm text-gray-500">
          {performanceSummary.totalInsights} {t('insightsGenerated')}
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-900">{performanceSummary.metrics.availableTrains || 0}</div>
          <div className="text-sm text-blue-700">{t('available')}</div>
          <div className="text-xs text-blue-600">
            {getTrendIcon(performanceSummary.trends.availability)} {performanceSummary.trends.availability?.percentage}%
          </div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-900">{formatPercentage(performanceSummary.metrics.efficiencyScore)}</div>
          <div className="text-sm text-green-700">{t('efficiency')}</div>
          <div className="text-xs text-green-600">
            {getTrendIcon(performanceSummary.trends.efficiency)} {performanceSummary.trends.efficiency?.percentage}%
          </div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-900">{performanceSummary.metrics.maintenanceTrains || 0}</div>
          <div className="text-sm text-yellow-700">{t('maintenance')}</div>
          <div className="text-xs text-yellow-600">
            {getTrendIcon(performanceSummary.trends.maintenance)} {performanceSummary.trends.maintenance?.percentage}%
          </div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-900">{performanceSummary.metrics.totalViolations || 0}</div>
          <div className="text-sm text-red-700">{t('violations')}</div>
          <div className="text-xs text-red-600">
            {getTrendIcon(performanceSummary.trends.violations)} {performanceSummary.trends.violations?.percentage}%
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xl font-bold text-purple-900">{formatNumber(performanceSummary.metrics.totalMileage)} km</div>
          <div className="text-sm text-purple-700">{t('totalMileage')}</div>
        </div>
        <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="text-xl font-bold text-indigo-900">{formatCurrency(performanceSummary.metrics.costEstimate)}M</div>
          <div className="text-sm text-indigo-700">{t('estimatedCost')}</div>
        </div>
        <div className="text-center p-3 bg-teal-50 rounded-lg border border-teal-200">
          <div className="text-xl font-bold text-teal-900">{performanceSummary.metrics.carbonFootprint} tons</div>
          <div className="text-sm text-teal-700">{t('co2Footprint')}</div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {performanceSummary.insights.map((insight, index) => {
          const Icon = insight.type === 'success' ? CheckCircle : 
                      insight.type === 'warning' ? AlertTriangle :
                      insight.type === 'info' ? Activity : TrendingUp;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getPriorityColor(insight.priority).split(' ')[2]} ${getPriorityColor(insight.priority).split(' ')[1]} hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${getTypeColor(insight.type)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                        insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {insight.priority === 'high' ? t('high') : insight.priority === 'medium' ? t('medium') : t('low')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(insight.confidence * 100)}% {t('confidence')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                  <p className="text-xs text-gray-600 italic">💡 {insight.recommendation}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 capitalize">{insight.category}</span>
                    <span className="text-xs text-gray-500">{insight.impact} {t('impact')}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">{t('performanceTrendAnalysis')}</h4>
        <div className="h-32 bg-white rounded border border-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{t('performanceVisualization')}</p>
            <p className="text-xs">{t('chartIntegration')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusMetrics;
