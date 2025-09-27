/**
 * Netlify Function: Health Check
 * Simple health check endpoint
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
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'KMRL Metro System API is healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                endpoints: [
                    '/.netlify/functions/ml-optimization',
                    '/.netlify/functions/generate-qr',
                    '/.netlify/functions/train-data',
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
                error: error.message
            })
        };
    }
};
