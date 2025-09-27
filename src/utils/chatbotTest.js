/**
 * Chatbot Test Utility
 * Tests the enhanced KMRC chatbot functionality
 */

import AIChatService from '../services/AIChatService.js';
import KMRCKnowledgeService from '../services/KMRCKnowledgeService.js';

export class ChatbotTester {
  static async runTests() {
    console.log('🧪 Starting KMRC Chatbot Tests...\n');

    const testCases = [
      {
        category: 'Station Information',
        tests: [
          'Tell me about Edappally station',
          'What are the running bays at Aluva?',
          'How many passengers use MG Road station daily?',
          'What facilities are available at Cochin University station?'
        ]
      },
      {
        category: 'Running Bay Management',
        tests: [
          'How many running bays are there in total?',
          'Which stations have maintenance facilities?',
          'What is the capacity of Petta running bays?',
          'Where should I do major maintenance work?'
        ]
      },
      {
        category: 'Train Operations',
        tests: [
          'What is the frequency during peak hours?',
          'How long does it take from Aluva to Petta?',
          'What are the operating hours?',
          'How many trains are operational?'
        ]
      },
      {
        category: 'Emergency Procedures',
        tests: [
          'What should I do in an emergency?',
          'What are the emergency contact numbers?',
          'How do I report a security issue?',
          'What are the emergency procedures?'
        ]
      },
      {
        category: 'Future Expansions',
        tests: [
          'What is coming in Phase 2?',
          'When will the airport connection be ready?',
          'What new stations are planned?',
          'How will the expansions affect current operations?'
        ]
      },
      {
        category: 'Passenger Services',
        tests: [
          'What is the fare range?',
          'Are there student discounts?',
          'What languages are supported?',
          'What facilities are available for disabled passengers?'
        ]
      }
    ];

    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      categories: {}
    };

    for (const category of testCases) {
      console.log(`📋 Testing ${category.category}:`);
      results.categories[category.category] = { total: 0, passed: 0, failed: 0 };

      for (const testQuery of category.tests) {
        results.total++;
        results.categories[category.category].total++;
        
        try {
          console.log(`  ❓ ${testQuery}`);
          const response = await AIChatService.sendMessage(testQuery);
          
          if (response.success && response.message) {
            console.log(`  ✅ Response received (${response.message.length} characters)`);
            results.passed++;
            results.categories[category.category].passed++;
          } else {
            console.log(`  ❌ Failed: ${response.message || 'No response'}`);
            results.failed++;
            results.categories[category.category].failed++;
          }
        } catch (error) {
          console.log(`  ❌ Error: ${error.message}`);
          results.failed++;
          results.categories[category.category].failed++;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('');
    }

    // Print summary
    console.log('📊 Test Results Summary:');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed} (${Math.round((results.passed / results.total) * 100)}%)`);
    console.log(`Failed: ${results.failed} (${Math.round((results.failed / results.total) * 100)}%)`);
    console.log('\n📈 Results by Category:');
    
    for (const [category, stats] of Object.entries(results.categories)) {
      const percentage = Math.round((stats.passed / stats.total) * 100);
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${percentage}%)`);
    }

    return results;
  }

  static async testKMRCKnowledgeService() {
    console.log('🔍 Testing KMRC Knowledge Service...\n');

    const tests = [
      {
        name: 'Get Station Info',
        test: () => KMRCKnowledgeService.getStationInfo('Edappally'),
        expected: 'object'
      },
      {
        name: 'Get Running Bay Info',
        test: () => KMRCKnowledgeService.getRunningBayInfo('ALU'),
        expected: 'object'
      },
      {
        name: 'Get Operational Insights',
        test: () => KMRCKnowledgeService.getOperationalInsights('08:30'),
        expected: 'object'
      },
      {
        name: 'Get Passenger Flow Insights',
        test: () => KMRCKnowledgeService.getPassengerFlowInsights(),
        expected: 'object'
      },
      {
        name: 'Get Maintenance Recommendations',
        test: () => KMRCKnowledgeService.getMaintenanceRecommendations(),
        expected: 'object'
      },
      {
        name: 'Get Emergency Info',
        test: () => KMRCKnowledgeService.getEmergencyInfo(),
        expected: 'object'
      },
      {
        name: 'Get Future Expansions',
        test: () => KMRCKnowledgeService.getFutureExpansions(),
        expected: 'object'
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = test.test();
        if (result && typeof result === test.expected) {
          console.log(`  ✅ ${test.name}: Passed`);
          passed++;
        } else {
          console.log(`  ❌ ${test.name}: Failed - Expected ${test.expected}, got ${typeof result}`);
          failed++;
        }
      } catch (error) {
        console.log(`  ❌ ${test.name}: Error - ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Knowledge Service Results: ${passed}/${tests.length} passed`);
    return { passed, failed, total: tests.length };
  }

  static async runFullTest() {
    console.log('🚀 Running Full KMRC Chatbot Test Suite...\n');
    
    const knowledgeResults = await this.testKMRCKnowledgeService();
    console.log('\n' + '='.repeat(50) + '\n');
    const chatResults = await this.runTests();
    
    console.log('\n🎯 Overall Results:');
    console.log(`Knowledge Service: ${knowledgeResults.passed}/${knowledgeResults.total} passed`);
    console.log(`Chatbot Tests: ${chatResults.passed}/${chatResults.total} passed`);
    
    const overallPassed = knowledgeResults.passed + chatResults.passed;
    const overallTotal = knowledgeResults.total + chatResults.total;
    console.log(`Overall: ${overallPassed}/${overallTotal} passed (${Math.round((overallPassed / overallTotal) * 100)}%)`);
    
    return {
      knowledge: knowledgeResults,
      chatbot: chatResults,
      overall: { passed: overallPassed, total: overallTotal }
    };
  }
}

export default ChatbotTester;
