const fs = require('fs');
const path = require('path');

/**
 * Netlify Function: Get Train Data
 * Serves CSV data as JSON from the public folder
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
            // Return specific file data
            const filePath = path.join(process.cwd(), csvFiles[file]);
            
            if (!fs.existsSync(filePath)) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: `File not found: ${file}`
                    })
                };
            }

            const csvContent = fs.readFileSync(filePath, 'utf8');
            const data = parseCSV(csvContent);
            
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
            // Return all available files info
            const availableFiles = {};
            
            for (const [name, filePath] of Object.entries(csvFiles)) {
                const fullPath = path.join(process.cwd(), filePath);
                if (fs.existsSync(fullPath)) {
                    try {
                        const csvContent = fs.readFileSync(fullPath, 'utf8');
                        const data = parseCSV(csvContent);
                        availableFiles[name] = {
                            path: filePath,
                            count: data.length,
                            headers: data.length > 0 ? Object.keys(data[0]) : []
                        };
                    } catch (error) {
                        availableFiles[name] = {
                            path: filePath,
                            error: error.message
                        };
                    }
                }
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    availableFiles: availableFiles,
                    totalFiles: Object.keys(availableFiles).length
                })
            };
        }
    } catch (error) {
        console.error('Error getting train data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};