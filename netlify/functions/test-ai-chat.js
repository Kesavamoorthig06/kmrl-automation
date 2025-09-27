/**
 * Netlify Function: Test AI Chat
 * Simple test endpoint to verify AI chat functionality
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
                message: 'AI Chat API is working!',
                timestamp: new Date().toISOString(),
                method: event.httpMethod
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Test failed',
                error: error.message
            })
        };
    }
};
