/**
 * KMRC Knowledge Service
 * Provides specialized knowledge and context for KMRC operations
 */

import KMRC_STATIONS from '../data/kmrc-stations.js';

export class KMRCKnowledgeService {
  /**
   * Get station information by name or code
   * @param {string} query - Station name or code
   * @returns {Object|null} Station information
   */
  static getStationInfo(query) {
    const searchTerm = query.toLowerCase().trim();
    
    return KMRC_STATIONS.stations.find(station => 
      station.name.toLowerCase().includes(searchTerm) ||
      station.code.toLowerCase().includes(searchTerm) ||
      station.malayalam.includes(searchTerm) ||
      station.hindi.includes(searchTerm)
    ) || null;
  }

  /**
   * Get running bay information for a station
   * @param {string} stationCode - Station code
   * @returns {Object|null} Running bay information
   */
  static getRunningBayInfo(stationCode) {
    const station = this.getStationInfo(stationCode);
    if (!station) return null;

    return {
      station: station.name,
      code: station.code,
      runningBays: station.runningBays,
      capacity: KMRC_STATIONS.runningBays.capacity[station.name],
      maintenance: KMRC_STATIONS.runningBays.maintenance[station.name],
      facilities: station.facilities,
      specialFeatures: station.specialFeatures || []
    };
  }

  /**
   * Get operational insights for a specific time
   * @param {string} time - Time in HH:MM format
   * @returns {Object} Operational insights
   */
  static getOperationalInsights(time) {
    const hour = parseInt(time.split(':')[0]);
    const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const isNight = hour >= 20 || hour <= 5;
    
    return {
      time,
      isPeak,
      isNight,
      frequency: isPeak ? '5-7 minutes' : isNight ? '15-20 minutes' : '8-12 minutes',
      recommendation: isPeak ? 
        'High passenger load expected. Monitor MG Road and Edappally stations closely.' :
        isNight ? 
        'Reduced frequency. Ensure adequate security and maintenance coverage.' :
        'Normal operations. Good time for maintenance and cleaning activities.'
    };
  }

  /**
   * Get passenger flow insights
   * @returns {Object} Passenger flow data
   */
  static getPassengerFlowInsights() {
    const stations = KMRC_STATIONS.stations.map(station => ({
      name: station.name,
      code: station.code,
      dailyRidership: station.averageDailyRidership,
      peakHours: station.peakHours,
      capacity: station.passengerCapacity,
      utilization: Math.round((station.averageDailyRidership / station.passengerCapacity) * 100)
    }));

    return {
      totalDailyRidership: stations.reduce((sum, station) => sum + station.dailyRidership, 0),
      busiestStations: stations.sort((a, b) => b.dailyRidership - a.dailyRidership).slice(0, 3),
      leastBusyStations: stations.sort((a, b) => a.dailyRidership - b.dailyRidership).slice(0, 3),
      averageUtilization: Math.round(stations.reduce((sum, station) => sum + station.utilization, 0) / stations.length),
      stations
    };
  }

  /**
   * Get maintenance recommendations
   * @param {Array} trainData - Current train data
   * @returns {Object} Maintenance recommendations
   */
  static getMaintenanceRecommendations(trainData = []) {
    const maintenanceStations = ['Aluva', 'Petta', 'Edappally', 'MG Road'];
    const recommendations = [];

    maintenanceStations.forEach(station => {
      const stationInfo = this.getStationInfo(station);
      if (stationInfo) {
        recommendations.push({
          station: stationInfo.name,
          code: stationInfo.code,
          runningBays: stationInfo.runningBays,
          maintenanceType: KMRC_STATIONS.runningBays.maintenance[station],
          recommendation: stationInfo.runningBays >= 4 ? 
            'Ideal for major maintenance and overnight stabling' :
            'Suitable for minor maintenance and quick repairs',
          capacity: KMRC_STATIONS.runningBays.capacity[station]
        });
      }
    });

    return {
      totalMaintenanceCapacity: maintenanceStations.reduce((sum, station) => {
        const stationInfo = this.getStationInfo(station);
        return sum + (stationInfo ? stationInfo.runningBays : 0);
      }, 0),
      recommendations,
      priority: 'Aluva and Petta have full maintenance facilities - prioritize major repairs there'
    };
  }

