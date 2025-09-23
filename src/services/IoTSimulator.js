// IoT Sensor Data Simulator for KMRL Train Management System
// Simulates real-time data collection from various sensors and systems

class IoTSimulator {
  constructor() {
    this.trains = [];
    this.sensors = new Map();
    this.isRunning = false;
    this.updateInterval = null;
    this.callbacks = [];
    
    // Initialize 25 trains with realistic data
    this.initializeTrains();
    this.initializeSensors();
  }

  initializeTrains() {
    const trainTypes = ['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'R-08', 'R-09', 'R-10',
                       'R-11', 'R-12', 'R-13', 'R-14', 'R-15', 'R-16', 'R-17', 'R-18', 'R-19', 'R-20',
                       'R-21', 'R-22', 'R-23', 'R-24', 'R-25'];
    
    this.trains = trainTypes.map((id, index) => ({
      id,
      // Fitness Certificates (Rolling-Stock, Signalling, Telecom)
      fitnessCertificates: {
        rollingStock: this.generateFitnessStatus(),
        signalling: this.generateFitnessStatus(),
        telecom: this.generateFitnessStatus(),
        lastUpdated: new Date()
      },
      // Job Card Status (IBM Maximo integration)
      jobCardStatus: {
        openWorkOrders: Math.floor(Math.random() * 5),
        criticalIssues: Math.random() > 0.8 ? 1 : 0,
        lastMaintenance: this.generateLastMaintenanceDate(),
        nextScheduled: this.generateNextMaintenanceDate()
      },
      // Branding Priorities (Contractual commitments)
      brandingPriorities: {
        currentContract: this.generateBrandingContract(),
        exposureHours: Math.floor(Math.random() * 200),
        requiredHours: 150 + Math.floor(Math.random() * 100),
        priority: Math.floor(Math.random() * 8) + 1
      },
      // Mileage Balancing (Bogie, brake-pad, HVAC wear)
      mileageData: {
        totalMileage: 10000 + Math.floor(Math.random() * 50000),
        bogieWear: Math.random() * 100,
        brakePadWear: Math.random() * 100,
        hvacWear: Math.random() * 100,
        lastBalancing: this.generateLastBalancingDate()
      },
      // Cleaning & Detailing Slots
      cleaningStatus: {
        lastDeepClean: this.generateLastCleaningDate(),
        interiorCondition: Math.random() * 100,
        exteriorCondition: Math.random() * 100,
        nextScheduledClean: this.generateNextCleaningDate(),
        manpowerAvailable: Math.random() > 0.3
      },
      // Stabling Geometry (Physical bay positions)
      stablingGeometry: {
        currentBay: this.generateBayPosition(),
        optimalBay: this.generateOptimalBay(),
        shuntingDistance: Math.floor(Math.random() * 500),
        accessibilityScore: Math.random() * 100
      },
      // Real-time operational data
      operationalData: {
        currentStatus: this.generateCurrentStatus(),
        energyConsumption: 2.5 + Math.random() * 1.5,
        passengerLoad: Math.random() * 100,
        punctualityScore: 85 + Math.random() * 15,
        lastUpdate: new Date()
      }
    }));
  }

  initializeSensors() {
    // Simulate different types of sensors
    this.sensors.set('fitness', {
      type: 'Fitness Certificate Monitor',
      updateFrequency: 300000, // 5 minutes
      lastUpdate: new Date()
    });
    
    this.sensors.set('maximo', {
      type: 'IBM Maximo Integration',
      updateFrequency: 600000, // 10 minutes
      lastUpdate: new Date()
    });
    
    this.sensors.set('branding', {
      type: 'Branding Exposure Tracker',
      updateFrequency: 1800000, // 30 minutes
      lastUpdate: new Date()
    });
    
    this.sensors.set('mileage', {
      type: 'Mileage & Wear Sensors',
      updateFrequency: 60000, // 1 minute
      lastUpdate: new Date()
    });
    
    this.sensors.set('cleaning', {
      type: 'Cleaning Status Monitor',
      updateFrequency: 900000, // 15 minutes
      lastUpdate: new Date()
    });
    
    this.sensors.set('stabling', {
      type: 'Stabling Geometry Tracker',
      updateFrequency: 120000, // 2 minutes
      lastUpdate: new Date()
    });
  }

  // Helper methods for generating realistic data
  generateFitnessStatus() {
    const statuses = ['valid', 'expiring_soon', 'expired', 'pending_renewal'];
    const weights = [0.7, 0.15, 0.1, 0.05];
    return this.weightedRandom(statuses, weights);
  }

