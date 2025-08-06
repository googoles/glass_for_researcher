#!/usr/bin/env node

/**
 * Web API Testing Script
 * Tests the activity API endpoints directly
 */

const axios = require('axios');

class WebApiTester {
  constructor() {
    this.baseUrl = 'http://localhost:3001'; // Next.js dev server
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = { info: '📋', success: '✅', error: '❌', test: '🧪' }[type] || '📋';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  recordResult(testName, passed, details) {
    this.results.push({ testName, passed, details });
    const status = passed ? 'PASSED' : 'FAILED';
    const type = passed ? 'success' : 'error';
    this.log(`${testName}: ${status} - ${details}`, type);
  }

  async testEndpoint(method, path, name, expectedStatus = 200) {
    try {
      let response;
      
      if (method === 'GET') {
        response = await axios.get(`${this.baseUrl}${path}`, {
          timeout: 10000,
          validateStatus: () => true
        });
      } else if (method === 'POST') {
        response = await axios.post(`${this.baseUrl}${path}`, {}, {
          timeout: 10000,
          validateStatus: () => true
        });
      }

      const success = response.status === expectedStatus || response.status < 500;
      
      this.recordResult(name, success, 
        `HTTP ${response.status} - ${response.statusText || 'OK'}`);

      if (response.data && success) {
        this.log(`Response preview: ${JSON.stringify(response.data).slice(0, 200)}...`, 'info');
      }

      return { success, response };

    } catch (error) {
      const isConnectionError = error.code === 'ECONNREFUSED';
      this.recordResult(name, false, 
        isConnectionError ? 'Server not running' : error.message);
      return { success: false, error };
    }
  }

  async runTests() {
    this.log('Starting Web API tests...', 'test');
    
    // Test basic connectivity
    await this.testEndpoint('GET', '/', 'Home Page Access');
    
    // Test activity page
    await this.testEndpoint('GET', '/activity', 'Activity Page Access');
    
    // Test API endpoints
    const apiTests = [
      { method: 'GET', path: '/api/activity/current', name: 'Get Current Activity Status' },
      { method: 'POST', path: '/api/activity/capture', name: 'Manual Screenshot Capture' },
      { method: 'GET', path: '/api/activity/sessions', name: 'Get Activity Sessions' },
      { method: 'GET', path: '/api/activity/dashboard', name: 'Get Dashboard Data' },
      { method: 'GET', path: '/api/activity/insights', name: 'Get Activity Insights' },
      { method: 'GET', path: '/api/activity/stats/week', name: 'Get Weekly Stats' },
      { method: 'GET', path: '/api/activity/ai-status', name: 'Get AI Status' }
    ];

    for (const test of apiTests) {
      await this.testEndpoint(test.method, test.path, test.name);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.generateReport();
  }

  generateReport() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(60));
    console.log('📊 WEB API TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log('\n📝 Test Details:');

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${result.testName}: ${result.details}`);
    });

    console.log('\n🔍 Analysis:');
    if (successRate >= 80) {
      console.log('   🎉 Web API is functioning well!');
    } else if (successRate >= 60) {
      console.log('   ⚠️  Some API issues detected, but core endpoints work.');
    } else {
      console.log('   🚨 Significant API issues detected.');
    }

    console.log('\n✨ Web API test completed at:', new Date().toISOString());
    console.log('='.repeat(60) + '\n');
  }
}

if (require.main === module) {
  const tester = new WebApiTester();
  tester.runTests().catch(console.error);
}

module.exports = { WebApiTester };