// ML Optimization Engine for KMRL Train Induction System
// Implements multi-objective optimization for train deployment decisions

class MLOptimizationEngine {
  constructor() {
    this.constraints = {
      fitnessCertificates: { weight: 0.25, critical: true },
      jobCardStatus: { weight: 0.20, critical: true },
      brandingPriorities: { weight: 0.15, critical: false },
      mileageBalancing: { weight: 0.15, critical: false },
      cleaningDetailing: { weight: 0.10, critical: false },
      stablingGeometry: { weight: 0.15, critical: false }
    };
    
    this.objectives = {
      serviceReadiness: { weight: 0.4 },
      reliability: { weight: 0.3 },
      cost: { weight: 0.2 },
      brandingExposure: { weight: 0.1 }
    };
    
    this.optimizationHistory = [];
    this.isProcessing = false;
  }

  // Main optimization function
  async optimizeTrainInduction(trainData, requirements = {}) {
    if (this.isProcessing) {
      console.log('⏳ Optimization already in progress...');
      return null;
    }

    this.isProcessing = true;
    console.log('🧠 Starting ML Optimization for Train Induction...');

    try {
      // Step 1: Constraint Analysis
      const constraintAnalysis = this.analyzeConstraints(trainData);
      
      // Step 2: Multi-objective Optimization
      const optimizationResult = await this.runMultiObjectiveOptimization(trainData, constraintAnalysis);
      
      // Step 3: Generate Ranked Induction List
      const rankedList = this.generateRankedInductionList(optimizationResult);
      
      // Step 4: Conflict Detection
      const conflicts = this.detectConflicts(rankedList);
      
      // Step 5: Generate Recommendations
      const recommendations = this.generateRecommendations(rankedList, conflicts);
      
      const result = {
        timestamp: new Date(),
        rankedInductionList: rankedList,
        conflicts: conflicts,
        recommendations: recommendations,
        optimizationMetrics: optimizationResult.metrics,
        constraintAnalysis: constraintAnalysis,
        processingTime: Date.now() - this.startTime
      };

      // Store in history
      this.optimizationHistory.push(result);
      if (this.optimizationHistory.length > 10) {
        this.optimizationHistory.shift();
      }

      console.log('✅ ML Optimization Complete');
      return result;

    } catch (error) {
      console.error('❌ ML Optimization Error:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  // Analyze constraints for each train
  analyzeConstraints(trainData) {
    const analysis = {
      totalTrains: trainData.length,
      constraintViolations: {},
      complianceScores: {},
      criticalIssues: []
    };

    // Initialize constraint violation counters
    Object.keys(this.constraints).forEach(constraint => {
      analysis.constraintViolations[constraint] = 0;
    });

    trainData.forEach(train => {
      const trainId = train.id;
      const compliance = this.checkTrainCompliance(train);
      
      analysis.complianceScores[trainId] = compliance;
      
      // Count violations
      Object.keys(compliance.constraints).forEach(constraint => {
        if (!compliance.constraints[constraint].compliant) {
          analysis.constraintViolations[constraint]++;
          
          if (this.constraints[constraint].critical) {
            analysis.criticalIssues.push({
              trainId,
              constraint,
              issue: compliance.constraints[constraint].issue,
              severity: 'critical'
            });
          }
        }
      });
    });

    return analysis;
  }

  // Check compliance for individual train
  checkTrainCompliance(train) {
    const compliance = {
      trainId: train.id,
      overallScore: 0,
      constraints: {},
      recommendations: []
    };

    // 1. Fitness Certificates Check
    const fitnessCompliance = this.checkFitnessCertificates(train.fitnessCertificates);
    compliance.constraints.fitnessCertificates = fitnessCompliance;

    // 2. Job Card Status Check
    const jobCardCompliance = this.checkJobCardStatus(train.jobCardStatus);
    compliance.constraints.jobCardStatus = jobCardCompliance;

    // 3. Branding Priorities Check
    const brandingCompliance = this.checkBrandingPriorities(train.brandingPriorities);
    compliance.constraints.brandingPriorities = brandingCompliance;

    // 4. Mileage Balancing Check
    const mileageCompliance = this.checkMileageBalancing(train.mileageData);
    compliance.constraints.mileageBalancing = mileageCompliance;

    // 5. Cleaning & Detailing Check
    const cleaningCompliance = this.checkCleaningDetailing(train.cleaningStatus);
    compliance.constraints.cleaningDetailing = cleaningCompliance;

    // 6. Stabling Geometry Check
    const stablingCompliance = this.checkStablingGeometry(train.stablingGeometry);
    compliance.constraints.stablingGeometry = stablingCompliance;

    // Calculate overall compliance score
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.keys(compliance.constraints).forEach(constraint => {
      const constraintScore = compliance.constraints[constraint].score;
      const weight = this.constraints[constraint].weight;
      totalScore += constraintScore * weight;
      totalWeight += weight;
    });

    compliance.overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return compliance;
  }

  // Individual constraint checkers
  checkFitnessCertificates(fitnessData) {
    const issues = [];
    let score = 100;

    // Check each certificate type
    ['rollingStock', 'signalling', 'telecom'].forEach(certType => {
      if (fitnessData[certType] === 'expired') {
        issues.push(`${certType} certificate expired`);
        score -= 40;
      } else if (fitnessData[certType] === 'expiring_soon') {
        issues.push(`${certType} certificate expiring soon`);
        score -= 20;
      } else if (fitnessData[certType] === 'pending_renewal') {
        issues.push(`${certType} certificate pending renewal`);
        score -= 30;
      }
    });

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues: issues,
      lastUpdated: fitnessData.lastUpdated
    };
  }

  checkJobCardStatus(jobCardData) {
    const issues = [];
    let score = 100;

    if (jobCardData.openWorkOrders > 3) {
      issues.push(`Too many open work orders: ${jobCardData.openWorkOrders}`);
      score -= jobCardData.openWorkOrders * 10;
    }

    if (jobCardData.criticalIssues > 0) {
      issues.push(`Critical issues detected: ${jobCardData.criticalIssues}`);
      score -= 50;
    }

    // Check maintenance schedule
    const daysSinceLastMaintenance = Math.floor((new Date() - jobCardData.lastMaintenance) / (1000 * 60 * 60 * 24));
    if (daysSinceLastMaintenance > 30) {
      issues.push(`Overdue maintenance: ${daysSinceLastMaintenance} days`);
      score -= 25;
    }

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues: issues,
      openWorkOrders: jobCardData.openWorkOrders,
      criticalIssues: jobCardData.criticalIssues
    };
  }

  checkBrandingPriorities(brandingData) {
    const issues = [];
    let score = 100;

    const exposureRatio = brandingData.exposureHours / brandingData.requiredHours;
    
    if (exposureRatio < 0.8) {
      issues.push(`Low branding exposure: ${(exposureRatio * 100).toFixed(1)}%`);
      score -= (0.8 - exposureRatio) * 100;
    }

    if (brandingData.priority >= 7) {
      issues.push(`High branding priority: ${brandingData.priority}`);
      score -= 15;
    }

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues: issues,
      exposureRatio: exposureRatio,
      priority: brandingData.priority
    };
  }

