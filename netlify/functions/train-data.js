const fs = require('fs');
const path = require('path');

/**
 * Netlify Function: Train Data API
 * Provides access to train data CSV files
 */

const csvFiles = {
    'fitness_certificates': 'public/train_fitness_certificates.csv',
    'job_cards': 'public/train_job_cards.csv',
    'branding_priorities': 'public/train_branding_priorities.csv',
    'mileage_data': 'public/train_mileage_data.csv',
    'cleaning_status': 'public/train_cleaning_status.csv',
    'stabling_geometry': 'public/train_stabling_geometry.csv',
    'ml_analysis': 'public/ml_analysis_data.csv'
};

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
        const { file } = event.queryStringParameters || {};
        
        if (file && csvFiles[file]) {
            // Return specific CSV file data
            const filePath = path.join(process.cwd(), csvFiles[file]);
            
            if (fs.existsSync(filePath)) {
                const csvContent = fs.readFileSync(filePath, 'utf8');
                const data = parseCSV(csvContent);
                
                // Special handling for ML analysis data
                if (file === 'ml_analysis') {
                    const processedData = data.map((row, index) => ({
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
                    }));
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            file: file,
                            data: processedData,
                            count: processedData.length
                        })
                    };
                }
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        file: file,
                        data: data,
                        count: data.length
                    })
                };
            } else {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: `File ${file} not found`
                    })
                };
            }
        } else {
            // Return list of available files
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    availableFiles: Object.keys(csvFiles),
                    files: csvFiles
                })
            };
        }
    } catch (error) {
        console.error('Error reading train data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to read train data',
                error: error.message
            })
        };
    }
};
