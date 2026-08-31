// ML Data Service for KMRL Train Management System
// Loads and processes ML-generated train optimization data

import APIService from './api';

class MLDataService {
  constructor() {
    this.trainData = null;
    this.dashboardData = null;
    this.lastUpdate = null;
    this.callbacks = new Map();
  }

  // Load ML-generated train data from API
  async loadMLData() {
    try {
      console.log('🔄 Loading ML data from API...');
      
      // Try to load directly from CSV first as fallback
      try {
        const csvData = await this.loadCSVDirectly();
        if (csvData && csvData.length > 0) {
          console.log('✅ Loaded data directly from CSV:', csvData.length, 'records');
          this.trainData = csvData;
          this.dashboardData = this.generateAnalyticsFromCSV(csvData);
          this.lastUpdate = new Date();
          this.notifyCallbacks('data_loaded', this.trainData);
          return this.trainData;
        }
      } catch (csvError) {
        console.warn('⚠️ Could not load CSV directly:', csvError.message);
      }
      
      // Try API approach
      const response = await APIService.getDashboardData();
      
      if (response.success) {
        this.dashboardData = response.analytics;
        
        // Extract train data from ML optimization if available
        if (response.mlOptimization && response.mlOptimization.results) {
          this.trainData = response.mlOptimization.results;
        } else {
          // Fallback: create train data from analytics
          this.trainData = this.generateTrainDataFromAnalytics(response.analytics);
        }
        
        this.lastUpdate = new Date();
        
        // Notify callbacks
        this.notifyCallbacks('data_loaded', this.trainData);
        
        console.log('✅ ML Data Service: Successfully loaded', this.trainData.length, 'train records');
        return this.trainData;
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('❌ Error loading ML data:', error);
      
      // Fallback to empty data
      this.trainData = [];
      this.dashboardData = null;
      this.lastUpdate = new Date();
      this.notifyCallbacks('data_loaded', this.trainData);
      
      return this.trainData;
    }
  }

  // Load CSV data directly from public folder
  async loadCSVDirectly() {
    try {
      console.log('📄 Attempting to load ml_analysis_data.csv directly...');
      const response = await fetch('/ml_analysis_data.csv');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      const parsedData = this.parseCSV(csvText);
      
      // Convert CSV data to train objects
      const trainData = parsedData.map(row => ({
        id: row.train_id,
        train_id: row.train_id,
        status: row.status === 'Available' ? 'Available' : 'Unavailable',
        score: Math.round(parseFloat(row.score || 0) * 100),
        composite_score: parseFloat(row.score || 0),
        stabling_bay: row.stabling_bay,
        branding_priority: parseInt(row.branding_priority || 0),
        mileage: parseInt(row.mileage || 0),
        last_cleaned_date: row.last_cleaned_date,
        assignment: row.assignment,
        fitness_certificate_valid: row.fitness_certificate_valid === 'Yes',
        job_card_status: row.job_card_status,
        explanation: row.explanation || 'No explanation available',
        deployment_ready: row.deployment_ready === 'Yes',
        bay_type: row.bay_type || 'standard',
        operational_efficiency: parseFloat(row.operational_efficiency || 95),
        individual_scores: {
          fitness: parseFloat(row.fitness_certificate_valid === 'Yes' ? 0.9 : 0.5),
          job_card: parseFloat(row.job_card_status === 'Clear' ? 0.9 : 0.5),
          branding: parseFloat(row.branding_score || 0),
          mileage: parseFloat(row.mileage_score || 0),
          cleaning: parseFloat(row.cleaning_score || 0),
          stabling: parseFloat(row.shunting_score || 0)
        }
      }));

      console.log('✅ Successfully parsed CSV data:', trainData.length, 'records');
      return trainData;
    } catch (error) {
      console.error('❌ Error loading CSV directly:', error);
      throw error;
    }
  }

  // Parse CSV text into array of objects
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      
      headers.forEach((header, index) => {
        let value = values[index] || '';
        // Remove quotes
        value = value.replace(/^"/, '').replace(/"$/, '');
        row[header] = value.trim();
      });
      
      data.push(row);
    }
    
