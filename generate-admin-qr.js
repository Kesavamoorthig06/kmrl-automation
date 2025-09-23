const QRCode = require('qrcode');
const fs = require('fs');

// Generate QR code for admin login
const adminData = 'ADMIN001';
const filename = 'qr-codes/KMRL_Admin_Login_ADMIN001.png';

QRCode.toFile(filename, adminData, {
  errorCorrectionLevel: 'H',
  width: 256,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}, (err) => {
  if (err) {
    console.error('Error generating QR code:', err);
  } else {
    console.log('✅ Admin QR code generated successfully!');
    console.log('📁 File:', filename);
    console.log('📱 QR Code Data:', adminData);
    console.log('🔗 Redirects to: /dashboard (Admin Dashboard)');
    console.log('');
    console.log('Usage:');
    console.log('1. Print or display the QR code');
    console.log('2. Use the QR scanner in the login page');
    console.log('3. Scan the QR code to access admin dashboard');
  }
});
