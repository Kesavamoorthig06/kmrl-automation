#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building KMRL for Netlify deployment...\n');

// Step 1: Verify all required files exist
console.log('📋 Verifying required files...');

const requiredFiles = [
  'netlify.toml',
  'package.json',
  'netlify/functions/get-train-data.js',
  'netlify/functions/get-analytics.js',
  'netlify/functions/chatbot.js',
  'netlify/functions/optimize-deployment.js',
  'src/services/NetlifyAPIService.js',
  'src/services/ChatbotService.js',
  'src/services/DeploymentService.js',
  'public/ml_analysis_data.csv',
  'public/train_branding_priorities.csv',
  'public/train_cleaning_status.csv',
  'public/train_fitness_certificates.csv',
  'public/train_job_cards.csv',
  'public/train_mileage_data.csv',
  'public/train_stabling_geometry.csv'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are present before deployment.');
  process.exit(1);
}

// Step 2: Copy CSV files to public directory if they don't exist
console.log('\n📊 Ensuring CSV data files are in public directory...');

const csvFiles = [
  'ml_analysis_data.csv',
  'train_branding_priorities.csv',
  'train_cleaning_status.csv',
  'train_fitness_certificates.csv',
  'train_job_cards.csv',
  'train_mileage_data.csv',
  'train_stabling_geometry.csv'
];

csvFiles.forEach(file => {
  const publicPath = path.join('public', file);
  const sourcePath = file;
  
  if (!fs.existsSync(publicPath) && fs.existsSync(sourcePath)) {
    console.log(`📋 Copying ${file} to public directory...`);
    fs.copyFileSync(sourcePath, publicPath);
  }
});

// Step 3: Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.log('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 4: Build the project
console.log('\n🔨 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.log('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 5: Verify build output
console.log('\n🔍 Verifying build output...');

const buildFiles = [
  'build/index.html',
  'build/assets',
  'build/ml_analysis_data.csv'
];

buildFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Step 6: Create deployment summary
console.log('\n📋 Creating deployment summary...');

const summary = {
  timestamp: new Date().toISOString(),
  buildStatus: 'success',
  filesIncluded: {
    functions: fs.readdirSync('netlify/functions').length,
    csvFiles: csvFiles.filter(file => fs.existsSync(path.join('public', file))).length,
    buildSize: getDirectorySize('build')
  },
  nextSteps: [
    'Deploy to Netlify via Git integration or manual upload',
    'Verify all functions are working',
    'Test dark mode and language switching',
    'Test chatbot functionality',
    'Test deployment optimization'
  ]
};

fs.writeFileSync('deployment-summary.json', JSON.stringify(summary, null, 2));
console.log('✅ Deployment summary created');

console.log('\n🎉 Build completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Push to Git repository');
console.log('2. Connect to Netlify');
console.log('3. Deploy using Git integration');
console.log('4. Test all functionality');
console.log('\n📖 See NETLIFY_DEPLOYMENT_GUIDE.md for detailed instructions');

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(itemPath);
      files.forEach(file => calculateSize(path.join(itemPath, file)));
    } else {
      totalSize += stats.size;
    }
  }
  
  calculateSize(dirPath);
  return `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
}
