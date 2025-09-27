/**
 * Analytics Library for KMRL System Status Metrics
 * Provides advanced data processing and visualization utilities
 */

class KMRLAnalytics {
  constructor() {
    this.data = null;
    this.metrics = {};
    this.trends = {};
    this.insights = [];
  }

  /**
   * Initialize analytics with train data
   * @param {Array} trainData - Array of train objects
   */
  initialize(trainData) {
    this.data = trainData;
    this.calculateMetrics();
    this.analyzeTrends();
    this.generateInsights();
  }

  /**
   * Calculate comprehensive metrics from train data
   */
  calculateMetrics() {
    if (!this.data || this.data.length === 0) return;

    const trains = this.data;
    const totalTrains = trains.length;

    // Basic counts
    const availableTrains = trains.filter(t => t.status === 'Available').length;
    const maintenanceTrains = trains.filter(t => t.status === 'Unavailable').length;
    const deployedTrains = trains.filter(t => t.status === 'Deployed').length;

    // Performance metrics
    const scores = trains.map(t => t.score || 0);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / totalTrains;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Mileage metrics
    const mileages = trains.map(t => t.mileage || 0);
    const avgMileage = mileages.reduce((sum, mileage) => sum + mileage, 0) / totalTrains;
    const totalMileage = mileages.reduce((sum, mileage) => sum + mileage, 0);

    // Constraint violations
    const constraintViolations = {
      fitnessCertificates: trains.filter(t => !t.fitnessValid).length,
      jobCardStatus: trains.filter(t => t.jobCardStatus !== 'Clear').length,
      cleaningDetailing: trains.filter(t => t.cleaningScore < 0.8).length,
      brandingPriorities: trains.filter(t => t.brandingScore < 0.7).length
    };

    const totalViolations = Object.values(constraintViolations).reduce((sum, count) => sum + count, 0);

    // Efficiency calculations
    const efficiencyScore = Math.round(avgScore * 100);
    const reliabilityScore = trains.filter(t => t.score > 0.7).length;
    const reliabilityRate = (reliabilityScore / totalTrains) * 100;

    // Utilization metrics
    const utilizationRate = (availableTrains / totalTrains) * 100;
    const maintenanceRate = (maintenanceTrains / totalTrains) * 100;

    this.metrics = {
      // Basic counts
      totalTrains,
      availableTrains,
      maintenanceTrains,
      deployedTrains,
      
      // Performance
      avgScore: avgScore * 100,
      maxScore: maxScore * 100,
      minScore: minScore * 100,
      scoreVariance: this.calculateVariance(scores),
      
      // Mileage
      avgMileage: Math.round(avgMileage),
      totalMileage: Math.round(totalMileage),
      maxMileage: Math.max(...mileages),
      minMileage: Math.min(...mileages),
      
      // Constraints
      constraintViolations,
      totalViolations,
      violationRate: (totalViolations / totalTrains) * 100,
      
      // Efficiency
      efficiencyScore,
      reliabilityScore,
      reliabilityRate,
      utilizationRate,
      maintenanceRate,
      
      // Additional metrics
      serviceTrains: 14,
      costEstimate: this.calculateCostEstimate(totalMileage, totalTrains),
      carbonFootprint: this.calculateCarbonFootprint(totalMileage)
    };
  }

  /**
   * Analyze trends and patterns in the data
   */
  analyzeTrends() {
    if (!this.data || this.data.length === 0) return;

    const metrics = this.metrics;
    
    // Trend calculations (simulated for now - would use historical data in real implementation)
    this.trends = {
      availability: this.calculateTrend(metrics.availableTrains, metrics.totalTrains, 0.8),
      performance: this.calculateTrend(metrics.avgScore, 100, 0.7),
      maintenance: this.calculateTrend(metrics.maintenanceTrains, metrics.totalTrains, 0.1),
      violations: this.calculateTrend(metrics.totalViolations, metrics.totalTrains, 0.05),
      efficiency: this.calculateTrend(metrics.efficiencyScore, 100, 0.8),
      reliability: this.calculateTrend(metrics.reliabilityRate, 100, 0.7)
    };
  }

