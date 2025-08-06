#!/usr/bin/env node

/**
 * Manual Activity Service Testing Script
 * 
 * This script directly tests the Activity Service functionality without launching the full Electron app.
 * Useful for debugging and verifying core functionality.
 */

const path = require('path');
const fs = require('fs');

// Mock Electron APIs for testing
const mockElectron = {
  BrowserWindow: {
    getAllWindows: () => [],
    fromId: () => null
  },
  desktopCapturer: {
    getSources: async () => [
      {
        thumbnail: {
          toJPEG: () => Buffer.from('mock-image-data', 'base64'),
          getSize: () => ({ width: 1920, height: 1080 })
        }
      }
    ]
  }
};

// Replace electron module
require.cache[require.resolve('electron')] = {
  exports: mockElectron
};

// Test runner
class ActivityServiceTester {
  constructor() {
    this.testResults = [];
    this.activityService = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = { info: '📋', success: '✅', error: '❌', test: '🧪' }[type] || '📋';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTests() {
    this.log('Starting Activity Service manual tests...', 'test');
    
    try {
      // Test 1: Load Activity Service
      await this.testLoadActivityService();
      
      // Test 2: Initialize Service
      await this.testServiceInitialization();
      
      // Test 3: Test Screenshot Capture
      await this.testScreenshotCapture();
      
      // Test 4: Test Activity Tracking Methods
      await this.testActivityTrackingMethods();
      
      // Test 5: Test Data Retrieval Methods
      await this.testDataRetrievalMethods();
      
      this.generateReport();
      
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      console.error(error);
    }
  }

  async testLoadActivityService() {
    try {
      this.log('Testing Activity Service module loading...', 'test');
      
      // Check if activity service file exists
      const servicePath = path.join(__dirname, 'src/features/activity/activityService.js');
      if (!fs.existsSync(servicePath)) {
        this.recordResult('Load Activity Service', false, 'activityService.js not found');
        return;
      }
      
      // Try to require the service
      this.activityService = require('./src/features/activity/activityService');
      
      if (this.activityService && typeof this.activityService === 'object') {
        this.recordResult('Load Activity Service', true, 'Service loaded successfully');
      } else {
        this.recordResult('Load Activity Service', false, 'Service not exported properly');
      }
      
    } catch (error) {
      this.recordResult('Load Activity Service', false, `Error loading service: ${error.message}`);
    }
  }

  async testServiceInitialization() {
    if (!this.activityService) {
      this.recordResult('Service Initialization', false, 'Service not loaded');
      return;
    }
    
    try {
      this.log('Testing Activity Service initialization...', 'test');
      
      // Test initialize method
      if (typeof this.activityService.initialize === 'function') {
        const result = await this.activityService.initialize();
        this.recordResult('Service Initialization', result === true, 
          result ? 'Initialized successfully' : 'Initialization failed');
      } else {
        this.recordResult('Service Initialization', false, 'Initialize method not found');
      }
      
    } catch (error) {
      this.recordResult('Service Initialization', false, `Initialization error: ${error.message}`);
    }
  }

  async testScreenshotCapture() {
    if (!this.activityService) {
      this.recordResult('Screenshot Capture', false, 'Service not loaded');
      return;
    }
    
    try {
      this.log('Testing screenshot capture functionality...', 'test');
      
      if (typeof this.activityService.captureScreenshot === 'function') {
        const result = await this.activityService.captureScreenshot();
        
        if (result && typeof result === 'object') {
          const hasRequiredProps = result.hasOwnProperty('success') && 
                                   result.hasOwnProperty('timestamp');
          
          if (result.success && hasRequiredProps) {
            this.recordResult('Screenshot Capture', true, 
              `Capture successful - dimensions: ${result.width}x${result.height || 'unknown'}`);
          } else {
            this.recordResult('Screenshot Capture', false, 
              `Capture failed: ${result.error || 'Unknown error'}`);
          }
        } else {
          this.recordResult('Screenshot Capture', false, 'Invalid capture result format');
        }
      } else {
        this.recordResult('Screenshot Capture', false, 'captureScreenshot method not found');
      }
      
    } catch (error) {
      this.recordResult('Screenshot Capture', false, `Capture error: ${error.message}`);
    }
  }

  async testActivityTrackingMethods() {
    if (!this.activityService) {
      this.recordResult('Activity Tracking Methods', false, 'Service not loaded');
      return;
    }
    
    try {
      this.log('Testing activity tracking methods...', 'test');
      
      const methods = [
        'startActivityTracking',
        'stopActivityTracking', 
        'getTrackingStatus',
        'updateSettings'
      ];
      
      let methodsFound = 0;
      for (const method of methods) {
        if (typeof this.activityService[method] === 'function') {
          methodsFound++;
        }
      }
      
      const allMethodsPresent = methodsFound === methods.length;
      this.recordResult('Activity Tracking Methods', allMethodsPresent, 
        `${methodsFound}/${methods.length} methods found`);
      
      // Test getTrackingStatus specifically
      if (typeof this.activityService.getTrackingStatus === 'function') {
        const status = await this.activityService.getTrackingStatus();
        const validStatus = status && typeof status === 'object' && 
                           status.hasOwnProperty('isTracking');
        this.recordResult('Get Tracking Status', validStatus, 
          validStatus ? `Tracking: ${status.isTracking}` : 'Invalid status format');
      }
      
    } catch (error) {
      this.recordResult('Activity Tracking Methods', false, `Method test error: ${error.message}`);
    }
  }

  async testDataRetrievalMethods() {
    if (!this.activityService) {
      this.recordResult('Data Retrieval Methods', false, 'Service not loaded');
      return;
    }
    
    try {
      this.log('Testing data retrieval methods...', 'test');
      
      const methods = [
        'getTimeline',
        'getProductivityMetrics',
        'getWeeklyStats',
        'getGoalProgress',
        'getActivities',
        'getDashboardData'
      ];
      
      let methodsFound = 0;
      for (const method of methods) {
        if (typeof this.activityService[method] === 'function') {
          methodsFound++;
        }
      }
      
      const allMethodsPresent = methodsFound === methods.length;
      this.recordResult('Data Retrieval Methods', allMethodsPresent, 
        `${methodsFound}/${methods.length} methods found`);
      
      // Test getDashboardData specifically
      if (typeof this.activityService.getDashboardData === 'function') {
        const dashboard = await this.activityService.getDashboardData();
        const validDashboard = dashboard && typeof dashboard === 'object' && 
                              dashboard.overview && dashboard.tracking;
        this.recordResult('Get Dashboard Data', validDashboard, 
          validDashboard ? 'Dashboard data structure valid' : 'Invalid dashboard format');
      }
      
      // Test getActivities specifically
      if (typeof this.activityService.getActivities === 'function') {
        const activities = await this.activityService.getActivities({ limit: 10 });
        const validActivities = activities && typeof activities === 'object' && 
                               Array.isArray(activities.activities);
        this.recordResult('Get Activities', validActivities, 
          validActivities ? `${activities.activities.length} activities retrieved` : 'Invalid activities format');
      }
      
    } catch (error) {
      this.recordResult('Data Retrieval Methods', false, `Data retrieval error: ${error.message}`);
    }
  }

  recordResult(testName, passed, details) {
    this.testResults.push({ testName, passed, details });
    const status = passed ? 'PASSED' : 'FAILED';
    const type = passed ? 'success' : 'error';
    this.log(`${testName}: ${status} - ${details}`, type);
  }

  generateReport() {
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ACTIVITY SERVICE MANUAL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log('\n📝 Test Details:');
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${result.testName}: ${result.details}`);
    });
    
    console.log('\n🔍 Analysis:');
    if (successRate >= 80) {
      console.log('   🎉 Activity Service is functioning well!');
    } else if (successRate >= 60) {
      console.log('   ⚠️  Some issues detected, but core functionality works.');
    } else {
      console.log('   🚨 Significant issues detected. Service may not be working properly.');
    }
    
    console.log('\n✨ Manual test completed at:', new Date().toISOString());
    console.log('='.repeat(60) + '\n');
  }
}

// Run the manual tests
if (require.main === module) {
  const tester = new ActivityServiceTester();
  tester.runTests().catch(console.error);
}

module.exports = { ActivityServiceTester };