    return data;
  }

  // Generate analytics from CSV data
  generateAnalyticsFromCSV(trainData) {
    const totalTrains = trainData.length;
    const availableTrains = trainData.filter(t => t.status === 'Available').length;
    const maintenanceTrains = totalTrains - availableTrains;

    const avgScore = trainData.reduce((sum, train) => sum + (train.composite_score || 0), 0) / totalTrains;
    const totalMileage = trainData.reduce((sum, train) => sum + (train.mileage || 0), 0);

    return {
      summary: {
        totalTrains,
        operational: availableTrains,
        maintenance: maintenanceTrains,
        outOfService: 0,
        totalMileage: Math.round(totalMileage),
        avgEfficiency: Math.round(avgScore * 100),
        operationalPercentage: Math.round((availableTrains / totalTrains) * 100)
      },
      performance: {
        cleaning: Math.round(avgScore * 85),
        branding: Math.round(avgScore * 78),
        operational: Math.round(avgScore * 88),
        performance: Math.round(avgScore * 82),
        overall: Math.round(avgScore * 83)
      },
      alerts: this.generateAlertsFromCSV(trainData)
    };
  }

  // Generate alerts from CSV data
  generateAlertsFromCSV(trainData) {
    const alerts = [];
    
    trainData.forEach(train => {
      if (train.status !== 'Available') {
        alerts.push({
          type: 'critical',
          trainId: train.id,
          message: train.explanation || 'Train unavailable',
          timestamp: new Date()
        });
      } else if (train.composite_score < 0.8) {
        alerts.push({
          type: 'warning',
          trainId: train.id,
          message: `Low performance score: ${Math.round(train.composite_score * 100)}%`,
          timestamp: new Date()
        });
      }
    });

    return alerts;
  }

  // Generate train data from analytics when ML optimization is not available
  generateTrainDataFromAnalytics(analytics) {
    if (!analytics || !analytics.summary) return [];

    const trains = [];
    const { totalTrains, operational, maintenance, outOfService } = analytics.summary;

    // Generate sample train data based on summary
    for (let i = 1; i <= totalTrains; i++) {
      const trainId = `KMRL-${String(i).padStart(3, '0')}`;
      let status = 'Available';
      let score = Math.random() * 0.3 + 0.7; // 70-100%

      // Distribute trains according to summary
      if (i <= maintenance) {
        status = 'Maintenance';
        score = Math.random() * 0.4 + 0.3; // 30-70%
      } else if (i <= maintenance + outOfService) {
        status = 'Unavailable';
        score = Math.random() * 0.3; // 0-30%
      }

      trains.push({
        train_id: trainId,
        id: trainId,
        composite_score: score,
        overall_status: status,
        score: Math.round(score * 100),
        status: status,
        explanation: status === 'Available' ? 'All systems optimal' : 
                    status === 'Maintenance' ? 'Maintenance required' : 'Out of service',
        individual_scores: {
          fitness: score + (Math.random() * 0.2 - 0.1),
          job_card: score + (Math.random() * 0.2 - 0.1),
          branding: score + (Math.random() * 0.2 - 0.1),
          mileage: score + (Math.random() * 0.2 - 0.1),
          cleaning: score + (Math.random() * 0.2 - 0.1),
          stabling: score + (Math.random() * 0.2 - 0.1)
        }
      });
    }

    return trains;
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
    return this.dashboardData ? this.dashboardData.summary : {
      totalTrains: 0,
      operational: 0,
      maintenance: 0,
      outOfService: 0,
      totalMileage: 0,
      avgEfficiency: 0,
      operationalPercentage: 0
    };
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return this.dashboardData ? this.dashboardData.performance : {
      cleaning: 0,
      branding: 0,
      operational: 0,
      performance: 0,
      overall: 0
    };
  }

  // Get alerts based on ML data
  getAlerts() {
    // Return alerts from dashboard data if available, otherwise generate from train data
    if (this.dashboardData && this.dashboardData.alerts) {
      return this.dashboardData.alerts;
    }

    if (!this.trainData) return [];

    const alerts = [];

    // Critical alerts for maintenance trains
    const maintenanceTrains = this.getMaintenanceTrains();
    maintenanceTrains.forEach(train => {
      alerts.push({
        type: 'critical',
        trainId: train.id || train.train_id,
        message: train.explanation || 'Train requires maintenance',
        timestamp: this.lastUpdate
      });
    });

    // Warning alerts for low-performing available trains
    const lowPerformingTrains = this.getAvailableTrains().filter(train => (train.score || train.composite_score * 100) < 80);
    if (lowPerformingTrains.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${lowPerformingTrains.length} trains with low performance scores`,
        trains: lowPerformingTrains.map(t => t.id || t.train_id),
        timestamp: this.lastUpdate
      });
    }

    // Info alerts for high-performing trains
    const highPerformingTrains = this.getAvailableTrains().filter(train => (train.score || train.composite_score * 100) >= 95);
    if (highPerformingTrains.length > 0) {
      alerts.push({
        type: 'info',
        message: `${highPerformingTrains.length} trains with excellent performance`,
        trains: highPerformingTrains.map(t => t.id || t.train_id),
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

  // Force refresh: invalidate cache and reload from CSV
  async forceRefresh() {
    this.trainData = null;
    this.dashboardData = null;
    this.lastUpdate = null;
    console.log('🔄 Force refresh: cache cleared, reloading...');
    return await this.loadMLData();
  }

  // Get the recommended immediate-deployment train
  // (highest score among available SERVICE trains, weighted by low shunt cost)
  getImmediateDeployment() {
    const available = this.getAvailableTrains();
    if (!available.length) return null;

    // Sort by composite score descending
    const sorted = [...available].sort((a, b) => {
      // 60% readiness score, 40% inverse shunting score (lower shunt = better)
      const scoreA = 0.6 * (a.composite_score || a.score / 100)
        + 0.4 * (a.individual_scores?.stabling || 0.5);
      const scoreB = 0.6 * (b.composite_score || b.score / 100)
        + 0.4 * (b.individual_scores?.stabling || 0.5);
      return scoreB - scoreA;
    });

    const best = sorted[0];
    return {
      trainId: best.id || best.train_id,
      score: best.score,
      compositeScore: best.composite_score,
      assignment: best.assignment || 'Service',
      stablingBay: best.stabling_bay,
      reason: `Highest immediate deployment score — readiness ${best.score}%, low shunt cost`,
    };
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
