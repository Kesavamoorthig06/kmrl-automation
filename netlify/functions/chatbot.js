const fs = require('fs');
const path = require('path');

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

    const { message, context: chatContext } = JSON.parse(event.body || '{}');

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Message is required'
        })
      };
    }

    // Load knowledge base
    const knowledgeBase = loadKnowledgeBase();
    
    // Process the message and generate response
    const response = await processMessage(message, chatContext, knowledgeBase);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          message: response.message,
          suggestions: response.suggestions,
          context: response.context
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

function loadKnowledgeBase() {
  try {
    // Try to load the knowledge base file
    const knowledgePath = path.join(process.cwd(), 'src', 'data', 'kmrc-enhanced-knowledge.js');
    if (fs.existsSync(knowledgePath)) {
      delete require.cache[require.resolve(knowledgePath)];
      return require(knowledgePath);
    }
  } catch (error) {
    console.log('Could not load knowledge base, using default');
  }

  // Default knowledge base
  return {
    intents: {
      greeting: {
        patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        responses: [
          'Hello! I\'m the KMRL Metro Assistant. How can I help you today?',
          'Hi there! I\'m here to help with metro rail operations. What do you need?',
          'Good day! I can assist you with train schedules, maintenance, and system status.'
        ]
      },
      train_status: {
        patterns: ['train status', 'available trains', 'train availability', 'fleet status'],
        responses: [
          'Currently, we have 12 trains available for service, 3 under maintenance, and 8 deployed.',
          'The fleet status shows 12 operational trains ready for passenger service.',
          'Train availability is at 85% with 12 trains ready for deployment.'
        ]
      },
      maintenance: {
        patterns: ['maintenance', 'repair', 'inspection', 'maintenance schedule'],
        responses: [
          'We have 3 trains currently under maintenance. The average repair time is 4.2 hours.',
          'Maintenance operations are running smoothly with 94% parts availability.',
          'Scheduled maintenance is on track with preventive checks completed.'
        ]
      },
      violations: {
        patterns: ['violations', 'issues', 'problems', 'constraints'],
        responses: [
          'We have 7 total constraint violations: 3 fitness certificate issues, 2 job card violations, 1 cleaning standard issue, and 1 branding priority.',
          'Current violation status shows 78% resolution rate with average resolution time of 6.5 hours.',
          'Most violations are minor and being addressed promptly.'
        ]
      },
      efficiency: {
        patterns: ['efficiency', 'performance', 'system performance', 'metrics'],
        responses: [
          'System efficiency is at 92% with excellent reliability metrics.',
          'Performance indicators show 89% fleet utilization and 96.8% on-time performance.',
          'Our efficiency metrics are above target with 94% passenger satisfaction.'
        ]
      },
      cost: {
        patterns: ['cost', 'budget', 'expenses', 'financial'],
        responses: [
          'Total operational cost is ₹11,240M with breakdown: ₹9,500M operational, ₹1,740M maintenance.',
          'Cost per trip is ₹45.2 with 18.5% ROI and 94% budget utilization.',
          'Financial performance is excellent with costs within budget parameters.'
        ]
      },
      schedule: {
        patterns: ['schedule', 'timing', 'frequency', 'departure'],
        responses: [
          'Trains run every 3.2 minutes during peak hours and 6 minutes during off-peak.',
          'Service frequency is optimal with 96.8% on-time performance.',
          'Peak hours: 7-9 AM and 5-7 PM with increased frequency.'
        ]
      },
      help: {
        patterns: ['help', 'assistance', 'support', 'what can you do'],
        responses: [
          'I can help you with train status, maintenance updates, system performance, violations, costs, and schedules.',
          'Ask me about fleet operations, efficiency metrics, or any metro rail related questions.',
          'I provide real-time information about KMRL operations and system status.'
        ]
      }
    },
    fallback: [
      'I\'m not sure I understand. Could you rephrase your question?',
      'Let me help you with that. Could you provide more details?',
      'I can assist with train operations, maintenance, and system status. What specific information do you need?'
    ]
  };
}

async function processMessage(message, chatContext, knowledgeBase) {
  const lowerMessage = message.toLowerCase();
  
  // Find matching intent
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [intentName, intent] of Object.entries(knowledgeBase.intents)) {
    for (const pattern of intent.patterns) {
      const score = calculateSimilarity(lowerMessage, pattern);
      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = intentName;
      }
    }
  }
  
  let response;
  let suggestions = [];
  
  if (bestMatch) {
    const intent = knowledgeBase.intents[bestMatch];
    response = intent.responses[Math.floor(Math.random() * intent.responses.length)];
    
    // Add contextual suggestions
    suggestions = getSuggestions(bestMatch);
  } else {
    response = knowledgeBase.fallback[Math.floor(Math.random() * knowledgeBase.fallback.length)];
    suggestions = [
      'Ask about train status',
      'Check maintenance updates',
      'View system performance',
      'Get help with violations'
    ];
  }
  
  return {
    message: response,
    suggestions,
    context: {
      intent: bestMatch,
      confidence: bestScore
    }
  };
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

function getSuggestions(intent) {
  const suggestionMap = {
    greeting: ['Check train status', 'View maintenance', 'See system performance'],
    train_status: ['Check maintenance', 'View violations', 'See efficiency'],
    maintenance: ['Check train status', 'View violations', 'See cost breakdown'],
    violations: ['Check maintenance', 'View efficiency', 'See system status'],
    efficiency: ['Check train status', 'View cost analysis', 'See maintenance'],
    cost: ['Check efficiency', 'View maintenance', 'See system status'],
    schedule: ['Check train status', 'View maintenance', 'See efficiency'],
    help: ['Check train status', 'View maintenance', 'See system performance']
  };
  
  return suggestionMap[intent] || ['Check train status', 'View maintenance', 'See system performance'];
}
