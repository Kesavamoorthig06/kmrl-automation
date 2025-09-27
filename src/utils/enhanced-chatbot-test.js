/**
 * Enhanced Chatbot Test Suite
 * Comprehensive testing for the advanced KMRC chatbot
 */

import AIChatService from '../services/AIChatService.js';
import AdvancedKMRCTrainingService from '../services/AdvancedKMRCTrainingService.js';
import KMRC_ENHANCED_KNOWLEDGE from '../data/kmrc-enhanced-knowledge.js';

export class EnhancedChatbotTester {
  static async runComprehensiveTests() {
    console.log('🚀 Starting Enhanced KMRC Chatbot Test Suite...\n');

    const testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      categories: {}
    };

    // Test Categories
    const testCategories = [
      {
        name: 'Station Information',
        tests: [
          'Tell me about all 24 KMRC stations',
          'What are the facilities at Edappally station?',
          'How many running bays are at Muttom depot?',
          'Which stations have Public Bicycle Sharing?',
          'What is the daily ridership at MG Road station?',
          'Tell me about Cochin University station facilities',
          'Which stations are terminal stations?',
          'What special features does Aluva station have?'
        ]
      },
      {
        name: 'Cultural Events & Festivals',
        tests: [
          'What festivals affect metro operations?',
          'Tell me about Onam special services',
          'How does Christmas impact metro ridership?',
          'What is Kochi-Muziris Biennale?',
          'When is Thrissur Pooram and how does it affect metro?',
          'What cultural events happen in December?',
          'How does New Year celebration affect metro services?',
          'Tell me about Kerala Tourism Week'
        ]
      },
      {
        name: 'Operational Details',
        tests: [
          'What is the current train frequency?',
          'Tell me about peak hour operations',
          'What are the train specifications?',
          'How long does it take from Aluva to SN Junction?',
          'What are the digital services available?',
          'Tell me about maintenance windows',
          'What is the fare structure?',
          'How does the CBTC signaling work?'
        ]
      },
      {
        name: 'Deployment & Scheduling',
        tests: [
          'How should I plan train deployment during Onam?',
          'What is the strategy for peak hour management?',
          'How to handle maintenance during festivals?',
          'What are the deployment strategies for different stations?',
          'How to manage crowd during New Year?',
          'What is the maintenance schedule?',
          'How to optimize train deployment?',
          'What are the running bay capacities?'
        ]
      },
      {
        name: 'Emergency & Safety',
        tests: [
          'What should I do in an emergency?',
          'What are the emergency contact numbers?',
          'How to report a security issue?',
          'What are the safety protocols?',
          'How to handle medical emergencies?',
          'What is the fire emergency procedure?',
          'How to contact control room?',
          'What are the emergency facilities at stations?'
        ]
      },
      {
        name: 'Future Expansions',
        tests: [
          'What is Phase 2 expansion?',
          'When will Infopark station be ready?',
          'Tell me about Phase 3 plans',
          'What is the airport connectivity plan?',
          'How will new stations affect operations?',
          'What is the timeline for expansions?',
          'How to prepare for new stations?',
          'What are the future running bay plans?'
        ]
      },
      {
        name: 'Multi-language Support',
        tests: [
          'Tell me about stations in Malayalam',
          'What is the Hindi name for Edappally?',
          'How to say "metro" in Malayalam?',
          'What are the station names in Hindi?',
          'Tell me about cultural events in Malayalam',
          'How to ask for help in Hindi?',
          'What are the festival names in Malayalam?',
          'Tell me about operations in Hindi'
        ]
      },
      {
        name: 'Contextual Intelligence',
        tests: [
          'What should I know about current operations?',
          'What recommendations do you have for today?',
          'How is the current season affecting metro?',
          'What cultural context should I consider?',
          'What are the current operational insights?',
          'How should I prepare for upcoming events?',
          'What is the current system status?',
          'What contextual advice do you have?'
        ]
      }
    ];