  /**
   * Get emergency response information
   * @returns {Object} Emergency response data
   */
  static getEmergencyInfo() {
    return {
      contacts: KMRC_STATIONS.emergency,
      procedures: [
        'Immediately contact control room at 0484-285-8000',
        'Activate station emergency protocols',
        'Coordinate with security at 0484-285-8001',
        'Ensure passenger safety and evacuation if needed',
        'Document incident for follow-up analysis'
      ],
      stations: KMRC_STATIONS.stations.map(station => ({
        name: station.name,
        code: station.code,
        facilities: station.facilities.filter(facility => 
          facility.includes('emergency') || 
          facility.includes('security') || 
          facility.includes('medical')
        )
      }))
    };
  }

  /**
   * Get future expansion information
   * @returns {Object} Future expansion data
   */
  static getFutureExpansions() {
    return {
      phase2: {
        ...KMRC_STATIONS.futureExpansions.Phase2,
        impact: 'Will add 3 new stations, increasing network coverage by 40%',
        preparation: 'Current system needs capacity planning for integration'
      },
      phase3: {
        ...KMRC_STATIONS.futureExpansions.Phase3,
        impact: 'Will connect major tourist destinations and airport',
        preparation: 'Requires significant infrastructure upgrades'
      },
      recommendations: [
        'Prepare current running bays for increased capacity',
        'Plan maintenance facilities for new stations',
        'Update operational procedures for expanded network',
        'Train staff for new station operations'
      ]
    };
  }

  /**
   * Get contextual recommendations based on current system state
   * @param {Object} systemState - Current system state
   * @returns {Object} Contextual recommendations
   */
  static getContextualRecommendations(systemState) {
    const recommendations = [];
    
    // Check available trains
    if (systemState.availableTrains < 15) {
      recommendations.push({
        type: 'warning',
        message: 'Low available train count. Consider prioritizing maintenance efficiency.',
        action: 'Check maintenance schedules and optimize repair times'
      });
    }

    // Check violations
    if (systemState.totalViolations > 10) {
      recommendations.push({
        type: 'critical',
        message: 'High violation count detected. Immediate attention required.',
        action: 'Review constraint violations and implement corrective measures'
      });
    }

    // Check efficiency
    if (systemState.efficiencyScore < 80) {
      recommendations.push({
        type: 'info',
        message: 'System efficiency below optimal. Consider operational adjustments.',
        action: 'Analyze performance metrics and optimize train deployment'
      });
    }

    return {
      recommendations,
      priority: recommendations.find(r => r.type === 'critical') ? 'high' : 'normal',
      nextSteps: recommendations.map(r => r.action)
    };
  }

  /**
   * Generate station-specific insights
   * @param {string} stationCode - Station code
   * @returns {Object} Station insights
   */
  static generateStationInsights(stationCode) {
    const station = this.getStationInfo(stationCode);
    if (!station) return null;

    const insights = {
      station: station.name,
      code: station.code,
      insights: [],
      recommendations: []
    };

    // Capacity insights
    if (station.averageDailyRidership > station.passengerCapacity * 0.8) {
      insights.insights.push('High passenger utilization - monitor for overcrowding');
      insights.recommendations.push('Consider increasing frequency during peak hours');
    }

    // Facility insights
    if (station.facilities.includes('Parking')) {
      insights.insights.push('Parking facility available - good for commuter convenience');
    }

    // Running bay insights
    if (station.runningBays >= 4) {
      insights.insights.push('High running bay capacity - suitable for major operations');
      insights.recommendations.push('Ideal for overnight stabling and maintenance');
    }

    // Special features
    if (station.specialFeatures && station.specialFeatures.length > 0) {
      insights.insights.push(`Special features: ${station.specialFeatures.join(', ')}`);
    }

    return insights;
  }
}

export default KMRCKnowledgeService;
