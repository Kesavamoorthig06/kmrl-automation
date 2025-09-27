/**
 * Netlify Function: Health Check
 * Simple health check endpoint with file system verification
 */

const fs = require('fs');
const path = require('path');

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
        // Check for CSV files
        const csvFiles = [
            'ml_analysis_data.csv',
            'train_branding_priorities.csv',
            'train_cleaning_status.csv',
            'train_fitness_certificates.csv',
            'train_job_cards.csv',
            'train_mileage_data.csv',
            'train_stabling_geometry.csv'
        ];

        const fileStatus = {};
        const possiblePaths = [
            path.join(process.cwd(), 'build'),
            path.join(process.cwd(), 'public'),
            path.join(__dirname, '..', '..', 'build'),
            path.join(__dirname, '..', '..', 'public')
        ];

        for (const file of csvFiles) {
            let found = false;
            for (const basePath of possiblePaths) {
                const filePath = path.join(basePath, file);
                if (fs.existsSync(filePath)) {
                    fileStatus[file] = { found: true, path: filePath };
                    found = true;
                    break;
                }
            }
            if (!found) {
                fileStatus[file] = { found: false, searchedPaths: possiblePaths.map(p => path.join(p, file)) };
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'KMRL Metro System API is healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                fileSystem: {
                    workingDirectory: process.cwd(),
                    functionDirectory: __dirname,
                    csvFiles: fileStatus
                },
                endpoints: [
                    '/.netlify/functions/get-train-data',
                    '/.netlify/functions/get-analytics',
                    '/.netlify/functions/chatbot',
                    '/.netlify/functions/optimize-deployment',
                    '/.netlify/functions/health'
                ]
            })
        };
    } catch (error) {
        console.error('Health check error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Health check failed',
                error: error.message,
                workingDirectory: process.cwd(),
                functionDirectory: __dirname
            })
        };
    }
};
