exports.handler = async (event, context) => {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    const { selectedTrains, constraints } = JSON.parse(event.body || '{}');

    if (!selectedTrains || !Array.isArray(selectedTrains)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Selected trains array is required'
        })
      };
    }

    // Run optimization algorithm
    const optimization = await runOptimization(selectedTrains, constraints);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: optimization
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

async function runOptimization(selectedTrains, constraints = {}) {
  // Simulate optimization processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  const totalTrains = selectedTrains.length;
  const avgScore = selectedTrains.reduce((sum, train) => sum + (train.score || 0), 0) / totalTrains;
  const avgEfficiency = selectedTrains.reduce((sum, train) => sum + (train.efficiency || 0), 0) / totalTrains;
  const avgReliability = selectedTrains.reduce((sum, train) => sum + (train.reliability || 0), 0) / totalTrains;

  // Calculate constraint violations
  const violations = {
    fitness: selectedTrains.filter(train => (train.violations?.fitness || 0) > 0).length,
    jobCards: selectedTrains.filter(train => (train.violations?.jobCards || 0) > 0).length,
    cleaning: selectedTrains.filter(train => (train.violations?.cleaning || 0) > 0).length,
    branding: selectedTrains.filter(train => (train.violations?.branding || 0) > 0).length
  };

  const totalViolations = Object.values(violations).reduce((sum, count) => sum + count, 0);

  // Calculate costs
  const totalCost = selectedTrains.reduce((sum, train) => {
    const cost = train.cost || {};
    return sum + (cost.operational || 0) + (cost.maintenance || 0) + (cost.energy || 0);
  }, 0);

  // Generate optimization results
  const results = {
    summary: {
      totalTrains,
      avgScore: Math.round(avgScore * 100) / 100,
      avgEfficiency: Math.round(avgEfficiency * 100) / 100,
      avgReliability: Math.round(avgReliability * 100) / 100,
      totalViolations,
      totalCost: Math.round(totalCost),
      optimizationScore: calculateOptimizationScore(avgScore, avgEfficiency, avgReliability, totalViolations)
    },
    violations,
    recommendations: generateRecommendations(violations, avgScore, avgEfficiency),
    deployment: {
      status: totalViolations === 0 ? 'Ready' : 'Needs Attention',
      priority: getDeploymentPriority(totalViolations, avgScore),
      estimatedTime: calculateDeploymentTime(totalViolations),
      riskLevel: calculateRiskLevel(totalViolations, avgScore)
    },
    metrics: {
      efficiency: {
        current: avgEfficiency,
        target: 90,
        status: avgEfficiency >= 90 ? 'excellent' : avgEfficiency >= 80 ? 'good' : 'needs_improvement'
      },
      reliability: {
        current: avgReliability,
        target: 95,
        status: avgReliability >= 95 ? 'excellent' : avgReliability >= 85 ? 'good' : 'needs_improvement'
      },
      cost: {
        current: totalCost,
        budget: totalTrains * 1000,
        status: totalCost <= totalTrains * 1000 ? 'within_budget' : 'over_budget'
      }
    },
    insights: generateInsights(selectedTrains, violations, avgScore, avgEfficiency),
    charts: {
      scoreDistribution: generateScoreDistribution(selectedTrains),
      efficiencyTrend: generateEfficiencyTrend(selectedTrains),
      violationBreakdown: generateViolationBreakdown(violations),
      costAnalysis: generateCostAnalysis(selectedTrains)
    }
  };

  return results;
}

function calculateOptimizationScore(avgScore, avgEfficiency, avgReliability, totalViolations) {
  const scoreWeight = 0.3;
  const efficiencyWeight = 0.3;
  const reliabilityWeight = 0.3;
  const violationWeight = 0.1;
  
  const violationPenalty = Math.min(totalViolations * 5, 50);
  
  return Math.max(0, Math.round(
    (avgScore * scoreWeight + 
     avgEfficiency * efficiencyWeight + 
     avgReliability * reliabilityWeight) * 100 - 
    violationPenalty
  ));
}

