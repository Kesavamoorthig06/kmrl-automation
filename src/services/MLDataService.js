// ML Data Service for KMRL Train Management System
// Loads and processes ML-generated train optimization data

import NetlifyAPIService from './NetlifyAPIService';

class MLDataService {
  constructor() {
    this.trainData = null;
    this.lastUpdate = null;
    this.callbacks = new Map();
  }

  // Load ML-generated train data from API
  async loadMLData() {
    try {
      console.log('🔄 Loading ML data from API...');
      
      // Use the new Netlify API service
      try {
        const apiData = await NetlifyAPIService.getTrainData();
        if (apiData.success && apiData.data && apiData.data.trains) {
          this.trainData = apiData.data.trains;
          this.lastUpdate = new Date();
          console.log('✅ Loaded ML data from API:', this.trainData.length, 'trains');
          this.notifyCallbacks('data_loaded', this.trainData);
          return this.trainData;
        }
      } catch (apiError) {
        console.log('⚠️ API not available, falling back to local data...');
      }

      // Fallback to train-data API
      try {
        const apiResponse = await fetch('/.netlify/functions/train-data?file=ml_analysis');
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData.success && apiData.data) {
            this.trainData = apiData.data;
            this.lastUpdate = new Date();
            console.log('✅ Loaded ML data from train-data API:', this.trainData.length, 'trains');
            this.notifyCallbacks('data_loaded', this.trainData);
            return this.trainData;
          }
        }
      } catch (apiError) {
        console.log('⚠️ Train-data API not available, falling back to CSV...');
      }
      
      // Fallback to CSV if API is not available
      const response = await fetch(`/ml_analysis_data.csv?t=${Date.now()}`);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      this.trainData = lines.slice(1).filter(line => line.trim()).map((line, index) => {
        const values = line.split(',').map(v => v.replace(/"/g, ''));
        const train = {};
        headers.forEach((header, index) => {
          train[header] = values[index];
        });
        
        // Convert to expected format
        return {
          id: train.train_id,
          rank: index + 1, // Add rank field
          status: train.status === 'Available' ? 'Available' : 'Unavailable',
          location: train.stabling_bay,
          lastMaintenance: train.last_cleaned_date,
          mileage: parseInt(train.mileage),
          performance: parseFloat(train.score),
          score: parseFloat(train.score),
          branding_priority: parseInt(train.branding_priority), // Fix field name
          assignment: train.assignment,
          fitnessValid: train.fitness_certificate_valid === 'Yes',
          jobCardStatus: train.job_card_status,
          explanation: train.explanation,
          stabling_bay: train.stabling_bay, // Fix field name
          last_cleaned_date: train.last_cleaned_date, // Fix field name
          // Additional ML metrics
          mileageScore: parseFloat(train.mileage_score),
          brandingScore: parseFloat(train.branding_score),
          cleaningScore: parseFloat(train.cleaning_score),
          shuntingScore: parseFloat(train.shunting_score),
          finalScoreGA: parseFloat(train.final_score_ga),
          totalShuntingCost: parseFloat(train.total_shunting_cost),
          countPenalty: parseInt(train.count_penalty),
          shuntPenalty: parseInt(train.shunt_penalty),
          brandingShortfall: train.branding_shortfall === 'True'
        };
      });

      this.lastUpdate = new Date();
      
      // Notify callbacks
      this.notifyCallbacks('data_loaded', this.trainData);
      
      console.log('✅ ML Data Service: Successfully loaded', this.trainData.length, 'train records');
      return this.trainData;
    } catch (error) {
      console.error('❌ Error loading ML data:', error);
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
