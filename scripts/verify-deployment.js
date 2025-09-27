#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying KMRL deployment package...\n');

// Check all required files and directories
const checks = [
  {
    name: 'Netlify Configuration',
    files: ['netlify.toml'],
    critical: true
  },
  {
    name: 'Serverless Functions',
    files: [
      'netlify/functions/get-train-data.js',
      'netlify/functions/get-analytics.js',
      'netlify/functions/chatbot.js',
      'netlify/functions/optimize-deployment.js'
    ],
    critical: true
  },
  {
    name: 'API Services',
    files: [
      'src/services/NetlifyAPIService.js',
      'src/services/ChatbotService.js',
      'src/services/DeploymentService.js'
    ],
    critical: true
  },
  {
    name: 'CSV Data Files',
    files: [
      'public/ml_analysis_data.csv',
      'public/train_branding_priorities.csv',
      'public/train_cleaning_status.csv',
      'public/train_fitness_certificates.csv',
      'public/train_job_cards.csv',
      'public/train_mileage_data.csv',
      'public/train_stabling_geometry.csv'
    ],
    critical: true
  },
  {
    name: 'Core Components',
    files: [
      'src/components/SystemStatusAnalyticsBanner.jsx',
      'src/components/SystemStatusPopup.jsx',
      'src/contexts/ThemeContext.jsx',
      'src/contexts/LanguageContext.jsx'
    ],
    critical: true
  },
  {
    name: 'Build Configuration',
    files: ['package.json', 'vite.config.js', 'tailwind.config.js'],
    critical: true
  }
];

let allChecksPassed = true;
let criticalFailures = 0;

checks.forEach(check => {
  console.log(`📋 ${check.name}:`);
  
  let checkPassed = true;
  check.files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      checkPassed = false;
      if (check.critical) {
        criticalFailures++;
      }
    }
  });
  
  if (checkPassed) {
    console.log(`  ✅ ${check.name} - PASSED\n`);
  } else {
    console.log(`  ❌ ${check.name} - FAILED\n`);
    allChecksPassed = false;
  }
});

// Check build directory
console.log('📦 Build Directory:');
if (fs.existsSync('build')) {
  const buildFiles = fs.readdirSync('build');
  console.log(`  ✅ Build directory exists with ${buildFiles.length} files`);
  
  // Check for key build files
  const keyBuildFiles = ['index.html', 'assets'];
  keyBuildFiles.forEach(file => {
    if (fs.existsSync(path.join('build', file))) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      allChecksPassed = false;
    }
  });
} else {
  console.log('  ❌ Build directory not found - Run npm run build first');
  allChecksPassed = false;
}

// Check package.json scripts
console.log('\n📜 Package.json Scripts:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'netlify:build', 'netlify:dev', 'deploy:prepare'];

requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`  ✅ ${script}`);
  } else {
    console.log(`  ❌ ${script} - MISSING`);
    allChecksPassed = false;
  }
});

// Summary
console.log('\n📊 Verification Summary:');
if (allChecksPassed && criticalFailures === 0) {
  console.log('🎉 All checks passed! Deployment package is ready.');
  console.log('\n🚀 Next steps:');
  console.log('1. Push to Git repository');
  console.log('2. Connect to Netlify');
  console.log('3. Deploy using Git integration');
  console.log('4. Test all functionality');
  console.log('\n📖 See NETLIFY_DEPLOYMENT_GUIDE.md for detailed instructions');
} else {
  console.log(`❌ Verification failed with ${criticalFailures} critical issues.`);
  console.log('Please fix the missing files before deployment.');
  process.exit(1);
}

// Create verification report
const report = {
  timestamp: new Date().toISOString(),
  status: allChecksPassed ? 'PASSED' : 'FAILED',
  criticalFailures,
  checks: checks.map(check => ({
    name: check.name,
    passed: check.files.every(file => fs.existsSync(file)),
    files: check.files.map(file => ({
      name: file,
      exists: fs.existsSync(file)
    }))
  }))
};

fs.writeFileSync('verification-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Verification report saved to verification-report.json');
