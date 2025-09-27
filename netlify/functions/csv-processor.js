const fs = require('fs');
const path = require('path');

/**
 * Netlify Function: CSV Processor
 * Replicates the functionality of python/scripts/process_csv_data.py and create_combined_csv.py
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
        const { action } = event.queryStringParameters || {};
        
        let result = {};
        
        switch (action) {
            case 'process_csv':
                result = await processCSVData();
                break;
            case 'create_combined':
                result = await createCombinedCSV();
                break;
            case 'validate_data':
                result = await validateData();
                break;
            case 'export_analysis':
                result = await exportAnalysisData();
                break;
            default:
                result = await getAllDataSummary();
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                action: action || 'summary',
                data: result,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error processing CSV data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to process CSV data',
                error: error.message
            })
        };
    }
};

async function processCSVData() {
    const csvFiles = {
        'fitness_certificates': 'public/train_fitness_certificates.csv',
        'job_cards': 'public/train_job_cards.csv',
        'branding_priorities': 'public/train_branding_priorities.csv',
        'mileage_data': 'public/train_mileage_data.csv',
        'cleaning_status': 'public/train_cleaning_status.csv',
        'stabling_geometry': 'public/train_stabling_geometry.csv'
    };

    const processedData = {};
    const statistics = {};

    for (const [name, filePath] of Object.entries(csvFiles)) {
        try {
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
                const csvContent = fs.readFileSync(fullPath, 'utf8');
                const data = parseCSV(csvContent);
                
                processedData[name] = data;
                statistics[name] = {
                    recordCount: data.length,
                    columns: Object.keys(data[0] || {}),
                    lastUpdated: fs.statSync(fullPath).mtime.toISOString()
                };

                // Add data quality checks
                statistics[name].quality = {
                    emptyFields: checkEmptyFields(data),
                    duplicateRecords: checkDuplicates(data),
                    dataTypes: analyzeDataTypes(data)
                };
            } else {
                console.log(`File not found: ${fullPath}`);
            }
        } catch (error) {
            console.error(`Error processing ${name}:`, error);
            statistics[name] = { error: error.message };
        }
    }

    return {
        processedData,
        statistics,
        summary: {
            totalFiles: Object.keys(csvFiles).length,
            processedFiles: Object.keys(processedData).length,
            totalRecords: Object.values(statistics).reduce((sum, stat) => sum + (stat.recordCount || 0), 0)
        }
    };
}

async function createCombinedCSV() {
    const csvFiles = {
        'fitness_certificates': 'public/train_fitness_certificates.csv',
        'job_cards': 'public/train_job_cards.csv',
        'branding_priorities': 'public/train_branding_priorities.csv',
        'mileage_data': 'public/train_mileage_data.csv',
        'cleaning_status': 'public/train_cleaning_status.csv',
        'stabling_geometry': 'public/train_stabling_geometry.csv'
    };

    const allData = {};
    const trainIds = new Set();

    // Load all data
    for (const [name, filePath] of Object.entries(csvFiles)) {
        try {
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
                const csvContent = fs.readFileSync(fullPath, 'utf8');
                const data = parseCSV(csvContent);
                allData[name] = data;
                
                data.forEach(row => {
                    if (row.train_id) {
                        trainIds.add(row.train_id);
                    }
                });
            }
        } catch (error) {
            console.error(`Error loading ${name}:`, error);
        }
    }

    // Create combined dataset
    const combinedData = [];
    
    for (const trainId of trainIds) {
        const combinedRow = { train_id: trainId };
        
        // Merge data from all sources
        Object.entries(allData).forEach(([source, data]) => {
            const trainData = data.find(row => row.train_id === trainId);
            if (trainData) {
                Object.entries(trainData).forEach(([key, value]) => {
                    if (key !== 'train_id') {
                        combinedRow[`${source}_${key}`] = value;
                    }
                });
            }
        });
        
        combinedData.push(combinedRow);
    }

    // Generate combined CSV content
    const headers = Object.keys(combinedData[0] || {});
    const csvContent = [
        headers.join(','),
        ...combinedData.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
        )
    ].join('\n');

    // Save combined CSV
    const outputPath = path.join(process.cwd(), 'public', 'combined_ml_analysis.csv');
    fs.writeFileSync(outputPath, csvContent);

    return {
        recordCount: combinedData.length,
        columnCount: headers.length,
        outputFile: 'combined_ml_analysis.csv',
        columns: headers,
        sampleData: combinedData.slice(0, 5)
    };
}

async function validateData() {
    const csvFiles = {
        'fitness_certificates': 'public/train_fitness_certificates.csv',
        'job_cards': 'public/train_job_cards.csv',
        'branding_priorities': 'public/train_branding_priorities.csv',
        'mileage_data': 'public/train_mileage_data.csv',
        'cleaning_status': 'public/train_cleaning_status.csv',
        'stabling_geometry': 'public/train_stabling_geometry.csv'
    };

    const validationResults = {};

    for (const [name, filePath] of Object.entries(csvFiles)) {
        try {
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
                const csvContent = fs.readFileSync(fullPath, 'utf8');
                const data = parseCSV(csvContent);
                
                validationResults[name] = {
                    isValid: true,
                    recordCount: data.length,
                    issues: [],
                    warnings: []
                };

                // Validate required fields
                const requiredFields = getRequiredFields(name);
                requiredFields.forEach(field => {
                    const missingCount = data.filter(row => !row[field] || row[field].trim() === '').length;
                    if (missingCount > 0) {
                        validationResults[name].issues.push(`Missing ${field} in ${missingCount} records`);
                    }
                });

                // Validate data types
                data.forEach((row, index) => {
                    Object.entries(row).forEach(([key, value]) => {
                        if (isNumericField(key) && isNaN(parseFloat(value)) && value !== '') {
                            validationResults[name].warnings.push(`Row ${index + 1}: Invalid numeric value for ${key}: ${value}`);
                        }
                    });
                });

                // Check for duplicates
                const trainIds = data.map(row => row.train_id).filter(id => id);
                const uniqueTrainIds = new Set(trainIds);
                if (trainIds.length !== uniqueTrainIds.size) {
                    validationResults[name].warnings.push(`Found ${trainIds.length - uniqueTrainIds.size} duplicate train IDs`);
                }

                validationResults[name].isValid = validationResults[name].issues.length === 0;
            }
        } catch (error) {
            validationResults[name] = {
                isValid: false,
                error: error.message
            };
        }
    }

    return validationResults;
}

async function exportAnalysisData() {
    // Read ML analysis data
    const mlDataPath = path.join(process.cwd(), 'public', 'ml_analysis_data.csv');
    let analysisData = [];
    
    if (fs.existsSync(mlDataPath)) {
        const csvContent = fs.readFileSync(mlDataPath, 'utf8');
        analysisData = parseCSV(csvContent);
    }

    // Generate analysis summary
    const summary = {
        totalTrains: analysisData.length,
        availableTrains: analysisData.filter(d => d.status === 'Available').length,
        maintenanceTrains: analysisData.filter(d => d.assignment === 'Maintenance').length,
        averageScore: analysisData.reduce((sum, d) => sum + parseFloat(d.prelim_score || 0), 0) / analysisData.length,
        scoreDistribution: {
            excellent: analysisData.filter(d => parseFloat(d.prelim_score || 0) >= 0.9).length,
            good: analysisData.filter(d => parseFloat(d.prelim_score || 0) >= 0.7 && parseFloat(d.prelim_score || 0) < 0.9).length,
            fair: analysisData.filter(d => parseFloat(d.prelim_score || 0) >= 0.5 && parseFloat(d.prelim_score || 0) < 0.7).length,
            poor: analysisData.filter(d => parseFloat(d.prelim_score || 0) < 0.5).length
        }
    };

    // Generate recommendations
    const recommendations = generateRecommendations(analysisData);

    return {
        summary,
        recommendations,
        rawData: analysisData.slice(0, 10), // Sample of raw data
        exportTimestamp: new Date().toISOString()
    };
}

async function getAllDataSummary() {
    const summary = {
        csvFiles: [
            'train_fitness_certificates.csv',
            'train_job_cards.csv',
            'train_branding_priorities.csv',
            'train_mileage_data.csv',
            'train_cleaning_status.csv',
            'train_stabling_geometry.csv',
            'ml_analysis_data.csv'
        ],
        availableActions: [
            'process_csv',
            'create_combined',
            'validate_data',
            'export_analysis'
        ],
        lastUpdated: new Date().toISOString()
    };

    return summary;
}

function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : '';
        });
        data.push(row);
    }

    return data;
}

function checkEmptyFields(data) {
    if (data.length === 0) return 0;
    
    const headers = Object.keys(data[0]);
    let emptyCount = 0;
    
    data.forEach(row => {
        headers.forEach(header => {
            if (!row[header] || row[header].trim() === '') {
                emptyCount++;
            }
        });
    });
    
    return emptyCount;
}

function checkDuplicates(data) {
    const trainIds = data.map(row => row.train_id).filter(id => id);
    const uniqueTrainIds = new Set(trainIds);
    return trainIds.length - uniqueTrainIds.size;
}

function analyzeDataTypes(data) {
    if (data.length === 0) return {};
    
    const headers = Object.keys(data[0]);
    const types = {};
    
    headers.forEach(header => {
        const values = data.map(row => row[header]).filter(val => val && val.trim() !== '');
        if (values.length > 0) {
            const isNumeric = values.every(val => !isNaN(parseFloat(val)));
            const isDate = values.every(val => !isNaN(Date.parse(val)));
            
            if (isNumeric) types[header] = 'numeric';
            else if (isDate) types[header] = 'date';
            else types[header] = 'text';
        } else {
            types[header] = 'empty';
        }
    });
    
    return types;
}

function getRequiredFields(fileName) {
    const requiredFields = {
        'fitness_certificates': ['train_id', 'compliance_status'],
        'job_cards': ['train_id', 'job_card_status'],
        'branding_priorities': ['train_id', 'branding_priority_level'],
        'mileage_data': ['train_id', 'total_mileage'],
        'cleaning_status': ['train_id', 'last_cleaned_date'],
        'stabling_geometry': ['train_id', 'stabling_bay']
    };
    
    return requiredFields[fileName] || ['train_id'];
}

function isNumericField(fieldName) {
    const numericFields = [
        'branding_priority_level', 'total_mileage', 'mileage_efficiency',
        'performance_score', 'quality_score', 'critical_issues',
        'completion_percentage', 'revenue_generated', 'interior_condition',
        'exterior_condition', 'cleaning_score', 'operational_efficiency',
        'deployment_time_minutes', 'prelim_score', 'final_score_ga'
    ];
    
    return numericFields.some(field => fieldName.toLowerCase().includes(field.toLowerCase()));
}

function generateRecommendations(data) {
    const recommendations = [];
    
    const lowScoreTrains = data.filter(d => parseFloat(d.prelim_score || 0) < 0.5);
    if (lowScoreTrains.length > 0) {
        recommendations.push({
            type: 'priority',
            message: `${lowScoreTrains.length} trains have low performance scores and require immediate attention`,
            trains: lowScoreTrains.map(d => d.train_id)
        });
    }
    
    const maintenanceTrains = data.filter(d => d.assignment === 'Maintenance');
    if (maintenanceTrains.length > 5) {
        recommendations.push({
            type: 'capacity',
            message: `High maintenance load: ${maintenanceTrains.length} trains require maintenance. Consider increasing maintenance capacity.`
        });
    }
    
    const highMileageTrains = data.filter(d => parseFloat(d.mileage || 0) > 15000);
    if (highMileageTrains.length > 0) {
        recommendations.push({
            type: 'efficiency',
            message: `${highMileageTrains.length} trains have high mileage and may need efficiency optimization`,
            trains: highMileageTrains.map(d => d.train_id)
        });
    }
    
    return recommendations;
}