  /**
   * Generate intelligent insights based on metrics and trends
   */
  generateInsights() {
    this.insights = [];
    const metrics = this.metrics;
    const trends = this.trends;

    // Availability insights
    if (metrics.utilizationRate >= 80) {
      this.insights.push({
        type: 'success',
        priority: 'low',
        category: 'availability',
        title: 'Optimal Fleet Utilization',
        description: `${metrics.availableTrains} trains ready (${metrics.utilizationRate.toFixed(1)}% utilization)`,
        recommendation: 'Consider expanding service capacity or optimizing schedules',
        impact: 'high',
        confidence: 0.9
      });
    } else if (metrics.utilizationRate < 60) {
      this.insights.push({
        type: 'warning',
        priority: 'high',
        category: 'availability',
        title: 'Low Fleet Utilization',
        description: `Only ${metrics.availableTrains} trains available (${metrics.utilizationRate.toFixed(1)}% utilization)`,
        recommendation: 'Accelerate maintenance processes and review deployment strategies',
        impact: 'high',
        confidence: 0.85
      });
    }

    // Performance insights
    if (metrics.avgScore >= 85) {
      this.insights.push({
        type: 'success',
        priority: 'low',
        category: 'performance',
        title: 'Excellent Performance Metrics',
        description: `Average score of ${metrics.avgScore.toFixed(1)}% indicates superior train condition`,
        recommendation: 'Maintain current maintenance standards and consider performance-based scheduling',
        impact: 'medium',
        confidence: 0.95
      });
    } else if (metrics.avgScore < 70) {
      this.insights.push({
        type: 'warning',
        priority: 'high',
        category: 'performance',
        title: 'Performance Degradation Detected',
        description: `Average score of ${metrics.avgScore.toFixed(1)}% requires immediate attention`,
        recommendation: 'Implement enhanced maintenance protocols and quality assurance checks',
        impact: 'high',
        confidence: 0.9
      });
    }

    // Maintenance insights
    if (metrics.maintenanceRate > 30) {
      this.insights.push({
        type: 'info',
        priority: 'medium',
        category: 'maintenance',
        title: 'High Maintenance Load',
        description: `${metrics.maintenanceTrains} trains under maintenance (${metrics.maintenanceRate.toFixed(1)}% of fleet)`,
        recommendation: 'Optimize maintenance scheduling and resource allocation',
        impact: 'medium',
        confidence: 0.8
      });
    }

    // Constraint violation insights
    if (metrics.totalViolations > 0) {
      this.insights.push({
        type: 'warning',
        priority: 'high',
        category: 'compliance',
        title: 'Constraint Violations Alert',
        description: `${metrics.totalViolations} violations detected (${metrics.violationRate.toFixed(1)}% of fleet)`,
        recommendation: 'Address violations immediately before deployment',
        impact: 'high',
        confidence: 0.95
      });
    } else {
      this.insights.push({
        type: 'success',
        priority: 'low',
        category: 'compliance',
        title: 'Full Compliance Achieved',
        description: 'All trains meet operational constraints and safety requirements',
        recommendation: 'Fleet is ready for optimal deployment',
        impact: 'high',
        confidence: 1.0
      });
    }

    // Efficiency insights
    if (metrics.efficiencyScore >= 80) {
      this.insights.push({
        type: 'success',
        priority: 'low',
        category: 'efficiency',
        title: 'High Operational Efficiency',
        description: `System efficiency at ${metrics.efficiencyScore}% indicates optimal resource utilization`,
        recommendation: 'Continue current operational practices',
        impact: 'medium',
        confidence: 0.85
      });
    }

    // Reliability insights
    if (metrics.reliabilityRate >= 70) {
      this.insights.push({
        type: 'success',
        priority: 'low',
        category: 'reliability',
        title: 'Strong Reliability Metrics',
        description: `${metrics.reliabilityScore} trains exceed reliability thresholds (${metrics.reliabilityRate.toFixed(1)}%)`,
        recommendation: 'Fleet reliability is within acceptable parameters',
        impact: 'high',
        confidence: 0.9
      });
    }

    // Cost optimization insights
    if (metrics.costEstimate > 15000) {
      this.insights.push({
        type: 'info',
        priority: 'medium',
        category: 'cost',
        title: 'Cost Optimization Opportunity',
        description: `Estimated operational cost: ₹${metrics.costEstimate.toLocaleString()}M`,
        recommendation: 'Review maintenance schedules and fuel efficiency programs',
        impact: 'medium',
        confidence: 0.75
      });
    }
  }

