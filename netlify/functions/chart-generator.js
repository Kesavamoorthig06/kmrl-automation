const fs = require('fs');
const path = require('path');

/**
 * Netlify Function: Chart Generator
 * Replicates the functionality of python/scripts/generate_charts.py
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
        const { chartType } = event.queryStringParameters || {};
        
        // Generate different types of charts based on request
        let chartData = {};
        
        switch (chartType) {
            case 'train_performance':
                chartData = await generateTrainPerformanceChart();
                break;
            case 'maintenance_schedule':
                chartData = await generateMaintenanceScheduleChart();
                break;
            case 'branding_analysis':
                chartData = await generateBrandingAnalysisChart();
                break;
            case 'cleaning_status':
                chartData = await generateCleaningStatusChart();
                break;
            case 'mileage_distribution':
                chartData = await generateMileageDistributionChart();
                break;
            case 'stabling_efficiency':
                chartData = await generateStablingEfficiencyChart();
                break;
            default:
                chartData = await generateAllCharts();
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                chartType: chartType || 'all',
                data: chartData,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error generating charts:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to generate charts',
                error: error.message
            })
        };
    }
};

async function generateTrainPerformanceChart() {
    // Read ML analysis data
    const mlDataPath = path.join(process.cwd(), 'public', 'ml_analysis_data.csv');
    let performanceData = [];
    
    if (fs.existsSync(mlDataPath)) {
        const csvContent = fs.readFileSync(mlDataPath, 'utf8');
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            performanceData.push({
                trainId: row.train_id,
                status: row.status,
                score: parseFloat(row.prelim_score) || 0,
                assignment: row.assignment,
                fitnessScore: parseFloat(row.fitness_certificate_valid === 'Yes' ? 1 : 0),
                jobCardScore: parseFloat(row.job_card_status === 'Clear' ? 1 : 0),
                mileageScore: parseFloat(row.mileage_score) || 0,
                brandingScore: parseFloat(row.branding_score) || 0,
                cleaningScore: parseFloat(row.cleaning_score) || 0,
                shuntingScore: parseFloat(row.shunting_score) || 0
            });
        }
    }

    // Generate chart data
    const chartData = {
        type: 'bar',
        title: 'Train Performance Analysis',
        xAxis: performanceData.map(d => d.trainId),
        series: [
            {
                name: 'Overall Score',
                data: performanceData.map(d => d.score),
                color: '#3498db'
            },
            {
                name: 'Fitness Score',
                data: performanceData.map(d => d.fitnessScore),
                color: '#e74c3c'
            },
            {
                name: 'Job Card Score',
                data: performanceData.map(d => d.jobCardScore),
                color: '#f39c12'
            },
            {
                name: 'Mileage Score',
                data: performanceData.map(d => d.mileageScore),
                color: '#2ecc71'
            },
            {
                name: 'Branding Score',
                data: performanceData.map(d => d.brandingScore),
                color: '#9b59b6'
            },
            {
                name: 'Cleaning Score',
                data: performanceData.map(d => d.cleaningScore),
                color: '#1abc9c'
            },
            {
                name: 'Shunting Score',
                data: performanceData.map(d => d.shuntingScore),
                color: '#34495e'
            }
        ],
        summary: {
            totalTrains: performanceData.length,
            availableTrains: performanceData.filter(d => d.status === 'Available').length,
            maintenanceTrains: performanceData.filter(d => d.assignment === 'Maintenance').length,
            averageScore: performanceData.reduce((sum, d) => sum + d.score, 0) / performanceData.length
        }
    };

    return chartData;
}

async function generateMaintenanceScheduleChart() {
    const maintenanceData = [
        { trainId: 'R-03', priority: 'High', duration: '4-6 hours', reason: 'Fitness certificates require attention' },
        { trainId: 'R-07', priority: 'High', duration: '2-3 hours', reason: 'Open job cards need completion' },
        { trainId: 'R-12', priority: 'Medium', duration: '1-2 hours', reason: 'Cleaning status needs improvement' },
        { trainId: 'R-15', priority: 'Medium', duration: '3-4 hours', reason: 'Mileage efficiency below optimal' },
        { trainId: 'R-18', priority: 'Low', duration: '2-3 hours', reason: 'Stabling geometry challenging' }
    ];

    const chartData = {
        type: 'gantt',
        title: 'Maintenance Schedule',
        data: maintenanceData.map((item, index) => ({
            id: item.trainId,
            task: item.reason,
            start: new Date(Date.now() + index * 2 * 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + (index * 2 + 4) * 60 * 60 * 1000).toISOString(),
            priority: item.priority,
            duration: item.duration
        })),
        summary: {
            totalMaintenance: maintenanceData.length,
            highPriority: maintenanceData.filter(d => d.priority === 'High').length,
            mediumPriority: maintenanceData.filter(d => d.priority === 'Medium').length,
            lowPriority: maintenanceData.filter(d => d.priority === 'Low').length
        }
    };

    return chartData;
}

async function generateBrandingAnalysisChart() {
    const brandingData = [
        { priority: 1, count: 2, revenue: 50000 },
        { priority: 2, count: 3, revenue: 75000 },
        { priority: 3, count: 4, revenue: 100000 },
        { priority: 4, count: 5, revenue: 125000 },
        { priority: 5, count: 6, revenue: 150000 },
        { priority: 6, count: 7, revenue: 175000 },
        { priority: 7, count: 8, revenue: 200000 },
        { priority: 8, count: 6, revenue: 225000 },
        { priority: 9, count: 4, revenue: 250000 },
        { priority: 10, count: 2, revenue: 275000 }
    ];

    const chartData = {
        type: 'scatter',
        title: 'Branding Priority vs Revenue Analysis',
        xAxis: brandingData.map(d => d.priority),
        yAxis: brandingData.map(d => d.revenue),
        series: [{
            name: 'Revenue Generated',
            data: brandingData.map(d => ({ x: d.priority, y: d.revenue, count: d.count })),
            color: '#e67e22'
        }],
        summary: {
            totalRevenue: brandingData.reduce((sum, d) => sum + d.revenue, 0),
            averagePriority: brandingData.reduce((sum, d) => sum + d.priority, 0) / brandingData.length,
            highPriorityTrains: brandingData.filter(d => d.priority >= 8).length
        }
    };

    return chartData;
}

async function generateCleaningStatusChart() {
    const cleaningData = [
        { status: 'Excellent', count: 8, color: '#2ecc71' },
        { status: 'Good', count: 12, color: '#f39c12' },
        { status: 'Fair', count: 6, color: '#e67e22' },
        { status: 'Poor', count: 2, color: '#e74c3c' }
    ];

    const chartData = {
        type: 'pie',
        title: 'Cleaning Status Distribution',
        data: cleaningData.map(d => ({
            name: d.status,
            value: d.count,
            color: d.color
        })),
        summary: {
            totalTrains: cleaningData.reduce((sum, d) => sum + d.count, 0),
            excellentPercentage: (cleaningData[0].count / cleaningData.reduce((sum, d) => sum + d.count, 0)) * 100,
            needsAttention: cleaningData.filter(d => d.status === 'Fair' || d.status === 'Poor').reduce((sum, d) => sum + d.count, 0)
        }
    };

    return chartData;
}

async function generateMileageDistributionChart() {
    const mileageRanges = [
        { range: '0-5000', count: 4, color: '#2ecc71' },
        { range: '5000-10000', count: 8, color: '#f39c12' },
        { range: '10000-15000', count: 10, color: '#e67e22' },
        { range: '15000-20000', count: 6, color: '#e74c3c' },
        { range: '20000+', count: 2, color: '#8e44ad' }
    ];

    const chartData = {
        type: 'histogram',
        title: 'Mileage Distribution',
        xAxis: mileageRanges.map(d => d.range),
        yAxis: mileageRanges.map(d => d.count),
        series: [{
            name: 'Number of Trains',
            data: mileageRanges.map(d => ({ x: d.range, y: d.count, color: d.color })),
            color: '#3498db'
        }],
        summary: {
            totalTrains: mileageRanges.reduce((sum, d) => sum + d.count, 0),
            averageMileage: 12500,
            highMileageTrains: mileageRanges.filter(d => d.range === '15000-20000' || d.range === '20000+').reduce((sum, d) => sum + d.count, 0)
        }
    };

    return chartData;
}

async function generateStablingEfficiencyChart() {
    const stablingData = [
        { bay: 'A1', efficiency: 95, access: 'excellent', power: 'yes', water: 'yes' },
        { bay: 'A2', efficiency: 88, access: 'good', power: 'yes', water: 'no' },
        { bay: 'A3', efficiency: 92, access: 'excellent', power: 'yes', water: 'yes' },
        { bay: 'B1', efficiency: 85, access: 'good', power: 'no', water: 'yes' },
        { bay: 'B2', efficiency: 90, access: 'excellent', power: 'yes', water: 'yes' },
        { bay: 'C1', efficiency: 78, access: 'fair', power: 'yes', water: 'no' },
        { bay: 'C2', efficiency: 82, access: 'good', power: 'no', water: 'yes' },
        { bay: 'D1', efficiency: 88, access: 'good', power: 'yes', water: 'yes' }
    ];

    const chartData = {
        type: 'bar',
        title: 'Stabling Bay Efficiency',
        xAxis: stablingData.map(d => d.bay),
        yAxis: stablingData.map(d => d.efficiency),
        series: [{
            name: 'Efficiency Score',
            data: stablingData.map(d => d.efficiency),
            color: '#27ae60'
        }],
        details: stablingData.map(d => ({
            bay: d.bay,
            efficiency: d.efficiency,
            access: d.access,
            power: d.power,
            water: d.water
        })),
        summary: {
            averageEfficiency: stablingData.reduce((sum, d) => sum + d.efficiency, 0) / stablingData.length,
            excellentBays: stablingData.filter(d => d.efficiency >= 90).length,
            needsImprovement: stablingData.filter(d => d.efficiency < 80).length
        }
    };

    return chartData;
}

async function generateAllCharts() {
    return {
        trainPerformance: await generateTrainPerformanceChart(),
        maintenanceSchedule: await generateMaintenanceScheduleChart(),
        brandingAnalysis: await generateBrandingAnalysisChart(),
        cleaningStatus: await generateCleaningStatusChart(),
        mileageDistribution: await generateMileageDistributionChart(),
        stablingEfficiency: await generateStablingEfficiencyChart()
    };
}
