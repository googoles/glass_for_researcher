#!/usr/bin/env node

/**
 * Full Workflow Testing Script
 * Tests the complete activity workflow with Electron app running
 */

const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class FullWorkflowTester {
  constructor() {
    this.results = {
      setup: { passed: 0, failed: 0, tests: [] },
      backend: { passed: 0, failed: 0, tests: [] },
      api: { passed: 0, failed: 0, tests: [] },
      integration: { passed: 0, failed: 0, tests: [] }
    };
    this.electronProcess = null;
    this.baseUrl = 'http://localhost:3000';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = { info: '📋', success: '✅', error: '❌', test: '🧪', warning: '⚠️' }[type] || '📋';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  recordTest(category, testName, passed, details = null) {
    const test = { testName, passed, details, timestamp: Date.now() };
    this.results[category].tests.push(test);
    
    if (passed) {
      this.results[category].passed++;
      this.log(`${testName}: PASSED`, 'success');
    } else {
      this.results[category].failed++;
      this.log(`${testName}: FAILED - ${details}`, 'error');
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runFullWorkflowTest() {
    this.log('Starting comprehensive full workflow test...', 'test');
    
    try {
      // Phase 1: Setup Tests
      this.log('Phase 1: Testing setup and file structure', 'test');
      await this.testSetup();

      // Phase 2: Start Electron Application
      this.log('Phase 2: Starting Electron application', 'test');
      const appStarted = await this.startElectronApp();
      
      if (!appStarted) {
        this.log('Cannot continue without Electron app - skipping remaining tests', 'warning');
        this.generateReport();
        return;
      }

      // Wait for app to fully initialize
      await this.delay(10000);

      // Phase 3: Test Backend/IPC Integration
      this.log('Phase 3: Testing backend integration', 'test');
      await this.testBackendIntegration();

      // Phase 4: Test API Endpoints
      this.log('Phase 4: Testing API endpoints', 'test');
      await this.testApiEndpoints();

      // Phase 5: Test End-to-End Workflows
      this.log('Phase 5: Testing end-to-end workflows', 'test');
      await this.testWorkflows();

    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
    } finally {
      await this.cleanup();
      this.generateReport();
    }
  }

  async testSetup() {
    // Test 1: Core files exist
    const coreFiles = [
      'src/features/activity/activityService.js',
      'src/bridge/featureBridge.js',
      'pickleglass_web/backend_node/routes/activity.js',
      'pickleglass_web/app/activity/page.tsx'
    ];

    for (const file of coreFiles) {
      const exists = fs.existsSync(path.join('.', file));
      this.recordTest('setup', `File exists: ${file}`, exists, 
        exists ? null : 'File not found');
    }

    // Test 2: Dependencies installed
    const nodeModulesExists = fs.existsSync('./node_modules');
    this.recordTest('setup', 'Node modules installed', nodeModulesExists,
      nodeModulesExists ? null : 'Run npm install');

    // Test 3: Build files exist
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync('npm run build:renderer');
      this.recordTest('setup', 'Renderer build successful', true, 'Build completed');
    } catch (error) {
      this.recordTest('setup', 'Renderer build successful', false, error.message);
    }
  }

  async startElectronApp() {
    return new Promise((resolve) => {
      try {
        this.log('Starting Electron application...', 'test');
        
        this.electronProcess = spawn('npm', ['start'], {
          cwd: '.',
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false
        });

        let appReady = false;
        let initializationSeen = false;
        
        const timeout = setTimeout(() => {
          if (!appReady) {
            this.log('Electron startup timeout - app may not be fully ready', 'warning');
            appReady = true;
            resolve(true);
          }
        }, 45000); // 45 second timeout

        this.electronProcess.stdout.on('data', (data) => {
          const output = data.toString();
          
          // Log important messages
          if (output.includes('Activity Service') || 
              output.includes('initialized') ||
              output.includes('ready') ||
              output.includes('server running') ||
              output.includes('listening')) {
            this.log(`App output: ${output.trim()}`, 'info');
            
            if (output.includes('Activity Service')) {
              initializationSeen = true;
            }
            
            if (output.includes('server running') || output.includes('listening')) {
              if (!appReady) {
                clearTimeout(timeout);
                appReady = true;
                this.recordTest('backend', 'Electron App Started', true, 'App is running');
                resolve(true);
              }
            }
          }
        });

        this.electronProcess.stderr.on('data', (data) => {
          const output = data.toString();
          if (!output.includes('Warning') && !output.includes('deprecated')) {
            this.log(`App error: ${output.trim()}`, 'warning');
          }
        });

        this.electronProcess.on('error', (error) => {
          if (!appReady) {
            clearTimeout(timeout);
            appReady = true;
            this.recordTest('backend', 'Electron App Started', false, error.message);
            resolve(false);
          }
        });

        this.electronProcess.on('exit', (code) => {
          if (!appReady) {
            clearTimeout(timeout);
            appReady = true;
            this.recordTest('backend', 'Electron App Started', false, `App exited with code ${code}`);
            resolve(false);
          }
        });

      } catch (error) {
        this.recordTest('backend', 'Electron App Started', false, error.message);
        resolve(false);
      }
    });
  }

  async testBackendIntegration() {
    // Test if web server is running
    try {
      const response = await axios.get(`${this.baseUrl}`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      const serverRunning = response.status < 500;
      this.recordTest('backend', 'Web Server Running', serverRunning,
        serverRunning ? `Server responded with ${response.status}` : 'Server not responding');
        
    } catch (error) {
      this.recordTest('backend', 'Web Server Running', false, 
        error.code === 'ECONNREFUSED' ? 'Server not started' : error.message);
    }
  }

  async testApiEndpoints() {
    const endpoints = [
      { method: 'GET', path: '/api/activity/current', name: 'Get Activity Status' },
      { method: 'POST', path: '/api/activity/capture', name: 'Manual Capture' },
      { method: 'GET', path: '/api/activity/sessions', name: 'Get Sessions' },
      { method: 'GET', path: '/api/activity/dashboard', name: 'Get Dashboard' },
      { method: 'GET', path: '/api/activity/insights', name: 'Get Insights' }
    ];

    for (const endpoint of endpoints) {
      try {
        let response;
        
        if (endpoint.method === 'GET') {
          response = await axios.get(`${this.baseUrl}${endpoint.path}`, {
            timeout: 15000,
            validateStatus: () => true
          });
        } else {
          response = await axios.post(`${this.baseUrl}${endpoint.path}`, {}, {
            timeout: 15000,
            validateStatus: () => true
          });
        }

        const success = response.status === 200;
        this.recordTest('api', endpoint.name, success, 
          success ? 'API responded successfully' : `HTTP ${response.status}`);

        if (success && response.data) {
          this.log(`${endpoint.name} response preview: ${JSON.stringify(response.data).slice(0, 150)}...`, 'info');
        }

      } catch (error) {
        this.recordTest('api', endpoint.name, false, 
          error.code === 'ECONNREFUSED' ? 'Connection refused' : error.message);
      }

      await this.delay(1000); // Pause between requests
    }
  }

  async testWorkflows() {
    // Workflow 1: Capture and Status Check
    try {
      this.log('Testing capture workflow...', 'test');
      
      // Capture screenshot
      const captureResponse = await axios.post(`${this.baseUrl}/api/activity/capture`, {}, {
        timeout: 20000,
        validateStatus: () => true
      });
      
      const captureSuccess = captureResponse.status === 200;
      this.recordTest('integration', 'Screenshot Capture', captureSuccess,
        captureSuccess ? 'Capture completed' : `Capture failed: ${captureResponse.status}`);

      if (captureSuccess) {
        // Wait a moment then check status
        await this.delay(2000);
        
        const statusResponse = await axios.get(`${this.baseUrl}/api/activity/current`, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        const statusSuccess = statusResponse.status === 200;
        this.recordTest('integration', 'Status After Capture', statusSuccess,
          statusSuccess ? 'Status retrieved' : `Status failed: ${statusResponse.status}`);
      }

    } catch (error) {
      this.recordTest('integration', 'Capture Workflow', false, error.message);
    }

    // Workflow 2: Dashboard Data Flow
    try {
      this.log('Testing dashboard workflow...', 'test');
      
      const dashboardResponse = await axios.get(`${this.baseUrl}/api/activity/dashboard`, {
        timeout: 15000,
        validateStatus: () => true
      });
      
      const dashboardSuccess = dashboardResponse.status === 200 && dashboardResponse.data;
      this.recordTest('integration', 'Dashboard Data Flow', dashboardSuccess,
        dashboardSuccess ? 'Dashboard data loaded' : 'Dashboard data failed');

      if (dashboardSuccess) {
        const data = dashboardResponse.data;
        const hasStructure = data.overview && data.tracking;
        this.recordTest('integration', 'Dashboard Structure', hasStructure,
          hasStructure ? 'Complete structure' : 'Missing sections');
      }

    } catch (error) {
      this.recordTest('integration', 'Dashboard Workflow', false, error.message);
    }
  }

  async cleanup() {
    this.log('Cleaning up test processes...', 'test');
    
    if (this.electronProcess) {
      try {
        this.electronProcess.kill('SIGTERM');
        await this.delay(3000);
        if (!this.electronProcess.killed) {
          this.electronProcess.kill('SIGKILL');
        }
        this.log('Electron process terminated', 'info');
      } catch (error) {
        this.log(`Error terminating Electron: ${error.message}`, 'warning');
      }
    }
  }

  generateReport() {
    let totalPassed = 0;
    let totalFailed = 0;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 FULL WORKFLOW TEST RESULTS');
    console.log('='.repeat(80));
    
    Object.entries(this.results).forEach(([category, results]) => {
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      const total = results.passed + results.failed;
      const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
      
      console.log(`\n📋 ${category.toUpperCase()} TESTS:`);
      console.log(`   ✅ Passed: ${results.passed}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      console.log(`   📈 Success Rate: ${successRate}%`);
      
      if (results.tests.length > 0) {
        console.log(`   📝 Details:`);
        results.tests.forEach(test => {
          const status = test.passed ? '✅' : '❌';
          const details = test.details ? ` - ${test.details}` : '';
          console.log(`      ${status} ${test.testName}${details}`);
        });
      }
    });
    
    const overallTotal = totalPassed + totalFailed;
    const overallRate = overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 OVERALL RESULTS:');
    console.log(`   Total Tests: ${overallTotal}`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📈 Success Rate: ${overallRate}%`);
    
    console.log('\n🔍 WORKFLOW STATUS:');
    if (overallRate >= 85) {
      console.log('   🎉 Excellent! Activity workflow is working well');
      console.log('   ✨ The capture and activity system is ready for production use');
    } else if (overallRate >= 70) {
      console.log('   👍 Good! Core functionality works with minor issues');
      console.log('   🔧 Some components may need fine-tuning');
    } else if (overallRate >= 50) {
      console.log('   ⚠️  Moderate issues detected');
      console.log('   🛠️  Several components need attention before production');
    } else {
      console.log('   🚨 Major issues detected');
      console.log('   🔨 Significant work needed to fix the workflow');
    }
    
    console.log('\n📁 Key Components Status:');
    const setupPassed = this.results.setup.passed;
    const setupTotal = this.results.setup.passed + this.results.setup.failed;
    const backendPassed = this.results.backend.passed;
    const backendTotal = this.results.backend.passed + this.results.backend.failed;
    const apiPassed = this.results.api.passed;
    const apiTotal = this.results.api.passed + this.results.api.failed;
    const integrationPassed = this.results.integration.passed;
    const integrationTotal = this.results.integration.passed + this.results.integration.failed;
    
    console.log(`   📦 Setup: ${setupPassed}/${setupTotal} (${setupTotal > 0 ? ((setupPassed/setupTotal)*100).toFixed(0) : 0}%)`);
    console.log(`   🖥️  Backend: ${backendPassed}/${backendTotal} (${backendTotal > 0 ? ((backendPassed/backendTotal)*100).toFixed(0) : 0}%)`);
    console.log(`   🔌 API: ${apiPassed}/${apiTotal} (${apiTotal > 0 ? ((apiPassed/apiTotal)*100).toFixed(0) : 0}%)`);
    console.log(`   🔄 Integration: ${integrationPassed}/${integrationTotal} (${integrationTotal > 0 ? ((integrationPassed/integrationTotal)*100).toFixed(0) : 0}%)`);
    
    console.log('\n✨ Test completed at:', new Date().toISOString());
    console.log('='.repeat(80) + '\n');
  }
}

// Run the full workflow test
if (require.main === module) {
  const tester = new FullWorkflowTester();
  tester.runFullWorkflowTest().catch(console.error);
}

module.exports = { FullWorkflowTester };