  generateLastMaintenanceDate() {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  generateNextMaintenanceDate() {
    const daysFromNow = Math.floor(Math.random() * 14) + 1;
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }

  generateBrandingContract() {
    const contracts = ['Premium', 'Standard', 'Basic', 'Emergency'];
    return contracts[Math.floor(Math.random() * contracts.length)];
  }

  generateLastBalancingDate() {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  generateLastCleaningDate() {
    const daysAgo = Math.floor(Math.random() * 3);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  generateNextCleaningDate() {
    const hoursFromNow = Math.floor(Math.random() * 24) + 1;
    const date = new Date();
    date.setHours(date.getHours() + hoursFromNow);
    return date;
  }

  generateBayPosition() {
    const bays = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3'];
    return bays[Math.floor(Math.random() * bays.length)];
  }

  generateOptimalBay() {
    const bays = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3'];
    return bays[Math.floor(Math.random() * bays.length)];
  }

  generateCurrentStatus() {
    const statuses = ['in_service', 'standby', 'maintenance', 'cleaning', 'stabled'];
    const weights = [0.6, 0.2, 0.1, 0.05, 0.05];
    return this.weightedRandom(statuses, weights);
  }

  weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    return items[items.length - 1];
  }

  // Start real-time data simulation
  startSimulation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 IoT Sensor Simulation Started');
    
    // Update data every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateSensorData();
      this.notifyCallbacks();
    }, 30000);
    
    // Initial update
    this.updateSensorData();
    this.notifyCallbacks();
  }

  // Stop simulation
  stopSimulation() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('⏹️ IoT Sensor Simulation Stopped');
  }

  // Update sensor data with realistic changes
  updateSensorData() {
    this.trains.forEach(train => {
      // Update fitness certificates (occasional changes)
      if (Math.random() > 0.95) {
        train.fitnessCertificates.rollingStock = this.generateFitnessStatus();
        train.fitnessCertificates.signalling = this.generateFitnessStatus();
        train.fitnessCertificates.telecom = this.generateFitnessStatus();
        train.fitnessCertificates.lastUpdated = new Date();
      }

      // Update job card status (frequent changes)
      if (Math.random() > 0.7) {
        train.jobCardStatus.openWorkOrders = Math.max(0, train.jobCardStatus.openWorkOrders + (Math.random() > 0.5 ? 1 : -1));
        train.jobCardStatus.criticalIssues = Math.random() > 0.9 ? 1 : 0;
      }

      // Update branding exposure (continuous)
      train.brandingPriorities.exposureHours += Math.floor(Math.random() * 3);
      if (Math.random() > 0.8) {
        train.brandingPriorities.priority = Math.floor(Math.random() * 8) + 1;
      }

      // Update mileage data (continuous)
      train.mileageData.totalMileage += Math.floor(Math.random() * 5);
      train.mileageData.bogieWear += Math.random() * 0.1;
      train.mileageData.brakePadWear += Math.random() * 0.1;
      train.mileageData.hvacWear += Math.random() * 0.1;

      // Update cleaning status
      if (Math.random() > 0.8) {
        train.cleaningStatus.interiorCondition = Math.max(0, train.cleaningStatus.interiorCondition - Math.random() * 2);
        train.cleaningStatus.exteriorCondition = Math.max(0, train.cleaningStatus.exteriorCondition - Math.random() * 2);
      }

      // Update stabling geometry (occasional changes)
      if (Math.random() > 0.9) {
        train.stablingGeometry.currentBay = this.generateBayPosition();
        train.stablingGeometry.shuntingDistance = Math.floor(Math.random() * 500);
        train.stablingGeometry.accessibilityScore = Math.random() * 100;
      }

      // Update operational data (frequent changes)
      train.operationalData.energyConsumption = 2.5 + Math.random() * 1.5;
      train.operationalData.passengerLoad = Math.random() * 100;
      train.operationalData.punctualityScore = 85 + Math.random() * 15;
      train.operationalData.lastUpdate = new Date();
    });

    // Update sensor timestamps
    this.sensors.forEach(sensor => {
      sensor.lastUpdate = new Date();
    });
  }

  // Register callback for data updates
  onDataUpdate(callback) {
    this.callbacks.push(callback);
  }

  // Notify all registered callbacks
  notifyCallbacks() {
    this.callbacks.forEach(callback => {
      try {
        callback(this.getCurrentData());
      } catch (error) {
        console.error('Error in data update callback:', error);
      }
    });
  }

  // Get current data snapshot
  getCurrentData() {
    return {
      trains: this.trains,
      sensors: Object.fromEntries(this.sensors),
      timestamp: new Date(),
      isRunning: this.isRunning
    };
  }

  // Get data for specific train
  getTrainData(trainId) {
    return this.trains.find(train => train.id === trainId);
  }

  // Get summary statistics
  getSummaryStats() {
    const totalTrains = this.trains.length;
    const inService = this.trains.filter(t => t.operationalData.currentStatus === 'in_service').length;
    const inMaintenance = this.trains.filter(t => t.operationalData.currentStatus === 'maintenance').length;
    const standby = this.trains.filter(t => t.operationalData.currentStatus === 'standby').length;
    
    const avgEnergyConsumption = this.trains.reduce((sum, t) => sum + t.operationalData.energyConsumption, 0) / totalTrains;
    const avgPunctuality = this.trains.reduce((sum, t) => sum + t.operationalData.punctualityScore, 0) / totalTrains;
    
    return {
      totalTrains,
      inService,
      inMaintenance,
      standby,
      avgEnergyConsumption: avgEnergyConsumption.toFixed(2),
      avgPunctuality: avgPunctuality.toFixed(1),
      lastUpdate: new Date()
    };
  }
}

// Export singleton instance
export default new IoTSimulator();
