// Real-Time Data Service for KMRL Train Management System
// Integrates IoT sensors, ML optimization, and real-time updates

import IoTSimulator from './IoTSimulator.js';
import MLOptimizationEngine from './MLOptimizationEngine.js';

class RealTimeDataService {
  constructor() {
    this.iotSimulator = IoTSimulator;
    this.mlEngine = MLOptimizationEngine;
    this.isRunning = false;
    this.updateInterval = null;
    this.callbacks = new Map();
    this.currentData = null;
    this.optimizationResults = null;
    this.lastOptimizationTime = null;
    
    // Configuration
    this.config = {
      optimizationInterval: 300000, // 5 minutes
      dataUpdateInterval: 30000,    // 30 seconds
      maxHistorySize: 50
    };
    
    this.history = [];
  }

  // Start the real-time data service
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Real-time data service already running');
      return;
    }

    console.log('🚀 Starting Real-Time Data Service...');
    this.isRunning = true;

    // Start IoT simulation
    this.iotSimulator.startSimulation();

    // Register for IoT data updates
    this.iotSimulator.onDataUpdate((data) => {
      this.handleIoTDataUpdate(data);
    });

    // Start optimization cycle
    this.startOptimizationCycle();

    // Start data update cycle
    this.startDataUpdateCycle();

    console.log('✅ Real-Time Data Service Started');
  }

  // Stop the real-time data service
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Real-time data service not running');
      return;
    }

    console.log('⏹️ Stopping Real-Time Data Service...');
    this.isRunning = false;

    // Stop IoT simulation
    this.iotSimulator.stopSimulation();

    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    console.log('✅ Real-Time Data Service Stopped');
  }

  // Handle IoT data updates
  handleIoTDataUpdate(iotData) {
    this.currentData = {
      ...iotData,
      timestamp: new Date(),
      source: 'iot_sensors'
    };

    // Store in history
    this.addToHistory(this.currentData);

    // Notify callbacks
    this.notifyCallbacks('data_update', this.currentData);
  }

  // Start optimization cycle
  startOptimizationCycle() {
    // Run initial optimization
    this.runOptimization();

    // Schedule periodic optimizations
    this.optimizationInterval = setInterval(() => {
      this.runOptimization();
    }, this.config.optimizationInterval);
  }

  // Start data update cycle
  startDataUpdateCycle() {
    this.updateInterval = setInterval(() => {
      this.processDataUpdates();
    }, this.config.dataUpdateInterval);
  }

  // Run ML optimization
  async runOptimization() {
    if (!this.currentData || !this.currentData.trains) {
      console.log('⚠️ No train data available for optimization');
      return;
    }

    console.log('🧠 Running ML Optimization...');
    this.lastOptimizationTime = new Date();

    try {
      const result = await this.mlEngine.optimizeTrainInduction(this.currentData.trains);
      
      if (result) {
        this.optimizationResults = {
          ...result,
          timestamp: new Date(),
          source: 'ml_optimization'
        };

        // Store in history
        this.addToHistory(this.optimizationResults);

        // Notify callbacks
        this.notifyCallbacks('optimization_update', this.optimizationResults);

        console.log('✅ ML Optimization Complete');
      }
    } catch (error) {
      console.error('❌ ML Optimization Error:', error);
    }
  }

  // Process data updates
  processDataUpdates() {
    if (!this.currentData) return;

    // Generate summary statistics
    const summary = this.generateSummaryStatistics();
    
    // Check for alerts
    const alerts = this.checkForAlerts();

    const updateData = {
      summary: summary,
      alerts: alerts,
      timestamp: new Date(),
      source: 'data_processing'
    };

    // Notify callbacks
    this.notifyCallbacks('summary_update', updateData);
  }

  // Generate summary statistics
  generateSummaryStatistics() {
    if (!this.currentData || !this.currentData.trains) {
      return null;
    }

    const trains = this.currentData.trains;
    const totalTrains = trains.length;

    // Status distribution
    const statusCounts = trains.reduce((acc, train) => {
      const status = train.operationalData.currentStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Performance metrics
    const avgPunctuality = trains.reduce((sum, train) => 
      sum + train.operationalData.punctualityScore, 0) / totalTrains;
    
    const avgEnergyConsumption = trains.reduce((sum, train) => 
      sum + train.operationalData.energyConsumption, 0) / totalTrains;

    // Constraint analysis
    const constraintViolations = this.analyzeConstraintViolations(trains);

    // Optimization metrics
    const optimizationMetrics = this.optimizationResults ? {
      lastOptimization: this.optimizationResults.timestamp,
      eligibleTrains: this.optimizationResults.eligibleTrains,
      totalTrains: this.optimizationResults.totalTrains,
      conflicts: this.optimizationResults.conflicts.length,
      recommendations: this.optimizationResults.recommendations.length
    } : null;

    return {
      totalTrains,
      statusCounts,
      performance: {
        avgPunctuality: avgPunctuality.toFixed(1),
        avgEnergyConsumption: avgEnergyConsumption.toFixed(2),
        serviceReadiness: this.calculateServiceReadiness(trains)
      },
      constraintViolations,
      optimizationMetrics,
      lastUpdate: new Date()
    };
  }

  // Analyze constraint violations
  analyzeConstraintViolations(trains) {
    const violations = {
      fitnessCertificates: 0,
      jobCardStatus: 0,
      brandingPriorities: 0,
      mileageBalancing: 0,
      cleaningDetailing: 0,
      stablingGeometry: 0
    };

    trains.forEach(train => {
      const compliance = this.mlEngine.checkTrainCompliance(train);
      
      Object.keys(compliance.constraints).forEach(constraint => {
        if (!compliance.constraints[constraint].compliant) {
          violations[constraint]++;
        }
      });
    });

    return violations;
  }

  // Calculate service readiness percentage
  calculateServiceReadiness(trains) {
    const readyTrains = trains.filter(train => {
      const compliance = this.mlEngine.checkTrainCompliance(train);
      return compliance.constraints.fitnessCertificates.compliant && 
             compliance.constraints.jobCardStatus.compliant;
    }).length;

    return ((readyTrains / trains.length) * 100).toFixed(1);
  }

  // Check for alerts
  checkForAlerts() {
    const alerts = [];

    if (!this.currentData || !this.currentData.trains) {
      return alerts;
    }

    const trains = this.currentData.trains;

    // Critical constraint violations
    trains.forEach(train => {
      const compliance = this.mlEngine.checkTrainCompliance(train);
      
      if (!compliance.constraints.fitnessCertificates.compliant) {
        alerts.push({
          type: 'critical',
          trainId: train.id,
          message: 'Fitness certificate violation',
          timestamp: new Date()
        });
      }

      if (!compliance.constraints.jobCardStatus.compliant) {
        alerts.push({
          type: 'critical',
          trainId: train.id,
          message: 'Job card status violation',
          timestamp: new Date()
        });
      }
    });

    // Performance alerts
    const lowPunctualityTrains = trains.filter(train => 
      train.operationalData.punctualityScore < 80
    );

    if (lowPunctualityTrains.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${lowPunctualityTrains.length} trains with low punctuality`,
        trains: lowPunctualityTrains.map(t => t.id),
        timestamp: new Date()
      });
    }

    // Optimization alerts
    if (this.optimizationResults && this.optimizationResults.conflicts.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${this.optimizationResults.conflicts.length} resource conflicts detected`,
        timestamp: new Date()
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

  // Add data to history
  addToHistory(data) {
    this.history.push(data);
    
    // Maintain history size
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }
  }

  // Get current data
  getCurrentData() {
    return this.currentData;
  }

  // Get optimization results
  getOptimizationResults() {
    return this.optimizationResults;
  }

  // Get history
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  // Get service status
  getServiceStatus() {
    return {
      isRunning: this.isRunning,
      lastDataUpdate: this.currentData?.timestamp,
      lastOptimization: this.lastOptimizationTime,
      totalCallbacks: Array.from(this.callbacks.values()).reduce((sum, callbacks) => sum + callbacks.length, 0),
      historySize: this.history.length
    };
  }

  // Force optimization run
  async forceOptimization() {
    console.log('🔄 Forcing optimization run...');
    await this.runOptimization();
  }

  // Get train details
  getTrainDetails(trainId) {
    if (!this.currentData || !this.currentData.trains) {
      return null;
    }

    const train = this.currentData.trains.find(t => t.id === trainId);
    if (!train) {
      return null;
    }

    const compliance = this.mlEngine.checkTrainCompliance(train);
    
    return {
      ...train,
      compliance: compliance,
      lastUpdate: this.currentData.timestamp
    };
  }

  // Get dashboard data (formatted for UI)
  getDashboardData() {
    if (!this.currentData || !this.optimizationResults) {
      return null;
    }

    const trains = this.currentData.trains;
    const rankedList = this.optimizationResults.rankedInductionList;

    // Format data for dashboard table
    const dashboardTrains = trains.map(train => {
      const rankedData = rankedList.find(r => r.trainId === train.id);
      
      return {
        id: train.id,
        rank: rankedData?.rank || 999,
        status: train.operationalData.currentStatus === 'in_service' ? 'Available' : 'Unavailable',
        score: rankedData?.finalScore?.toFixed(3) || '0.000',
        stabling_bay: train.stablingGeometry.currentBay,
        branding_priority: train.brandingPriorities.priority,
        mileage: train.mileageData.totalMileage,
        last_cleaned_date: this.formatDate(train.cleaningStatus.lastDeepClean),
        assignment: this.determineAssignment(train),
        compliance: rankedData?.compliance || null
      };
    });

    // Sort by rank
    dashboardTrains.sort((a, b) => a.rank - b.rank);

    return {
      trains: dashboardTrains,
      summary: this.generateSummaryStatistics(),
      alerts: this.checkForAlerts(),
      lastUpdate: new Date()
    };
  }

  // Format date for display
  formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN');
  }

  // Determine assignment based on train data
  determineAssignment(train) {
    const compliance = this.mlEngine.checkTrainCompliance(train);
    
    if (!compliance.constraints.fitnessCertificates.compliant || 
        !compliance.constraints.jobCardStatus.compliant) {
      return 'maintenance';
    }
    
    if (train.operationalData.currentStatus === 'in_service') {
      return 'service';
    }
    
    return 'standby';
  }
}

// Export singleton instance
export default new RealTimeDataService();
