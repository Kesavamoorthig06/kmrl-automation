exports.handler = async (event, context) => {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Generate real-time analytics data
    const analytics = {
      systemStatus: {
        available: Math.floor(Math.random() * 20) + 10,
        maintenance: Math.floor(Math.random() * 8) + 2,
        deployed: Math.floor(Math.random() * 15) + 5,
        violations: Math.floor(Math.random() * 10) + 1
      },
      performance: {
        efficiency: Math.floor(Math.random() * 20) + 80,
        reliability: Math.floor(Math.random() * 15) + 85,
        utilization: Math.floor(Math.random() * 25) + 75,
        cost: Math.floor(Math.random() * 2000) + 8000
      },
      trends: {
        availability: generateTrendData(6),
        efficiency: generateTrendData(6),
        maintenance: generateTrendData(6),
        violations: generateTrendData(6)
      },
      insights: [
        {
          type: 'success',
          title: 'High Efficiency Score',
          description: 'System efficiency is above 90%',
          priority: 'high'
        },
        {
          type: 'warning',
          title: 'Maintenance Due',
          description: '3 trains require scheduled maintenance',
          priority: 'medium'
        },
        {
          type: 'info',
          title: 'Optimal Utilization',
          description: 'Fleet utilization is within optimal range',
          priority: 'low'
        }
      ],
      charts: {
        availabilityTrend: {
          labels: ['6h ago', '4h ago', '2h ago', '1h ago', '30m ago', 'Now'],
          data: generateTrendData(6)
        },
        maintenanceWorkload: {
          labels: ['Scheduled', 'Emergency', 'Preventive', 'Overdue'],
          data: [
            Math.floor(Math.random() * 5) + 3,
            Math.floor(Math.random() * 3) + 1,
            Math.floor(Math.random() * 4) + 2,
            Math.floor(Math.random() * 2) + 1
          ]
        },
        violationTypes: {
          labels: ['Fitness', 'Job Cards', 'Cleaning', 'Branding'],
          critical: [
            Math.floor(Math.random() * 3) + 1,
            Math.floor(Math.random() * 2) + 1,
            Math.floor(Math.random() * 2),
            Math.floor(Math.random() * 3) + 1
          ],
          warning: [
            Math.floor(Math.random() * 4) + 2,
            Math.floor(Math.random() * 3) + 2,
            Math.floor(Math.random() * 3) + 2,
            Math.floor(Math.random() * 2) + 1
          ]
        },
        efficiencyRadar: {
          labels: ['Energy', 'Operations', 'Maintenance', 'Utilization', 'Reliability'],
          data: [
            Math.floor(Math.random() * 20) + 80,
            Math.floor(Math.random() * 15) + 85,
            Math.floor(Math.random() * 25) + 75,
            Math.floor(Math.random() * 20) + 80,
            Math.floor(Math.random() * 10) + 90
          ]
        }
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: analytics
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

function generateTrendData(points) {
  const data = [];
  let baseValue = Math.floor(Math.random() * 20) + 10;
  
  for (let i = 0; i < points; i++) {
    const variation = (Math.random() - 0.5) * 4;
    baseValue = Math.max(0, baseValue + variation);
    data.push(Math.floor(baseValue));
  }
  
  return data;
}