function generateRecommendations(violations, avgScore, avgEfficiency) {
  const recommendations = [];
  
  if (violations.fitness > 0) {
    recommendations.push({
      type: 'critical',
      title: 'Fitness Certificate Issues',
      description: `${violations.fitness} trains have fitness certificate violations. Address before deployment.`,
      action: 'Update fitness certificates'
    });
  }
  
  if (violations.jobCards > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Job Card Violations',
      description: `${violations.jobCards} trains have job card issues. Review and update.`,
      action: 'Complete job card requirements'
    });
  }
  
  if (avgEfficiency < 80) {
    recommendations.push({
      type: 'info',
      title: 'Efficiency Improvement',
      description: 'Consider optimizing train selection for better efficiency.',
      action: 'Review train performance metrics'
    });
  }
  
  if (avgScore < 0.7) {
    recommendations.push({
      type: 'warning',
      title: 'Low Performance Score',
      description: 'Selected trains have below-average performance scores.',
      action: 'Consider alternative train selection'
    });
  }
  
  return recommendations;
}

function getDeploymentPriority(totalViolations, avgScore) {
  if (totalViolations === 0 && avgScore >= 0.8) return 'high';
  if (totalViolations <= 2 && avgScore >= 0.7) return 'medium';
  return 'low';
}

function calculateDeploymentTime(totalViolations) {
  const baseTime = 30; // minutes
  const violationTime = totalViolations * 15; // 15 minutes per violation
  return baseTime + violationTime;
}

function calculateRiskLevel(totalViolations, avgScore) {
  if (totalViolations === 0 && avgScore >= 0.8) return 'low';
  if (totalViolations <= 2 && avgScore >= 0.6) return 'medium';
  return 'high';
}

function generateInsights(selectedTrains, violations, avgScore, avgEfficiency) {
  const insights = [];
  
  insights.push({
    type: 'success',
    title: 'Deployment Ready',
    description: `${selectedTrains.length} trains selected for deployment`,
    value: selectedTrains.length
  });
  
  if (avgEfficiency >= 85) {
    insights.push({
      type: 'success',
      title: 'High Efficiency',
      description: `Average efficiency of ${avgEfficiency.toFixed(1)}%`,
      value: avgEfficiency.toFixed(1) + '%'
    });
  }
  
  if (totalViolations === 0) {
    insights.push({
      type: 'success',
      title: 'No Violations',
      description: 'All selected trains meet compliance requirements',
      value: '0'
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Constraint Violations',
      description: `${Object.values(violations).reduce((sum, count) => sum + count, 0)} total violations`,
      value: Object.values(violations).reduce((sum, count) => sum + count, 0)
    });
  }
  
  return insights;
}

function generateScoreDistribution(selectedTrains) {
  const scores = selectedTrains.map(train => train.score || 0);
  return {
    labels: ['0.0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0'],
    data: [0, 0, 0, 0, 0].map((_, i) => {
      const min = i * 0.2;
      const max = (i + 1) * 0.2;
      return scores.filter(score => score >= min && score < max).length;
    })
  };
}

function generateEfficiencyTrend(selectedTrains) {
  const efficiencies = selectedTrains.map(train => train.efficiency || 0);
  return {
    labels: ['Train 1', 'Train 2', 'Train 3', 'Train 4', 'Train 5'],
    data: efficiencies.slice(0, 5)
  };
}

function generateViolationBreakdown(violations) {
  return {
    labels: ['Fitness', 'Job Cards', 'Cleaning', 'Branding'],
    data: [
      violations.fitness,
      violations.jobCards,
      violations.cleaning,
      violations.branding
    ]
  };
}

function generateCostAnalysis(selectedTrains) {
  const costs = selectedTrains.reduce((acc, train) => {
    const cost = train.cost || {};
    acc.operational += cost.operational || 0;
    acc.maintenance += cost.maintenance || 0;
    acc.energy += cost.energy || 0;
    return acc;
  }, { operational: 0, maintenance: 0, energy: 0 });
  
  return {
    labels: ['Operational', 'Maintenance', 'Energy'],
    data: [costs.operational, costs.maintenance, costs.energy]
  };
}
