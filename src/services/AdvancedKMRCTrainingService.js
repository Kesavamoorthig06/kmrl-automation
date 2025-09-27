/**
 * Advanced KMRC Training Service
 * Provides LLM-style training and context for the chatbot
 */

import KMRC_ENHANCED_KNOWLEDGE from '../data/kmrc-enhanced-knowledge.js';

export class AdvancedKMRCTrainingService {
  /**
   * Generate comprehensive context for any query
   * @param {string} query - User query
   * @param {Object} currentState - Current system state
   * @returns {Object} Enhanced context
   */
  static generateContext(query, currentState = {}) {
    const lowerQuery = query.toLowerCase();
    const context = {
      query,
      timestamp: new Date().toISOString(),
      currentTime: new Date().toLocaleTimeString('en-IN'),
      currentDate: new Date().toLocaleDateString('en-IN'),
      season: this.getCurrentSeason(),
      festival: this.getCurrentFestival(),
      operationalContext: this.getOperationalContext(),
      stationContext: this.getStationContext(query),
      culturalContext: this.getCulturalContext(query),
      deploymentContext: this.getDeploymentContext(query),
      recommendations: []
    };

    // Add intelligent recommendations based on query
    context.recommendations = this.generateRecommendations(query, context);

    return context;
  }

  /**
   * Get current season context
   * @returns {Object} Season information
   */
  static getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    const seasons = {
      monsoon: { months: [6, 7, 8, 9], name: "Monsoon", impact: "High" },
      winter: { months: [10, 11, 12, 1], name: "Winter/Tourist Season", impact: "Very High" },
      summer: { months: [2, 3, 4, 5], name: "Summer", impact: "Moderate" }
    };

