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

    // Read each CSV file
    for (const file of csvFiles) {
      try {
        const filePath = path.join(process.cwd(), 'public', file);
        const csvContent = fs.readFileSync(filePath, 'utf8');
        data[file.replace('.csv', '')] = parseCSV(csvContent);
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
    id: row.Train_ID || `T${index + 1}`,
    name: row.Train_Name || `Train ${index + 1}`,
    status: getRandomStatus(),
    score: parseFloat(row.Score) || Math.random(),
    efficiency: parseFloat(row.Efficiency) || Math.random() * 100,
    reliability: parseFloat(row.Reliability) || Math.random() * 100,
    utilization: parseFloat(row.Utilization) || Math.random() * 100,
    mileage: parseFloat(row.Mileage) || Math.random() * 1000,
    lastMaintenance: row.Last_Maintenance || new Date().toISOString(),
    nextMaintenance: row.Next_Maintenance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    violations: {
      fitness: Math.floor(Math.random() * 5),
      jobCards: Math.floor(Math.random() * 3),
      cleaning: Math.floor(Math.random() * 4),
      branding: Math.floor(Math.random() * 2)
    },
    cost: {
      operational: Math.floor(Math.random() * 1000) + 500,
      maintenance: Math.floor(Math.random() * 200) + 100,
      energy: Math.floor(Math.random() * 300) + 150
    }
  }));
}

function getRandomStatus() {
  const statuses = ['Available', 'Maintenance', 'Deployed', 'Service'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}
