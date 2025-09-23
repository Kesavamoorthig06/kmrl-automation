#!/usr/bin/env node

/**
 * KMRL Server Setup Script
 * Helps with initial server configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🚇 KMRL Server Setup');
console.log('==================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created! Please edit it with your credentials.\n');
  } else {
    console.log('❌ env.example file not found!');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  console.log('Run: npm install\n');
} else {
  console.log('✅ Dependencies already installed.\n');
}

console.log('🔧 Next Steps:');
console.log('1. Edit .env file with your credentials:');
console.log('   - Twilio Account SID and Auth Token');
console.log('   - Twilio phone number (TWILIO_FROM)');
console.log('   - Crew phone numbers and emails');
console.log('   - Optional: SMTP settings for email\n');

console.log('2. Install dependencies:');
console.log('   npm install\n');

console.log('3. Start the server:');
console.log('   npm run dev    # Development mode');
console.log('   npm start      # Production mode\n');

console.log('4. Test the server:');
console.log('   curl http://localhost:4000/api/health\n');

console.log('📚 For detailed setup instructions, see README.md');
console.log('🔗 Twilio Setup: https://www.twilio.com/docs/sms/quickstart/node');
