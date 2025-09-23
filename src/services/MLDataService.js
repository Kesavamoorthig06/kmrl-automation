// ML Data Service for KMRL Train Management System
// Loads and processes ML-generated train optimization data

class MLDataService {
  constructor() {
    this.trainData = null;
    this.lastUpdate = null;
    this.callbacks = new Map();
  }

  // Load ML-generated train data from CSV
  async loadMLData() {
    try {
      console.log('🔄 Loading ML data from CSV...');
      const response = await fetch('/ml_analysis_data.csv');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('📄 CSV text loaded, length:', csvText.length);
      
      const lines = csvText.split('\n');
      console.log('📊 Total lines:', lines.length);
      
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      console.log('📋 Headers:', headers);
      
      this.trainData = lines.slice(1).filter(line => line.trim()).map((line, index) => {
        const values = line.split(',').map(v => v.replace(/"/g, ''));
        const train = {};
        headers.forEach((header, headerIndex) => {
          train[header] = values[headerIndex];
        });
        
        // Convert to expected format
        return {
          id: `R-${String(train.train_id).padStart(3, '0')}`, // Convert to R-001, R-002 format
          rank: index + 1, // Add rank field
          status: train.status === 'eligible' ? 'Available' : 'Unavailable', // Map eligible to Available
          location: train.stabling_bay,
          lastMaintenance: train.last_cleaned_date,
          mileage: parseInt(train.mileage) || 0,
          performance: parseFloat(train.final_score_ga) || 0,
          score: parseFloat(train.final_score_ga) || 0,
          branding_priority: parseInt(train.branding_priority) || 0,
          assignment: train.assignment === 'service' ? 'Service' : 'Maintenance',
          fitnessValid: train.fitness_certificate_valid === 'True',
          jobCardStatus: train.job_card_status,
          explanation: train.maintenance_reason || '',
          stabling_bay: train.stabling_bay,
          last_cleaned_date: train.last_cleaned_date,
          // Additional ML metrics
          mileageScore: parseFloat(train.mileage_score) || 0,
          brandingScore: parseFloat(train.branding_score) || 0,
          cleaningScore: parseFloat(train.cleaning_score) || 0,
          shuntingScore: parseFloat(train.shunting_score) || 0,
          finalScoreGA: parseFloat(train.final_score_ga) || 0,
          totalShuntingCost: parseFloat(train.total_shunting_cost) || 0,
          countPenalty: parseInt(train.count_penalty) || 0,
          shuntPenalty: parseInt(train.shunt_penalty) || 0,
          brandingShortfall: train.branding_shortfall === 'True'
        };
      });

      this.lastUpdate = new Date();
      console.log('✅ Successfully loaded', this.trainData.length, 'trains');
      
      // Notify callbacks
      this.notifyCallbacks('data_loaded', this.trainData);
      
      return this.trainData;
    } catch (error) {
      console.error('❌ Error loading ML data:', error);
      console.error('Error details:', error.message);
      
      // Return empty array as fallback instead of throwing
      this.trainData = [];
      this.lastUpdate = new Date();
      return [];
    }
  }

  // Get all train data
  getTrainData() {
    return this.trainData || [];
  }

  // Get available trains (for deployment)
  getAvailableTrains() {
    if (!this.trainData) return [];
    return this.trainData.filter(train => train.status === 'Available');
  }

  // Get maintenance trains
  getMaintenanceTrains() {
    if (!this.trainData) return [];
    return this.trainData.filter(train => train.status === 'Maintenance');
  }

  // Get top performing trains
  getTopTrains(limit = 10) {
    if (!this.trainData) return [];
    return this.trainData
      .filter(train => train.status === 'Available')
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Get train by ID
  getTrainById(trainId) {
    if (!this.trainData) return null;
    return this.trainData.find(train => train.id === trainId);
  }

  // Get dashboard summary
  getDashboardSummary() {
    if (!this.trainData) {
      return {
        totalTrains: 0,
        availableTrains: 0,
        maintenanceTrains: 0,
        avgPerformance: 0,
        topPerformer: null,
        lastUpdate: null
      };
    }

    const available = this.getAvailableTrains();
    const maintenance = this.getMaintenanceTrains();
    const avgPerformance = available.length > 0 
      ? available.reduce((sum, train) => sum + train.score, 0) / available.length 
      : 0;
    const topPerformer = available.length > 0 
      ? available.reduce((top, train) => train.score > top.score ? train : top)
      : null;

    return {
      totalTrains: this.trainData.length,
      availableTrains: available.length,
      maintenanceTrains: maintenance.length,
      avgPerformance: parseFloat(avgPerformance.toFixed(2)),
      topPerformer: topPerformer,
      lastUpdate: this.lastUpdate
    };
  }

  // Get performance metrics
  getPerformanceMetrics() {
    if (!this.trainData) return null;

    const available = this.getAvailableTrains();
    if (available.length === 0) return null;

    const metrics = {
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
      scoreDistribution: {
        excellent: 0, // > 90
        good: 0,      // 80-90
        fair: 0,      // 70-80
        poor: 0       // < 70
      },
      avgMileage: 0,
      avgBrandingPriority: 0
    };

    const scores = available.map(train => train.score);
    metrics.avgScore = parseFloat((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
    metrics.maxScore = Math.max(...scores);
    metrics.minScore = Math.min(...scores);

    // Score distribution
    available.forEach(train => {
      if (train.score >= 90) metrics.scoreDistribution.excellent++;
      else if (train.score >= 80) metrics.scoreDistribution.good++;
      else if (train.score >= 70) metrics.scoreDistribution.fair++;
      else metrics.scoreDistribution.poor++;
    });

    metrics.avgMileage = Math.round(available.reduce((sum, train) => sum + train.mileage, 0) / available.length);
    metrics.avgBrandingPriority = parseFloat((available.reduce((sum, train) => sum + train.brandingPriority, 0) / available.length).toFixed(1));

    return metrics;
  }

  // Get alerts based on ML data
  getAlerts() {
    if (!this.trainData) return [];

    const alerts = [];

    // Critical alerts for maintenance trains
    const maintenanceTrains = this.getMaintenanceTrains();
    maintenanceTrains.forEach(train => {
      alerts.push({
        type: 'critical',
        trainId: train.id,
        message: train.explanation || 'Train requires maintenance',
        timestamp: this.lastUpdate
      });
    });

    // Warning alerts for low-performing available trains
    const lowPerformingTrains = this.getAvailableTrains().filter(train => train.score < 80);
    if (lowPerformingTrains.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${lowPerformingTrains.length} trains with low performance scores`,
        trains: lowPerformingTrains.map(t => t.id),
        timestamp: this.lastUpdate
      });
    }

    // Info alerts for high-performing trains
    const highPerformingTrains = this.getAvailableTrains().filter(train => train.score >= 95);
    if (highPerformingTrains.length > 0) {
      alerts.push({
        type: 'info',
        message: `${highPerformingTrains.length} trains with excellent performance`,
        trains: highPerformingTrains.map(t => t.id),
        timestamp: this.lastUpdate
      });
    }

    return alerts;
  }

  // Register callback for updates
  onUpdate(type, callback) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    this.callbacks.get(type).push(callback);
  }

  // Remove callback
  removeCallback(type, callback) {
    if (this.callbacks.has(type)) {
      const callbacks = this.callbacks.get(type);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notify callbacks
  notifyCallbacks(type, data) {
    if (this.callbacks.has(type)) {
      this.callbacks.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in callback for ${type}:`, error);
        }
      });
    }
  }

  // Refresh data
  async refresh() {
    return await this.loadMLData();
  }

  // Get service status
  getServiceStatus() {
    return {
      isLoaded: !!this.trainData,
      lastUpdate: this.lastUpdate,
      totalTrains: this.trainData ? this.trainData.length : 0,
      availableTrains: this.getAvailableTrains().length,
      maintenanceTrains: this.getMaintenanceTrains().length
    };
  }
}

// Export singleton instance
export default new MLDataService();