    // Run tests for each category
    for (const category of testCategories) {
      console.log(`📋 Testing ${category.name}:`);
      testResults.categories[category.name] = { total: 0, passed: 0, failed: 0 };

      for (const testQuery of category.tests) {
        testResults.total++;
        testResults.categories[category.name].total++;
        
        try {
          console.log(`  ❓ ${testQuery}`);
          
          // Test with mock system state
          const mockSystemState = {
            availableTrains: 22,
            totalViolations: 5,
            efficiencyScore: 87,
            currentTime: new Date().toLocaleTimeString('en-IN'),
            season: 'Winter',
            festival: 'Regular Operations'
          };

          const response = await AIChatService.sendMessage(testQuery, mockSystemState);
          
          if (response.success && response.message) {
            console.log(`  ✅ Response received (${response.message.length} characters)`);
            console.log(`  📝 Preview: ${response.message.substring(0, 100)}...`);
            testResults.passed++;
            testResults.categories[category.name].passed++;
          } else {
            console.log(`  ❌ Failed: ${response.message || 'No response'}`);
            testResults.failed++;
            testResults.categories[category.name].failed++;
          }
        } catch (error) {
          console.log(`  ❌ Error: ${error.message}`);
          testResults.failed++;
          testResults.categories[category.name].failed++;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      console.log('');
    }

    // Test Advanced Training Service
    console.log('🧠 Testing Advanced Training Service:');
    const trainingTests = [
      'Generate context for station query',
      'Get current season information',
      'Get festival context',
      'Generate operational recommendations',
      'Get cultural context',
      'Generate deployment context'
    ];

    for (const test of trainingTests) {
      try {
        const context = AdvancedKMRCTrainingService.generateContext(test);
        console.log(`  ✅ ${test}: Context generated successfully`);
      } catch (error) {
        console.log(`  ❌ ${test}: Error - ${error.message}`);
      }
    }

    // Print comprehensive results
    console.log('\n📊 Enhanced Test Results Summary:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} (${Math.round((testResults.passed / testResults.total) * 100)}%)`);
    console.log(`Failed: ${testResults.failed} (${Math.round((testResults.failed / testResults.total) * 100)}%)`);
    
    console.log('\n📈 Results by Category:');
    for (const [category, stats] of Object.entries(testResults.categories)) {
      const percentage = Math.round((stats.passed / stats.total) * 100);
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${percentage}%)`);
    }

    // Performance metrics
    console.log('\n🎯 Performance Metrics:');
    console.log(`- Station Knowledge: ${KMRC_ENHANCED_KNOWLEDGE.stations.length} stations`);
    console.log(`- Cultural Events: ${KMRC_ENHANCED_KNOWLEDGE.culturalEvents.majorFestivals.length} major festivals`);
    console.log(`- Cultural Events: ${KMRC_ENHANCED_KNOWLEDGE.culturalEvents.culturalEvents.length} cultural events`);
    console.log(`- Total Running Bays: 50+ across all stations`);
    console.log(`- Multi-language Support: English, Malayalam, Hindi`);

    return testResults;
  }

  static async testLLMCapabilities() {
    console.log('🤖 Testing LLM-like Capabilities...\n');

    const llmTests = [
      {
        query: 'I need to plan metro operations for Onam festival. What should I consider?',
        expectedFeatures: ['festival context', 'ridership impact', 'special services', 'crowd management']
      },
      {
        query: 'How can I optimize train deployment during peak hours at MG Road station?',
        expectedFeatures: ['station context', 'peak hour strategy', 'deployment optimization', 'crowd management']
      },
      {
        query: 'What cultural events are happening in December and how do they affect metro?',
        expectedFeatures: ['cultural context', 'event information', 'metro impact', 'special services']
      },
      {
        query: 'I want to understand the complete KMRC system architecture and operations.',
        expectedFeatures: ['comprehensive overview', 'system architecture', 'operational details', 'technical specifications']
      },
      {
        query: 'How should I handle emergency situations at Edappally station during Christmas?',
        expectedFeatures: ['emergency procedures', 'station context', 'festival context', 'safety protocols']
      }
    ];

    let llmScore = 0;
    const totalLLMTests = llmTests.length;

    for (const test of llmTests) {
      try {
        console.log(`🧪 Testing: ${test.query}`);
        
        const mockSystemState = {
          availableTrains: 22,
          totalViolations: 3,
          efficiencyScore: 89,
          currentTime: new Date().toLocaleTimeString('en-IN'),
          season: 'Winter',
          festival: 'Christmas Season'
        };

        const response = await AIChatService.sendMessage(test.query, mockSystemState);
        
        if (response.success && response.message) {
          const responseText = response.message.toLowerCase();
          const foundFeatures = test.expectedFeatures.filter(feature => 
            responseText.includes(feature.toLowerCase())
          );
          
          const featureScore = (foundFeatures.length / test.expectedFeatures.length) * 100;
          console.log(`  ✅ Features found: ${foundFeatures.length}/${test.expectedFeatures.length} (${Math.round(featureScore)}%)`);
          console.log(`  📝 Features: ${foundFeatures.join(', ')}`);
          
          if (featureScore >= 75) {
            llmScore++;
          }
        } else {
          console.log(`  ❌ No response received`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const llmPercentage = Math.round((llmScore / totalLLMTests) * 100);
    console.log(`\n🎯 LLM Capability Score: ${llmScore}/${totalLLMTests} (${llmPercentage}%)`);
    
    if (llmPercentage >= 80) {
      console.log('🌟 Excellent LLM-like capabilities!');
    } else if (llmPercentage >= 60) {
      console.log('✅ Good LLM-like capabilities!');
    } else {
      console.log('⚠️ Needs improvement for LLM-like capabilities');
    }

    return { score: llmScore, total: totalLLMTests, percentage: llmPercentage };
  }

  static async runFullTestSuite() {
    console.log('🚀 Running Complete Enhanced KMRC Chatbot Test Suite...\n');
    
    const comprehensiveResults = await this.runComprehensiveTests();
    console.log('\n' + '='.repeat(60) + '\n');
    const llmResults = await this.testLLMCapabilities();
    
    console.log('\n🎯 Overall Assessment:');
    console.log(`Comprehensive Tests: ${comprehensiveResults.passed}/${comprehensiveResults.total} passed`);
    console.log(`LLM Capabilities: ${llmResults.score}/${llmResults.total} passed (${llmResults.percentage}%)`);
    
    const overallScore = Math.round(((comprehensiveResults.passed / comprehensiveResults.total) + (llmResults.percentage / 100)) / 2 * 100);
    console.log(`Overall Score: ${overallScore}%`);
    
    if (overallScore >= 90) {
      console.log('🌟 EXCELLENT: Chatbot demonstrates advanced LLM-like capabilities!');
    } else if (overallScore >= 75) {
      console.log('✅ GOOD: Chatbot shows strong performance with room for minor improvements');
    } else if (overallScore >= 60) {
      console.log('⚠️ FAIR: Chatbot needs some improvements for optimal performance');
    } else {
      console.log('❌ NEEDS IMPROVEMENT: Chatbot requires significant enhancements');
    }
    
    return {
      comprehensive: comprehensiveResults,
      llm: llmResults,
      overall: { score: overallScore }
    };
  }
}

export default EnhancedChatbotTester;