    for (const [season, data] of Object.entries(seasons)) {
      if (data.months.includes(month)) {
        return {
          name: data.name,
          impact: data.impact,
          recommendations: this.getSeasonalRecommendations(season)
        };
      }
    }
  }

  /**
   * Get current festival context
   * @returns {Object} Festival information
   */
  static getCurrentFestival() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // Check for major festivals
    const festivals = KMRC_ENHANCED_KNOWLEDGE.culturalEvents.majorFestivals;
    
    for (const festival of festivals) {
      if (this.isFestivalActive(festival, month, day)) {
        return {
          name: festival.name,
          type: festival.type,
          impact: "High",
          specialServices: festival.specialServices,
          recommendations: [
            `Expect increased ridership during ${festival.name}`,
            `Special services: ${festival.specialServices}`,
            "Monitor crowd density at major stations",
            "Prepare for extended operational hours if needed"
          ]
        };
      }
    }

    return {
      name: "Regular Operations",
      impact: "Normal",
      recommendations: ["Standard operational procedures apply"]
    };
  }

  /**
   * Get operational context based on current time
   * @returns {Object} Operational information
   */
  static getOperationalContext() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const isNight = hour >= 22 || hour <= 5;
    const isMaintenance = hour >= 22 && hour <= 5;

    return {
      currentTime,
      isPeak,
      isNight,
      isMaintenance,
      frequency: isPeak ? "5-7 minutes" : isNight ? "15-20 minutes" : "8-12 minutes",
      status: isMaintenance ? "Maintenance Window" : "Operational",
      recommendations: this.getOperationalRecommendations(isPeak, isNight, isMaintenance)
    };
  }

  /**
   * Get station-specific context
   * @param {string} query - User query
   * @returns {Object} Station context
   */
  static getStationContext(query) {
    const stations = KMRC_ENHANCED_KNOWLEDGE.stations;
    const lowerQuery = query.toLowerCase();
    
    // Find relevant stations
    const relevantStations = stations.filter(station => 
      lowerQuery.includes(station.name.toLowerCase()) ||
      lowerQuery.includes(station.code.toLowerCase()) ||
      lowerQuery.includes(station.malayalam) ||
      lowerQuery.includes(station.hindi)
    );

    if (relevantStations.length === 0) {
      return {
        type: "General",
        recommendations: ["Provide general metro information"]
      };
    }

    const station = relevantStations[0];
    return {
      station: station.name,
      code: station.code,
      type: station.type,
      runningBays: station.runningBays,
      facilities: station.facilities,
      ridership: station.dailyRidership,
      specialFeatures: station.specialFeatures || [],
      recommendations: this.getStationRecommendations(station)
    };
  }

  /**
   * Get cultural context for festivals and events
   * @param {string} query - User query
   * @returns {Object} Cultural context
   */
  static getCulturalContext(query) {
    const lowerQuery = query.toLowerCase();
    const culturalEvents = KMRC_ENHANCED_KNOWLEDGE.culturalEvents;
    
    // Check for festival mentions
    const festivals = [...culturalEvents.majorFestivals, ...culturalEvents.culturalEvents];
    const relevantFestivals = festivals.filter(festival => 
      lowerQuery.includes(festival.name.toLowerCase()) ||
      lowerQuery.includes(festival.malayalam.toLowerCase()) ||
      lowerQuery.includes(festival.type.toLowerCase())
    );

    if (relevantFestivals.length === 0) {
      return {
        type: "General",
        recommendations: ["Provide general cultural information"]
      };
    }

    const festival = relevantFestivals[0];
    return {
      name: festival.name,
      type: festival.type,
      description: festival.description,
      metroImpact: festival.metroImpact,
      specialServices: festival.specialServices,
      recommendations: [
        `During ${festival.name}: ${festival.metroImpact}`,
        `Special services: ${festival.specialServices}`,
        "Monitor passenger flow and adjust services accordingly"
      ]
    };
  }

  /**
   * Get deployment context
   * @param {string} query - User query
   * @returns {Object} Deployment context
   */
  static getDeploymentContext(query) {
    const lowerQuery = query.toLowerCase();
    const deploymentStrategies = KMRC_ENHANCED_KNOWLEDGE.deploymentStrategies;

    if (lowerQuery.includes('peak') || lowerQuery.includes('rush')) {
      return {
        type: "Peak Hour Management",
        strategies: deploymentStrategies.peakHourManagement,
        recommendations: [
          "Deploy maximum trains during peak hours",
          "Monitor crowd density at major stations",
          "Ensure 5-7 minute frequency is maintained"
        ]
      };
    }

    if (lowerQuery.includes('festival') || lowerQuery.includes('event')) {
      return {
        type: "Festival Management",
        strategies: deploymentStrategies.festivalManagement,
        recommendations: [
          "Plan for extended services during festivals",
          "Implement crowd management measures",
          "Coordinate with local authorities"
        ]
      };
    }

    if (lowerQuery.includes('maintenance') || lowerQuery.includes('repair')) {
      return {
        type: "Maintenance Management",
        strategies: deploymentStrategies.maintenanceWindows,
        recommendations: [
          "Schedule maintenance during off-peak hours",
          "Ensure minimal disruption to services",
          "Coordinate with operational teams"
        ]
      };
    }

    return {
      type: "General Deployment",
      recommendations: ["Follow standard deployment procedures"]
    };
  }

  /**
   * Generate intelligent recommendations
   * @param {string} query - User query
   * @param {Object} context - Generated context
   * @returns {Array} Recommendations
   */
  static generateRecommendations(query, context) {
    const recommendations = [];
    const lowerQuery = query.toLowerCase();

    // Operational recommendations
    if (context.operationalContext.isPeak) {
      recommendations.push("High passenger load expected - monitor crowd density");
      recommendations.push("Ensure maximum train deployment and 5-7 minute frequency");
    }

    if (context.operationalContext.isNight) {
      recommendations.push("Reduced frequency operations - ensure adequate security");
      recommendations.push("Monitor for any maintenance requirements");
    }

    // Festival recommendations
    if (context.festival.impact === "High") {
      recommendations.push(`Special festival services: ${context.festival.specialServices}`);
      recommendations.push("Prepare for increased ridership and extended hours");
    }

    // Station-specific recommendations
    if (context.stationContext.station) {
      const station = context.stationContext;
      if (station.ridership > 6000) {
        recommendations.push(`${station.station} is a high-ridership station - monitor closely`);
      }
      if (station.runningBays >= 4) {
        recommendations.push(`${station.station} has major maintenance facilities - ideal for major repairs`);
      }
    }

    // Cultural recommendations
    if (context.culturalContext.name) {
      recommendations.push(`Cultural event impact: ${context.culturalContext.metroImpact}`);
      recommendations.push(`Special services: ${context.culturalContext.specialServices}`);
    }

    return recommendations;
  }

  /**
   * Check if festival is currently active
   * @param {Object} festival - Festival object
   * @param {number} month - Current month
   * @param {number} day - Current day
   * @returns {boolean} Is festival active
   */
  static isFestivalActive(festival, month, day) {
    // Simplified festival date checking
    const festivalDates = {
      "Onam": { month: 8, dayRange: [15, 25] },
      "Vishu": { month: 4, dayRange: [14, 16] },
      "Christmas": { month: 12, dayRange: [24, 26] },
      "New Year": { month: 12, dayRange: [31, 31] }
    };

    const festivalDate = festivalDates[festival.name];
    if (festivalDate) {
      return month === festivalDate.month && 
             day >= festivalDate.dayRange[0] && 
             day <= festivalDate.dayRange[1];
    }

    return false;
  }

  /**
   * Get seasonal recommendations
   * @param {string} season - Current season
   * @returns {Array} Seasonal recommendations
   */
  static getSeasonalRecommendations(season) {
    const recommendations = {
      monsoon: [
        "Monitor weather conditions for service adjustments",
        "Ensure rain protection facilities are functional",
        "Prepare for potential service delays due to weather"
      ],
      winter: [
        "High tourist season - prepare for increased ridership",
        "Ensure tourist information services are available",
        "Monitor heritage site connectivity"
      ],
      summer: [
        "Moderate ridership expected",
        "Focus on regular maintenance and improvements",
        "Prepare for upcoming festival season"
      ]
    };

    return recommendations[season] || [];
  }

  /**
   * Get operational recommendations
   * @param {boolean} isPeak - Is peak hour
   * @param {boolean} isNight - Is night time
   * @param {boolean} isMaintenance - Is maintenance window
   * @returns {Array} Operational recommendations
   */
  static getOperationalRecommendations(isPeak, isNight, isMaintenance) {
    if (isMaintenance) {
      return [
        "Maintenance window active - focus on system upkeep",
        "Ensure all safety protocols are followed",
        "Prepare for next day's operations"
      ];
    }

    if (isPeak) {
      return [
        "Peak hour operations - maximum efficiency required",
        "Monitor crowd density and adjust services",
        "Ensure all trains are operational"
      ];
    }

    if (isNight) {
      return [
        "Night operations - reduced frequency",
        "Ensure adequate security coverage",
        "Monitor for any maintenance needs"
      ];
    }

    return [
      "Normal operations - standard procedures apply",
      "Monitor system performance",
      "Prepare for peak hour transitions"
    ];
  }

  /**
   * Get station-specific recommendations
   * @param {Object} station - Station object
   * @returns {Array} Station recommendations
   */
  static getStationRecommendations(station) {
    const recommendations = [];

    if (station.type === "Terminal") {
      recommendations.push("Terminal station - ensure adequate parking and connectivity");
      recommendations.push("Monitor intermodal connectivity (bus, auto, taxi)");
    }

    if (station.type === "Commercial") {
      recommendations.push("Commercial hub - monitor peak shopping hours");
      recommendations.push("Ensure food court and retail facilities are operational");
    }

    if (station.type === "Educational") {
      recommendations.push("Educational station - monitor student rush hours");
      recommendations.push("Ensure student facilities and discounts are available");
    }

    if (station.runningBays >= 4) {
      recommendations.push("Major maintenance facility - ideal for comprehensive repairs");
    }

    if (station.dailyRidership > 6000) {
      recommendations.push("High-ridership station - monitor crowd management");
    }

    return recommendations;
  }

  /**
   * Generate comprehensive response context
   * @param {string} query - User query
   * @param {Object} systemState - Current system state
   * @returns {string} Enhanced prompt
   */
  static generateEnhancedPrompt(query, systemState = {}) {
    const context = this.generateContext(query, systemState);
    
    return `You are an advanced AI assistant for the KMRC (Kochi Metro Rail Limited) Metro System. You have comprehensive knowledge about metro operations, cultural events, and local context.

## CURRENT CONTEXT:
- Time: ${context.currentTime} (${context.currentDate})
- Season: ${context.season.name} (Impact: ${context.season.impact})
- Festival: ${context.festival.name} (Impact: ${context.festival.impact})
- Operational Status: ${context.operationalContext.status}
- Frequency: ${context.operationalContext.frequency}

## INTELLIGENT RECOMMENDATIONS:
${context.recommendations.map(rec => `- ${rec}`).join('\n')}

## STATION CONTEXT:
${context.stationContext.station ? `- Station: ${context.stationContext.station} (${context.stationContext.code})
- Type: ${context.stationContext.type}
- Running Bays: ${context.stationContext.runningBays}
- Daily Ridership: ${context.stationContext.ridership}
- Special Features: ${context.stationContext.specialFeatures.join(', ')}` : '- General metro information'}

## CULTURAL CONTEXT:
${context.culturalContext.name ? `- Event: ${context.culturalContext.name}
- Type: ${context.culturalContext.type}
- Metro Impact: ${context.culturalContext.metroImpact}
- Special Services: ${context.culturalContext.specialServices}` : '- Regular operations'}

## YOUR RESPONSE SHOULD:
1. Be contextually aware of current time, season, and events
2. Provide proactive recommendations based on the situation
3. Include relevant cultural and operational insights
4. Offer specific, actionable advice
5. Anticipate follow-up questions and needs
6. Use appropriate language (English, Malayalam, or Hindi as needed)

User Query: ${query}`;
  }
}

export default AdvancedKMRCTrainingService;