  /**
   * Calculate variance for performance scores
   * @param {Array} scores - Array of performance scores
   * @returns {number} Variance value
   */
  calculateVariance(scores) {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.round(variance * 100) / 100;
  }

  /**
   * Calculate trend direction and strength
   * @param {number} current - Current value
   * @param {number} total - Total possible value
   * @param {number} threshold - Threshold for good performance
   * @returns {Object} Trend analysis
   */
  calculateTrend(current, total, threshold) {
    const percentage = (current / total) * 100;
    const isGood = percentage >= (threshold * 100);
    const strength = Math.abs(percentage - (threshold * 100));
    
    return {
      direction: isGood ? 'up' : 'down',
      strength: strength > 20 ? 'strong' : strength > 10 ? 'moderate' : 'weak',
      percentage: Math.round(percentage),
      isImproving: isGood,
      deviation: Math.round(strength)
    };
  }

  /**
   * Calculate cost estimate based on mileage and fleet size
   * @param {number} totalMileage - Total fleet mileage
   * @param {number} totalTrains - Total number of trains
   * @returns {number} Estimated cost in millions
   */
  calculateCostEstimate(totalMileage, totalTrains) {
    const costPerKm = 2.5; // ₹2.5 per km
    const baseCost = 5000; // ₹5000M base cost
    const mileageCost = (totalMileage * costPerKm) / 1000000; // Convert to millions
    return Math.round(baseCost + mileageCost);
  }

  /**
   * Calculate carbon footprint
   * @param {number} totalMileage - Total fleet mileage
   * @returns {number} Carbon footprint in tons
   */
  calculateCarbonFootprint(totalMileage) {
    const co2PerKm = 0.05; // 0.05 tons CO2 per km
    return Math.round(totalMileage * co2PerKm);
  }

  /**
   * Get insights by category
   * @param {string} category - Insight category
   * @returns {Array} Filtered insights
   */
  getInsightsByCategory(category) {
    return this.insights.filter(insight => insight.category === category);
  }

  /**
   * Get insights by priority
   * @param {string} priority - Insight priority
   * @returns {Array} Filtered insights
   */
  getInsightsByPriority(priority) {
    return this.insights.filter(insight => insight.priority === priority);
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    return {
      metrics: this.metrics,
      trends: this.trends,
      insights: this.insights,
      totalInsights: this.insights.length,
      highPriorityInsights: this.getInsightsByPriority('high').length,
      successInsights: this.insights.filter(i => i.type === 'success').length,
      warningInsights: this.insights.filter(i => i.type === 'warning').length
    };
  }

  /**
   * Export data for external analysis
   * @returns {Object} Exported analytics data
   */
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      trends: this.trends,
      insights: this.insights,
      rawData: this.data
    };
  }
}

// Export the analytics class
export default KMRLAnalytics;

// Export utility functions
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const getTrendIcon = (trend) => {
  if (trend.direction === 'up') {
    return trend.strength === 'strong' ? '↗' : '↗';
  } else {
    return trend.strength === 'strong' ? '↘' : '↘';
  }
};

export const getPriorityColor = (priority) => {
  const colors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-green-600 bg-green-50 border-green-200'
  };
  return colors[priority] || colors.low;
};

export const getTypeColor = (type) => {
  const colors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    error: 'text-red-600'
  };
  return colors[type] || colors.info;
};