  checkMileageBalancing(mileageData) {
    const issues = [];
    let score = 100;

    // Check wear levels
    const wearLevels = [mileageData.bogieWear, mileageData.brakePadWear, mileageData.hvacWear];
    const maxWear = Math.max(...wearLevels);
    const minWear = Math.min(...wearLevels);
    const wearDifference = maxWear - minWear;

    if (wearDifference > 30) {
      issues.push(`Uneven wear distribution: ${wearDifference.toFixed(1)}% difference`);
      score -= wearDifference;
    }

    if (maxWear > 80) {
      issues.push(`High wear level: ${maxWear.toFixed(1)}%`);
      score -= (maxWear - 80) * 2;
    }

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues: issues,
      wearDifference: wearDifference,
      maxWear: maxWear
    };
  }

  checkCleaningDetailing(cleaningData) {
    const issues = [];
    let score = 100;

    if (cleaningData.interiorCondition < 70) {
      issues.push(`Poor interior condition: ${cleaningData.interiorCondition.toFixed(1)}%`);
      score -= (70 - cleaningData.interiorCondition);
    }

    if (cleaningData.exteriorCondition < 70) {
      issues.push(`Poor exterior condition: ${cleaningData.exteriorCondition.toFixed(1)}%`);
      score -= (70 - cleaningData.exteriorCondition);
    }

    if (!cleaningData.manpowerAvailable) {
      issues.push('No cleaning manpower available');
      score -= 20;
    }

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues: issues,
      interiorCondition: cleaningData.interiorCondition,
      exteriorCondition: cleaningData.exteriorCondition
    };
  }

  checkStablingGeometry(stablingData) {
    const issues = [];
    let score = 100;

    if (stablingData.shuntingDistance > 300) {
      issues.push(`High shunting distance: ${stablingData.shuntingDistance}m`);
      score -= (stablingData.shuntingDistance - 300) / 10;
    }

    if (stablingData.accessibilityScore < 60) {
      issues.push(`Poor accessibility: ${stablingData.accessibilityScore.toFixed(1)}%`);
      score -= (60 - stablingData.accessibilityScore);
    }

    if (stablingData.currentBay !== stablingData.optimalBay) {
      issues.push(`Suboptimal bay position: ${stablingData.currentBay} vs ${stablingData.optimalBay}`);
      score -= 15;
    }

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues: issues,
      shuntingDistance: stablingData.shuntingDistance,
      accessibilityScore: stablingData.accessibilityScore
    };
  }

  // Multi-objective optimization using genetic algorithm approach
  async runMultiObjectiveOptimization(trainData, constraintAnalysis) {
    const startTime = Date.now();
    
    // Filter eligible trains (pass critical constraints)
    const eligibleTrains = trainData.filter(train => {
      const compliance = this.checkTrainCompliance(train);
      return compliance.constraints.fitnessCertificates.compliant && 
             compliance.constraints.jobCardStatus.compliant;
    });

    console.log(`📊 ${eligibleTrains.length}/${trainData.length} trains eligible for service`);

    // Calculate fitness scores for each train
    const trainScores = eligibleTrains.map(train => {
      const compliance = this.checkTrainCompliance(train);
      const operationalScore = this.calculateOperationalScore(train);
      const costScore = this.calculateCostScore(train);
      const brandingScore = this.calculateBrandingScore(train);
      
      const finalScore = (
        compliance.overallScore * this.objectives.reliability.weight +
        operationalScore * this.objectives.serviceReadiness.weight +
        costScore * this.objectives.cost.weight +
        brandingScore * this.objectives.brandingExposure.weight
      );

      return {
        trainId: train.id,
        finalScore: finalScore,
        complianceScore: compliance.overallScore,
        operationalScore: operationalScore,
        costScore: costScore,
        brandingScore: brandingScore,
        compliance: compliance
      };
    });

    // Sort by final score (descending)
    trainScores.sort((a, b) => b.finalScore - a.finalScore);

    return {
      eligibleTrains: eligibleTrains.length,
      totalTrains: trainData.length,
      trainScores: trainScores,
      metrics: {
        processingTime: Date.now() - startTime,
        averageScore: trainScores.reduce((sum, t) => sum + t.finalScore, 0) / trainScores.length,
        topScore: trainScores[0]?.finalScore || 0,
        bottomScore: trainScores[trainScores.length - 1]?.finalScore || 0
      }
    };
  }

  // Calculate operational readiness score
  calculateOperationalScore(train) {
    const operational = train.operationalData;
    let score = 0;

    // Punctuality score (40%)
    score += operational.punctualityScore * 0.4;

    // Energy efficiency (30%)
    const energyScore = Math.max(0, 100 - (operational.energyConsumption - 2.5) * 20);
    score += energyScore * 0.3;

    // Passenger load optimization (30%)
    const loadScore = operational.passengerLoad > 80 ? 100 : operational.passengerLoad * 1.25;
    score += loadScore * 0.3;

    return Math.min(100, score);
  }

  // Calculate cost efficiency score
  calculateCostScore(train) {
    let score = 100;

    // Mileage efficiency
    const mileageScore = Math.max(0, 100 - (train.mileageData.totalMileage / 1000));
    score += mileageScore * 0.3;

    // Maintenance cost (based on wear)
    const avgWear = (train.mileageData.bogieWear + train.mileageData.brakePadWear + train.mileageData.hvacWear) / 3;
    const maintenanceScore = Math.max(0, 100 - avgWear);
    score += maintenanceScore * 0.4;

    // Shunting cost
    const shuntingScore = Math.max(0, 100 - (train.stablingGeometry.shuntingDistance / 10));
    score += shuntingScore * 0.3;

    return Math.min(100, score / 2);
  }

  // Calculate branding exposure score
  calculateBrandingScore(train) {
    const branding = train.brandingPriorities;
    let score = 0;

    // Exposure ratio
    const exposureRatio = branding.exposureHours / branding.requiredHours;
    score += Math.min(100, exposureRatio * 100) * 0.6;

    // Priority bonus
    score += branding.priority * 5;

    // Contract type bonus
    const contractBonus = {
      'Premium': 20,
      'Standard': 10,
      'Basic': 5,
      'Emergency': 0
    };
    score += contractBonus[branding.currentContract] || 0;

    return Math.min(100, score);
  }

  // Generate ranked induction list
  generateRankedInductionList(optimizationResult) {
    return optimizationResult.trainScores.map((trainScore, index) => ({
      rank: index + 1,
      trainId: trainScore.trainId,
      finalScore: trainScore.finalScore,
      complianceScore: trainScore.complianceScore,
      operationalScore: trainScore.operationalScore,
      costScore: trainScore.costScore,
      brandingScore: trainScore.brandingScore,
      status: this.determineTrainStatus(trainScore),
      recommendation: this.generateTrainRecommendation(trainScore),
      compliance: trainScore.compliance
    }));
  }

  // Determine train status based on scores
  determineTrainStatus(trainScore) {
    if (trainScore.finalScore >= 80) return 'excellent';
    if (trainScore.finalScore >= 60) return 'good';
    if (trainScore.finalScore >= 40) return 'average';
    return 'poor';
  }

  // Generate recommendation for individual train
  generateTrainRecommendation(trainScore) {
    const recommendations = [];
    
    if (trainScore.complianceScore < 70) {
      recommendations.push('Address compliance issues before deployment');
    }
    
    if (trainScore.operationalScore < 60) {
      recommendations.push('Improve operational readiness');
    }
    
    if (trainScore.costScore < 50) {
      recommendations.push('High maintenance cost - consider alternatives');
    }
    
    if (trainScore.brandingScore > 80) {
      recommendations.push('Excellent for branding exposure');
    }

    return recommendations.length > 0 ? recommendations : ['Ready for deployment'];
  }

  // Detect conflicts in the ranked list
  detectConflicts(rankedList) {
    const conflicts = [];

    // Check for resource conflicts
    const bayUsage = new Map();
    const maintenanceSlots = new Map();

    rankedList.forEach(train => {
      // Check bay conflicts (simplified)
      const bay = this.getTrainBay(train.trainId);
      if (bayUsage.has(bay)) {
        conflicts.push({
          type: 'bay_conflict',
          trains: [bayUsage.get(bay), train.trainId],
          bay: bay,
          severity: 'medium'
        });
      } else {
        bayUsage.set(bay, train.trainId);
      }
    });

    return conflicts;
  }

  // Get train bay (simplified)
  getTrainBay(trainId) {
    // This would normally query the actual train data
    return `Bay-${trainId.split('-')[1]}`;
  }

  // Generate overall recommendations
  generateRecommendations(rankedList, conflicts) {
    const recommendations = [];

    // Top performers
    const topPerformers = rankedList.slice(0, 5);
    recommendations.push({
      type: 'deployment',
      message: `Deploy top ${topPerformers.length} trains for optimal performance`,
      trains: topPerformers.map(t => t.trainId),
      priority: 'high'
    });

    // Address conflicts
    if (conflicts.length > 0) {
      recommendations.push({
        type: 'conflict_resolution',
        message: `Resolve ${conflicts.length} resource conflicts before deployment`,
        conflicts: conflicts,
        priority: 'critical'
      });
    }

    // Maintenance recommendations
    const maintenanceNeeded = rankedList.filter(t => t.complianceScore < 60);
    if (maintenanceNeeded.length > 0) {
      recommendations.push({
        type: 'maintenance',
        message: `${maintenanceNeeded.length} trains require maintenance before deployment`,
        trains: maintenanceNeeded.map(t => t.trainId),
        priority: 'medium'
      });
    }

    return recommendations;
  }

  // Get optimization history
  getOptimizationHistory() {
    return this.optimizationHistory;
  }

  // Get current processing status
  getProcessingStatus() {
    return {
      isProcessing: this.isProcessing,
      lastOptimization: this.optimizationHistory[this.optimizationHistory.length - 1] || null
    };
  }
}

// Export singleton instance
export default new MLOptimizationEngine();
