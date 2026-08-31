const QRCode = require('qrcode');

/**
 * Netlify Function: Generate QR Codes
 * Generates QR codes for login roles (admin, brand, clean, tech, yard, operation).
 */

const qrCredentials = {
    'brand': {
        workerId: 'brand',
        password: 'password',
        role: 'Branding Officer',
        redirectUrl: '/branding_officer'
    },
    'clean': {
        workerId: 'clean', 
        password: 'password',
        role: 'Cleaning Crew',
        redirectUrl: '/cleaning'
    },
    'tech': {
        workerId: 'tech',
        password: 'password', 
        role: 'Technical Staff',
        redirectUrl: '/technical'
    },
    'yard': {
        workerId: 'yard',
        password: 'password',
        role: 'Yard Operations',
        redirectUrl: '/yard'
    },
    'operation': {
        workerId: 'operation',
        password: 'password',
        role: 'Operation Staff',
        redirectUrl: '/operation_staff'
    },
    'admin': {
        workerId: 'admin',
        password: 'password',
        role: 'Administrator',
        redirectUrl: '/dashboard'
    }
};

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
        const { role } = event.queryStringParameters || {};
        
        if (role && qrCredentials[role]) {
            // Generate QR code for specific role
            const credentials = qrCredentials[role];
            const qrData = credentials.workerId;
            
            const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    role: credentials.role,
                    qrCode: qrCodeDataURL,
                    credentials: {
                        workerId: credentials.workerId,
                        password: credentials.password,
                        redirectUrl: credentials.redirectUrl
                    }
                })
            };
        } else {
            // Return all available roles
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    availableRoles: Object.keys(qrCredentials),
                    credentials: qrCredentials
                })
            };
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to generate QR code',
                error: error.message
            })
        };
    }
};
