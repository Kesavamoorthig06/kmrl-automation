const fs = require('fs');
const path = require('path');

/**
 * Netlify Function: Get Analytics Data
 * Provides real-time analytics and dashboard data
 */

function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        data.push(row);
    }

    return data;
}

function loadAllData() {
    const csvFiles = {
        'fitness_certificates': 'public/train_fitness_certificates.csv',
        'job_cards': 'public/train_job_cards.csv', 
        'branding_priorities': 'public/train_branding_priorities.csv',
        'mileage_data': 'public/train_mileage_data.csv',
        'cleaning_status': 'public/train_cleaning_status.csv',
        'stabling_geometry': 'public/train_stabling_geometry.csv',
        'ml_analysis': 'public/ml_analysis_data.csv'
    };

    const data = {};
    
    for (const [name, filePath] of Object.entries(csvFiles)) {
        try {
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
                const csvContent = fs.readFileSync(fullPath, 'utf8');
                data[name] = parseCSV(csvContent);
            }
        } catch (error) {
            console.error(`Error loading ${name}:`, error);
            data[name] = [];
        }
    }
    
    return data;
}

function generateDashboardSummary(data) {
    const totalTrains = new Set();
    
    // Collect all unique train IDs
    Object.values(data).forEach(dataset => {
        dataset.forEach(row => {
            if (row.train_id) totalTrains.add(row.train_id);
        });
    });

    const totalTrainCount = totalTrains.size;

    // Calculate operational status
    const fitnessData = data.fitness_certificates || [];
    const jobCardData = data.job_cards || [];
    
    let operational = 0;
    let maintenance = 0;
    let outOfService = 0;

    Array.from(totalTrains).forEach(trainId => {
        const fitness = fitnessData.find(f => f.train_id === trainId);
        const jobCard = jobCardData.find(j => j.train_id === trainId);
        
        if (fitness?.compliance_status === 'compliant' && jobCard?.job_card_status === 'completed') {
            operational++;
        } else if (jobCard?.job_card_status === 'open' || jobCard?.critical_issues > 0) {
            maintenance++;
        } else {
            outOfService++;
        }
    });

    // Calculate performance metrics
    const mileageData = data.mileage_data || [];
    const totalMileage = mileageData.reduce((sum, train) => {
        return sum + (parseFloat(train.total_mileage) || 0);
    }, 0);

    const avgEfficiency = mileageData.length > 0 
        ? mileageData.reduce((sum, train) => sum + (parseFloat(train.mileage_efficiency) || 0), 0) / mileageData.length
        : 0;

    return {
        totalTrains: totalTrainCount,
        operational,
        maintenance,
        outOfService,
        totalMileage: Math.round(totalMileage),
        avgEfficiency: Math.round(avgEfficiency * 100) / 100,
        operationalPercentage: Math.round((operational / totalTrainCount) * 100)
    };
}

function generatePerformanceMetrics(data) {
    const cleaningData = data.cleaning_status || [];
    const brandingData = data.branding_priorities || [];
    const stablingData = data.stabling_geometry || [];
    const mileageData = data.mileage_data || [];

    // Cleaning metrics
    const avgCleaningScore = cleaningData.length > 0
        ? cleaningData.reduce((sum, train) => sum + (parseInt(train.cleaning_score) || 0), 0) / cleaningData.length
        : 0;

    // Branding metrics  
    const avgBrandingCompletion = brandingData.length > 0
        ? brandingData.reduce((sum, train) => sum + (parseInt(train.completion_percentage) || 0), 0) / brandingData.length
        : 0;

    // Operational efficiency
    const avgOperationalEfficiency = stablingData.length > 0
        ? stablingData.reduce((sum, train) => sum + (parseInt(train.operational_efficiency) || 0), 0) / stablingData.length
        : 0;

    // Performance score
    const avgPerformanceScore = mileageData.length > 0
        ? mileageData.reduce((sum, train) => sum + (parseInt(train.performance_score) || 0), 0) / mileageData.length
        : 0;

    return {
        cleaning: Math.round(avgCleaningScore),
        branding: Math.round(avgBrandingCompletion),
        operational: Math.round(avgOperationalEfficiency),
        performance: Math.round(avgPerformanceScore),
        overall: Math.round((avgCleaningScore + avgBrandingCompletion + avgOperationalEfficiency + avgPerformanceScore) / 4)
    };
}

function generateAlerts(data) {
    const alerts = [];
    const currentDate = new Date();

    // Fitness certificate expiry alerts
    const fitnessData = data.fitness_certificates || [];
    fitnessData.forEach(train => {
        if (train.certificate_expiry_date) {
            const expiryDate = new Date(train.certificate_expiry_date);
            const daysToExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
            
            if (daysToExpiry <= 30 && daysToExpiry > 0) {
                alerts.push({
                    type: 'warning',
                    trainId: train.train_id,
                    message: `Fitness certificate expires in ${daysToExpiry} days`,
                    timestamp: new Date()
                });
            } else if (daysToExpiry <= 0) {
                alerts.push({
                    type: 'critical',
                    trainId: train.train_id,
                    message: `Fitness certificate expired`,
                    timestamp: new Date()
                });
            }
        }
    });

    // Job card alerts
    const jobCardData = data.job_cards || [];
    jobCardData.forEach(train => {
        if (train.job_card_status === 'open') {
            const criticalIssues = parseInt(train.critical_issues) || 0;
            if (criticalIssues > 0) {
                alerts.push({
                    type: 'critical',
                    trainId: train.train_id,
                    message: `${criticalIssues} critical issues pending`,
                    timestamp: new Date()
                });
            } else {
                alerts.push({
                    type: 'info',
                    trainId: train.train_id,
                    message: `Job card pending completion`,
                    timestamp: new Date()
                });
            }
        }
    });

    // Cleaning alerts
    const cleaningData = data.cleaning_status || [];
    cleaningData.forEach(train => {
        const cleaningScore = parseInt(train.cleaning_score) || 0;
        if (cleaningScore < 70) {
            alerts.push({
                type: 'warning',
                trainId: train.train_id,
                message: `Low cleaning score: ${cleaningScore}%`,
                timestamp: new Date()
            });
        }
    });

    return alerts.sort((a, b) => {
        const priority = { critical: 3, warning: 2, info: 1 };
        return priority[b.type] - priority[a.type];
    });
}

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
        // Load all data
        const data = loadAllData();
        
        // Generate analytics
        const summary = generateDashboardSummary(data);
        const performance = generatePerformanceMetrics(data);
        const alerts = generateAlerts(data);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                timestamp: new Date().toISOString(),
                data: {
                    summary,
                    performance,
                    alerts,
                    rawDataCounts: {
                        fitness_certificates: data.fitness_certificates?.length || 0,
                        job_cards: data.job_cards?.length || 0,
                        branding_priorities: data.branding_priorities?.length || 0,
                        mileage_data: data.mileage_data?.length || 0,
                        cleaning_status: data.cleaning_status?.length || 0,
                        stabling_geometry: data.stabling_geometry?.length || 0,
                        ml_analysis: data.ml_analysis?.length || 0
                    }
                }
            })
        };
    } catch (error) {
        console.error('Error generating analytics:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to generate analytics',
                error: error.message
            })
        };
    }
};