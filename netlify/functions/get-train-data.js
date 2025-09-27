const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Read CSV data files
    const csvFiles = [
      'ml_analysis_data.csv',
      'train_branding_priorities.csv',
      'train_cleaning_status.csv',
      'train_fitness_certificates.csv',
      'train_job_cards.csv',
      'train_mileage_data.csv',
      'train_stabling_geometry.csv'
    ];

    const data = {};

    // Read each CSV file from the build directory
    for (const file of csvFiles) {
      try {
        // Try multiple possible paths for CSV files
        const possiblePaths = [
          path.join(process.cwd(), 'build', file),
          path.join(process.cwd(), 'public', file),
          path.join(__dirname, '..', '..', 'build', file),
          path.join(__dirname, '..', '..', 'public', file)
        ];
        
        let csvContent = null;
        for (const filePath of possiblePaths) {
          try {
            if (fs.existsSync(filePath)) {
              csvContent = fs.readFileSync(filePath, 'utf8');
              console.log(`Successfully read ${file} from ${filePath}`);
              break;
            }
          } catch (pathError) {
            // Continue to next path
          }
        }
        
        if (csvContent) {
          data[file.replace('.csv', '')] = parseCSV(csvContent);
        } else {
          console.log(`Warning: Could not find ${file} in any expected location`);
          data[file.replace('.csv', '')] = [];
        }
      } catch (error) {
        console.log(`Warning: Could not read ${file}:`, error.message);
        data[file.replace('.csv', '')] = [];
      }
    }

    // Process ML analysis data to create train objects
    const trains = processTrainData(data.ml_analysis_data || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          trains,
          rawData: data,
          summary: {
            totalTrains: trains.length,
            availableTrains: trains.filter(t => t.status === 'Available').length,
            maintenanceTrains: trains.filter(t => t.status === 'Maintenance').length,
            deployedTrains: trains.filter(t => t.status === 'Deployed').length
          }
        }
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }

  return data;
}

function processTrainData(mlData) {
  return mlData.map((row, index) => ({
    id: row.train_id || `R-${String(index + 1).padStart(3, '0')}`,
    rank: index + 1,
    status: row.status === 'Available' ? 'Available' : 'Unavailable',
    location: row.stabling_bay,
    lastMaintenance: row.last_cleaned_date,
    mileage: parseInt(row.mileage) || 0,
    performance: parseFloat(row.score) || 0,
    score: parseFloat(row.score) || 0,
    branding_priority: parseInt(row.branding_priority) || 0,
    assignment: row.assignment,
    fitnessValid: row.fitness_certificate_valid === 'Yes',
    jobCardStatus: row.job_card_status,
    explanation: row.explanation,
    stabling_bay: row.stabling_bay,
    last_cleaned_date: row.last_cleaned_date,
    // Additional ML metrics
    mileageScore: parseFloat(row.mileage_score) || 0,
    brandingScore: parseFloat(row.branding_score) || 0,
    cleaningScore: parseFloat(row.cleaning_score) || 0,
    shuntingScore: parseFloat(row.shunting_score) || 0,
    finalScoreGA: parseFloat(row.final_score_ga) || 0,
    totalShuntingCost: parseFloat(row.total_shunting_cost) || 0,
    countPenalty: parseInt(row.count_penalty) || 0,
    shuntPenalty: parseInt(row.shunt_penalty) || 0,
    brandingShortfall: row.branding_shortfall === 'True',
    // Additional computed fields
    efficiency: parseFloat(row.score) * 100 || 0,
    reliability: (parseFloat(row.score) * 100) || 0,
    utilization: (parseFloat(row.score) * 100) || 0,
    nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    violations: {
      fitness: row.fitness_certificate_valid === 'Yes' ? 0 : 1,
      jobCards: row.job_card_status === 'Clear' ? 0 : 1,
      cleaning: parseFloat(row.cleaning_score) < 1 ? 1 : 0,
      branding: row.branding_shortfall === 'True' ? 1 : 0
    },
    cost: {
      operational: Math.floor(parseFloat(row.total_shunting_cost) * 100) || 0,
      maintenance: Math.floor(parseFloat(row.total_shunting_cost) * 50) || 0,
      energy: Math.floor(parseFloat(row.total_shunting_cost) * 30) || 0
    }
  }));
}

function getRandomStatus() {
  const statuses = ['Available', 'Maintenance', 'Deployed', 'Service'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}
