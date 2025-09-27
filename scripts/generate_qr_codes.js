const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Create qr-codes directory if it doesn't exist
const qrCodesDir = path.join(__dirname, '..', 'qr-codes');
if (!fs.existsSync(qrCodesDir)) {
    fs.mkdirSync(qrCodesDir, { recursive: true });
}

// QR Code credentials for different roles
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

// Generate QR codes
async function generateQRCodes() {
    console.log('🚀 Generating QR codes for KMRL Employee Login...\n');
    
    for (const [qrData, credentials] of Object.entries(qrCredentials)) {
        try {
            // Generate QR code as PNG
            const qrCodePath = path.join(qrCodesDir, `KMRL_${credentials.role.replace(/\s+/g, '_')}_${qrData}.png`);
            
            await QRCode.toFile(qrCodePath, qrData, {
                type: 'png',
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            
            console.log(`✅ Generated QR code for ${credentials.role}: ${qrCodePath}`);
            
            // Create a text file with credentials
            const credentialsPath = path.join(qrCodesDir, `KMRL_${credentials.role.replace(/\s+/g, '_')}_${qrData}_credentials.txt`);
            const credentialsText = `KMRL Employee QR Code Credentials
=====================================

Role: ${credentials.role}
QR Data: ${qrData}
Worker ID: ${credentials.workerId}
Password: ${credentials.password}
Redirects to: ${credentials.redirectUrl}

Generated on: ${new Date().toLocaleString()}

Instructions:
1. Open login.html in your browser
2. Click "Open Camera" button
3. Scan this QR code
4. You will be automatically logged in and redirected to your dashboard

Note: This QR code contains login credentials for testing purposes only.
In production, use secure, unique passwords for each role.`;
            
            fs.writeFileSync(credentialsPath, credentialsText);
            console.log(`📄 Created credentials file: ${credentialsPath}`);
            
        } catch (error) {
            console.error(`❌ Error generating QR code for ${credentials.role}:`, error.message);
        }
    }
    
    // Create a summary file
    const summaryPath = path.join(qrCodesDir, 'README.md');
    const summaryContent = `# KMRL Employee QR Codes

## Generated QR Codes

This directory contains QR codes for different KMRL employee roles. Each QR code contains login credentials that automatically log in users and redirect them to their respective dashboard pages.

### Available QR Codes:

| Role | QR Data | Worker ID | Password | Redirects to |
|------|---------|-----------|----------|--------------|
| Branding Officer | BRAND001 | BRAND001 | password | branding_officer.html |
| Cleaning Crew | CLEAN001 | CLEAN001 | password | cleaning.html |
| Technical Staff | TECH001 | TECH001 | password | technical.html |
| Yard Operations | YARD001 | YARD001 | password | yard.html |
| Administrator | ADMIN001 | ADMIN001 | password | operation staff.html |

### How to Use:

1. **For Testing:**
   - Open \`login.html\` in your browser
   - Click "Open Camera" button
   - Scan any of the QR codes in this directory
   - You will be automatically logged in and redirected

2. **For Employees:**
   - Each employee should scan their role-specific QR code
   - The system will automatically fill in credentials and log them in
   - They will be redirected to their appropriate dashboard

### Files in this directory:

- \`KMRL_Branding_Officer_BRAND001.png\` - Branding Officer QR Code
- \`KMRL_Cleaning_Crew_CLEAN001.png\` - Cleaning Crew QR Code  
- \`KMRL_Technical_Staff_TECH001.png\` - Technical Staff QR Code
- \`KMRL_Yard_Operations_YARD001.png\` - Yard Operations QR Code
- \`KMRL_Administrator_ADMIN001.png\` - Administrator QR Code

Each QR code also has a corresponding \`_credentials.txt\` file with detailed information.

### Security Notes:

- These QR codes are for testing purposes only
- In production, use unique, secure passwords for each role
- Consider implementing proper authentication and encryption
- QR codes should be kept secure and not shared publicly

Generated on: ${new Date().toLocaleString()}`;
    
    fs.writeFileSync(summaryPath, summaryContent);
    console.log(`📋 Created summary file: ${summaryPath}`);
    
    console.log(`\n🎉 Successfully generated ${Object.keys(qrCredentials).length} QR codes in: ${qrCodesDir}`);
    console.log('\n📁 Files created:');
    console.log('   - PNG QR code images');
    console.log('   - Credentials text files');
    console.log('   - README.md summary');
    console.log('\n🔗 To test: Open login.html and scan any QR code!');
}

// Run the generator
generateQRCodes().catch(console.error);
