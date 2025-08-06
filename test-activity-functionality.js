#!/usr/bin/env node
/**
 * Comprehensive test of Glass Activity functionality
 */

const axios = require('axios');

const API_BASE = 'http://localhost:9001';

const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': 'default_user'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
};

async function testActivityFunctionality() {
  console.log('🧪 Testing Glass Activity Functionality\n');
  
  const tests = [
    {
      name: 'Get Current Tracking Status',
      endpoint: '/api/activity/current'
    },
    {
      name: 'Get Activity Sessions',
      endpoint: '/api/activity/sessions'
    },
    {
      name: 'Get Activity Insights',
      endpoint: '/api/activity/insights'
    },
    {
      name: 'Get Productivity Score',
      endpoint: '/api/research/analysis/current-score'
    },
    {
      name: 'Start Activity Tracking',
      endpoint: '/api/activity/tracking/start',
      method: 'POST'
    },
    {
      name: 'Trigger Manual Capture',
      endpoint: '/api/activity/capture',
      method: 'POST'
    },
    {
      name: 'Stop Activity Tracking',
      endpoint: '/api/activity/tracking/stop',
      method: 'POST'
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`📋 Testing: ${test.name}`);
      const result = await apiCall(test.endpoint, test.method || 'GET');
      
      console.log(`✅ PASS: ${test.name}`);
      console.log(`   Response:`, JSON.stringify(result, null, 2).substring(0, 200) + '...\n');
      
      passedTests++;
    } catch (error) {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All activity API endpoints are working correctly!');
    
    // Additional data validation tests
    console.log('\n🔍 Validating Data Structures...');
    
    try {
      const trackingStatus = await apiCall('/api/activity/current');
      const sessions = await apiCall('/api/activity/sessions');
      const insights = await apiCall('/api/activity/insights');
      
      // Validate tracking status structure
      const requiredStatusFields = ['isTracking', 'currentActivity', 'lastAnalysis', 'captureInterval'];
      const hasAllStatusFields = requiredStatusFields.every(field => field in trackingStatus);
      console.log(`✅ Tracking Status Structure: ${hasAllStatusFields ? 'Valid' : 'Invalid'}`);
      
      // Validate sessions structure
      const isSessionsArray = Array.isArray(sessions);
      const hasSessionFields = sessions.length > 0 ? ['id', 'title', 'started_at'].every(field => field in sessions[0]) : true;
      console.log(`✅ Sessions Structure: ${isSessionsArray && hasSessionFields ? 'Valid' : 'Invalid'}`);
      
      // Validate insights structure
      const hasInsightsFields = ['insights', 'recommendations', 'trends'].every(field => field in insights);
      console.log(`✅ Insights Structure: ${hasInsightsFields ? 'Valid' : 'Invalid'}`);
      
      console.log('\n🎯 Activity Page Key Features Test:');
      
      // Test specific features the activity page relies on
      console.log('📈 Dashboard Metrics:');
      console.log(`   - Total Sessions: ${sessions.length}`);
      console.log(`   - Tracking Active: ${trackingStatus.isTracking ? 'Yes' : 'No'}`);
      console.log(`   - AI Insights: ${insights.insights.length} available`);
      console.log(`   - Recommendations: ${insights.recommendations.length} available`);
      
      console.log('\n📱 Real-time Features:');
      console.log(`   - Current Activity: ${trackingStatus.currentActivity ? 'Active' : 'None'}`);
      console.log(`   - Last Analysis: ${trackingStatus.lastAnalysis ? 'Available' : 'None'}`);
      console.log(`   - Capture Interval: ${trackingStatus.captureInterval / 1000 / 60} minutes`);
      
      console.log('\n🧠 AI Analysis:');
      console.log(`   - Productivity Trend: ${insights.trends.productivity}`);
      console.log(`   - Focus Trend: ${insights.trends.focus}`);
      
    } catch (error) {
      console.log(`❌ Data validation failed: ${error.message}`);
    }
    
  } else {
    console.log('❌ Some tests failed. Check the API server and try again.');
  }
}

// Run the tests
testActivityFunctionality().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});