import NetlifyAPIService from './NetlifyAPIService';

class DeploymentService {
  constructor() {
    this.optimizationResults = null;
    this.selectedTrains = new Set();
  }

  async optimizeDeployment(selectedTrains, constraints = {}) {
    try {
      const trainArray = Array.from(selectedTrains);
      
      const response = await NetlifyAPIService.optimizeDeployment(trainArray, constraints);
      
      if (response.success) {
        this.optimizationResults = response.data;
        return response.data;
      } else {
        throw new Error(response.error || 'Optimization failed');
      }
    } catch (error) {
      console.error('Deployment optimization error:', error);
      throw error;
    }
  }

  getOptimizationResults() {
    return this.optimizationResults;
  }

  addSelectedTrain(train) {
    this.selectedTrains.add(train);
  }

  removeSelectedTrain(train) {
    this.selectedTrains.delete(train);
  }

  getSelectedTrains() {
    return Array.from(this.selectedTrains);
  }

  clearSelectedTrains() {
    this.selectedTrains.clear();
  }

  isTrainSelected(train) {
    return this.selectedTrains.has(train);
  }

  toggleTrainSelection(train) {
    if (this.isTrainSelected(train)) {
      this.removeSelectedTrain(train);
    } else {
      this.addSelectedTrain(train);
    }
  }

  getSelectionCount() {
    return this.selectedTrains.size;
  }

  // Validate deployment readiness
  validateDeployment() {
    if (this.selectedTrains.size === 0) {
      return {
        valid: false,
        message: 'No trains selected for deployment',
        errors: ['Please select at least one train']
      };
    }

    const trains = this.getSelectedTrains();
    const violations = this.getTotalViolations(trains);
    const avgScore = this.getAverageScore(trains);

    const errors = [];
    
    if (violations.fitness > 0) {
      errors.push(`${violations.fitness} trains have fitness certificate violations`);
    }
    
    if (violations.jobCards > 0) {
      errors.push(`${violations.jobCards} trains have job card violations`);
    }
    
    if (avgScore < 0.6) {
      errors.push('Average performance score is below recommended threshold');
    }

    return {
      valid: errors.length === 0,
      message: errors.length === 0 ? 'Deployment ready' : 'Deployment needs attention',
      errors,
      warnings: this.getWarnings(trains)
    };
  }

  getTotalViolations(trains) {
    return trains.reduce((acc, train) => {
      const violations = train.violations || {};
      acc.fitness += violations.fitness || 0;
      acc.jobCards += violations.jobCards || 0;
      acc.cleaning += violations.cleaning || 0;
      acc.branding += violations.branding || 0;
      return acc;
    }, { fitness: 0, jobCards: 0, cleaning: 0, branding: 0 });
  }

  getAverageScore(trains) {
    if (trains.length === 0) return 0;
    const totalScore = trains.reduce((sum, train) => sum + (train.score || 0), 0);
    return totalScore / trains.length;
  }

  getWarnings(trains) {
    const warnings = [];
    const avgEfficiency = this.getAverageEfficiency(trains);
    const avgReliability = this.getAverageReliability(trains);

    if (avgEfficiency < 80) {
      warnings.push('Average efficiency is below optimal range');
    }

    if (avgReliability < 85) {
      warnings.push('Average reliability is below recommended threshold');
    }

    return warnings;
  }

  getAverageEfficiency(trains) {
    if (trains.length === 0) return 0;
    const totalEfficiency = trains.reduce((sum, train) => sum + (train.efficiency || 0), 0);
    return totalEfficiency / trains.length;
  }

  getAverageReliability(trains) {
    if (trains.length === 0) return 0;
    const totalReliability = trains.reduce((sum, train) => sum + (train.reliability || 0), 0);
    return totalReliability / trains.length;
  }

  // Generate deployment summary
  generateDeploymentSummary() {
    const trains = this.getSelectedTrains();
    const validation = this.validateDeployment();
    
    return {
      selectedCount: trains.length,
      validation,
      metrics: {
        avgScore: this.getAverageScore(trains),
        avgEfficiency: this.getAverageEfficiency(trains),
        avgReliability: this.getAverageReliability(trains),
        violations: this.getTotalViolations(trains)
      },
      recommendations: this.getRecommendations(trains)
    };
  }

  getRecommendations(trains) {
    const recommendations = [];
    const violations = this.getTotalViolations(trains);
    const avgScore = this.getAverageScore(trains);

    if (violations.fitness > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Address Fitness Violations',
        description: `${violations.fitness} trains need fitness certificate updates`,
        priority: 'high'
      });
    }

    if (violations.jobCards > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Complete Job Cards',
        description: `${violations.jobCards} trains have incomplete job cards`,
        priority: 'medium'
      });
    }

    if (avgScore < 0.7) {
      recommendations.push({
        type: 'info',
        title: 'Consider Performance',
        description: 'Some trains have below-average performance scores',
        priority: 'low'
      });
    }

    return recommendations;
  }
}

export default new DeploymentService();
