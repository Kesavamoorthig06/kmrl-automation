const fs = require('fs');
const path = require('path');

/**
 * Netlify Function: Dashboard Data
 * Provides comprehensive dashboard data including ML analysis, charts, and metrics
 */

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { type } = event.queryStringParameters || {};
        
        let result = {};
        
        switch (type) {
            case 'ml_analysis':
                result = await getMLAnalysisData();
                break;
            case 'charts':
                result = await getChartData();
                break;
            case 'metrics':
                result = await getMetricsData();
                break;
            case 'alerts':
                result = await getAlertsData();
                break;
            default:
                result = await getAllDashboardData();
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                type: type || 'all',
                data: result,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error getting dashboard data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to get dashboard data',
                error: error.message
            })
        };
    }
};

async function getMLAnalysisData() {
    const mlDataPath = path.join(process.cwd(), 'public', 'ml_analysis_data.csv');
    
    if (!fs.existsSync(mlDataPath)) {
        return { trains: [], summary: {} };
    }

    const csvContent = fs.readFileSync(mlDataPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    const trains = lines.slice(1).filter(line => line.trim()).map((line, index) => {
        const values = line.split(',').map(v => v.replace(/"/g, ''));
        const row = {};
        headers.forEach((header, i) => {
            row[header] = values[i] || '';
        });
        
        return {
            id: row.train_id,
            rank: index + 1,
            status: row.status === 'Available' ? 'Available' : 'Unavailable',
            location: row.stabling_bay,
            lastMaintenance: row.last_cleaned_date,
            mileage: parseInt(row.mileage) || 0,
            performance: parseFloat(row.prelim_score) || 0,
            score: parseFloat(row.prelim_score) || 0,
            branding_priority: parseInt(row.branding_priority) || 0,
            assignment: row.assignment,
            fitnessValid: row.fitness_certificate_valid === 'Yes',
            jobCardStatus: row.job_card_status,
            explanation: row.explanation,
            stabling_bay: row.stabling_bay,
            last_cleaned_date: row.last_cleaned_date,
            mileageScore: parseFloat(row.mileage_score) || 0,
            brandingScore: parseFloat(row.branding_score) || 0,
            cleaningScore: parseFloat(row.cleaning_score) || 0,
            shuntingScore: parseFloat(row.shunting_score) || 0,
            finalScoreGA: parseFloat(row.final_score_ga) || 0,
            totalShuntingCost: parseFloat(row.total_shunting_cost) || 0,
            countPenalty: parseInt(row.count_penalty) || 0,
            shuntPenalty: parseInt(row.shunt_penalty) || 0,
            brandingShortfall: row.branding_shortfall === 'True'
        };
    });

    // Calculate summary
    const availableTrains = trains.filter(t => t.status === 'Available');
    const maintenanceTrains = trains.filter(t => t.status === 'Unavailable');
    const avgScore = trains.reduce((sum, train) => sum + train.score, 0) / trains.length;
    const avgMileage = trains.reduce((sum, train) => sum + train.mileage, 0) / trains.length;

    const summary = {
        totalTrains: trains.length,
        availableTrains: availableTrains.length,
        maintenanceTrains: maintenanceTrains.length,
        avgPerformance: parseFloat(avgScore.toFixed(2)),
        avgMileage: Math.round(avgMileage),
        topPerformer: availableTrains.length > 0 
            ? availableTrains.reduce((top, train) => train.score > top.score ? train : top)
            : null,
        lastUpdate: new Date().toISOString()
    };

    return { trains, summary };
}

async function getChartData() {
    const mlData = await getMLAnalysisData();
    const trains = mlData.trains;

    // Fleet status distribution
    const fleetStatusData = {
        available: trains.filter(t => t.status === 'Available').length,
        maintenance: trains.filter(t => t.status === 'Unavailable').length,
        deployed: trains.filter(t => t.assignment === 'Service').length,
        standby: trains.filter(t => t.assignment === 'Standby').length
    };

    // Performance distribution
    const performanceDistribution = {
        excellent: trains.filter(t => t.score >= 0.9).length,
        good: trains.filter(t => t.score >= 0.7 && t.score < 0.9).length,
        fair: trains.filter(t => t.score >= 0.5 && t.score < 0.7).length,
        poor: trains.filter(t => t.score < 0.5).length
    };

    // Constraint violations
    const constraintViolations = {
        fitnessCertificates: trains.filter(t => !t.fitnessValid).length,
        jobCardStatus: trains.filter(t => t.jobCardStatus !== 'Clear').length,
        cleaningDetailing: trains.filter(t => t.cleaningScore < 0.8).length,
        brandingPriorities: trains.filter(t => t.brandingScore < 0.5).length
    };

    // Mileage distribution
    const mileageRanges = [
        { range: '0-5000', count: trains.filter(t => t.mileage >= 0 && t.mileage <= 5000).length },
        { range: '5000-10000', count: trains.filter(t => t.mileage > 5000 && t.mileage <= 10000).length },
        { range: '10000-15000', count: trains.filter(t => t.mileage > 10000 && t.mileage <= 15000).length },
        { range: '15000-20000', count: trains.filter(t => t.mileage > 15000 && t.mileage <= 20000).length },
        { range: '20000+', count: trains.filter(t => t.mileage > 20000).length }
    ];

    return {
        fleetStatus: fleetStatusData,
        performanceDistribution,
        constraintViolations,
        mileageDistribution: mileageRanges
    };
}

async function getMetricsData() {
    const mlData = await getMLAnalysisData();
    const trains = mlData.trains;

    const availableTrains = trains.filter(t => t.status === 'Available');
    const maintenanceTrains = trains.filter(t => t.status === 'Unavailable');

    // Calculate metrics
    const avgScore = trains.reduce((sum, train) => sum + train.score, 0) / trains.length;
    const avgMileage = trains.reduce((sum, train) => sum + train.mileage, 0) / trains.length;
    const avgBrandingPriority = trains.reduce((sum, train) => sum + train.branding_priority, 0) / trains.length;

    // Efficiency metrics
    const efficiencyScore = Math.round(avgScore * 100);
    const reliabilityScore = trains.filter(t => t.score > 0.7).length;
    const reliabilityRate = (reliabilityScore / trains.length) * 100;
    const utilizationRate = (availableTrains.length / trains.length) * 100;

    // Cost metrics (simulated)
    const totalCost = 11240; // Million rupees
    const maintenanceCost = maintenanceTrains.length * 150; // 150M per maintenance train
    const operationalCost = totalCost - maintenanceCost;

    return {
        performance: {
            avgScore: parseFloat(avgScore.toFixed(2)),
            avgMileage: Math.round(avgMileage),
            avgBrandingPriority: parseFloat(avgBrandingPriority.toFixed(1)),
            efficiencyScore,
            reliabilityScore,
            reliabilityRate: parseFloat(reliabilityRate.toFixed(1)),
            utilizationRate: parseFloat(utilizationRate.toFixed(1))
        },
        costs: {
            total: totalCost,
            maintenance: maintenanceCost,
            operational: operationalCost
        },
        counts: {
            total: trains.length,
            available: availableTrains.length,
            maintenance: maintenanceTrains.length,
            service: 14, // Fixed service count
            standby: 5   // Fixed standby count
        }
    };
}

async function getAlertsData() {
    const mlData = await getMLAnalysisData();
    const trains = mlData.trains;

    const alerts = [];

    // Critical alerts for maintenance trains
    const maintenanceTrains = trains.filter(t => t.status === 'Unavailable');
    maintenanceTrains.forEach(train => {
        alerts.push({
            type: 'critical',
            trainId: train.id,
            message: train.explanation || 'Train requires maintenance',
            timestamp: new Date().toISOString(),
            priority: 'high'
        });
    });

    // Warning alerts for low-performing available trains
    const lowPerformingTrains = trains.filter(t => t.status === 'Available' && t.score < 0.7);
    if (lowPerformingTrains.length > 0) {
        alerts.push({
            type: 'warning',
            message: `${lowPerformingTrains.length} trains with low performance scores`,
            trains: lowPerformingTrains.map(t => t.id),
            timestamp: new Date().toISOString(),
            priority: 'medium'
        });
    }

    // Info alerts for high-performing trains
    const highPerformingTrains = trains.filter(t => t.status === 'Available' && t.score >= 0.95);
    if (highPerformingTrains.length > 0) {
        alerts.push({
            type: 'info',
            message: `${highPerformingTrains.length} trains with excellent performance`,
            trains: highPerformingTrains.map(t => t.id),
            timestamp: new Date().toISOString(),
            priority: 'low'
        });
    }

    // Branding shortfall alerts
    const brandingShortfallTrains = trains.filter(t => t.brandingShortfall);
    if (brandingShortfallTrains.length > 0) {
        alerts.push({
            type: 'warning',
            message: `${brandingShortfallTrains.length} trains with branding shortfall`,
            trains: brandingShortfallTrains.map(t => t.id),
            timestamp: new Date().toISOString(),
            priority: 'medium'
        });
    }

    return {
        alerts,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.type === 'critical').length,
        warningAlerts: alerts.filter(a => a.type === 'warning').length,
        infoAlerts: alerts.filter(a => a.type === 'info').length
    };
}

async function getAllDashboardData() {
    const [mlData, chartData, metricsData, alertsData] = await Promise.all([
        getMLAnalysisData(),
        getChartData(),
        getMetricsData(),
        getAlertsData()
    ]);

    return {
        mlData,
        chartData,
        metricsData,
        alertsData,
        lastUpdate: new Date().toISOString()
    };
}
