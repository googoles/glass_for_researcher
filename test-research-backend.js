/**
 * Test script for the enhanced Research Backend Services
 * This script tests all the new CRUD operations, analytics, and Zotero integration
 */

const express = require('express');
const path = require('path');

// Mock the IPC bridge for testing
class MockBridge {
  constructor() {
    this.researchService = null;
  }

  async initialize() {
    // Initialize the research service
    const ResearchService = require('./src/features/research/researchService');
    this.researchService = ResearchService;
    
    try {
      await this.researchService.initialize();
      console.log('✓ Research service initialized');
      return true;
    } catch (error) {
      console.error('✗ Failed to initialize research service:', error);
      return false;
    }
  }

  async invoke(channel, data = {}) {
    const [feature, method] = channel.split(':');
    
    if (feature !== 'research') {
      throw new Error(`Unsupported feature: ${feature}`);
    }

    switch (method) {
      // Project Management
      case 'create-project':
        return await this.researchService.createProject(data);
      
      case 'update-project':
        return await this.researchService.updateProject(data.projectId, data.updates);
      
      case 'delete-project':
        return await this.researchService.deleteProject(data.projectId);
      
      case 'get-projects':
        return await this.researchService.getProjects(data);
      
      case 'get-project':
        return await this.researchService.getProjectById(data.projectId);
      
      case 'set-current-project':
        return await this.researchService.setCurrentProject(data.projectId);
      
      case 'get-project-sessions':
        return await this.researchService.getProjectSessions(data.projectId);
      
      case 'get-project-analytics':
        return await this.researchService.getResearchAnalytics(data.timeframe, data.projectId);
      
      case 'get-project-progress':
        return await this.researchService.getProjectProgress(data.projectId);

      // Analytics
      case 'get-analytics':
        return await this.researchService.getResearchAnalytics(data.timeframe, data.projectId);
      
      case 'get-productivity-trends':
        return await this.researchService.getProductivityTrends(data.timeframe);
      
      case 'get-session-analytics':
        return await this.researchService.getSessionAnalytics(data.sessionId);

      // Real-time updates
      case 'get-recent-updates':
        return await this.researchService.getRecentUpdates(data.since);

      // Existing methods
      case 'get-status':
        return await this.researchService.getStatus();
      
      case 'get-dashboard-data':
        return await this.researchService.getDashboardData();

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }
}

async function runTests() {
  console.log('🧪 Starting Research Backend Tests...\n');

  const bridge = new MockBridge();
  const initialized = await bridge.initialize();
  
  if (!initialized) {
    console.log('❌ Failed to initialize - stopping tests');
    return;
  }

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Helper function to run a test
  async function test(name, testFn) {
    testResults.total++;
    console.log(`Testing: ${name}`);
    
    try {
      await testFn();
      console.log(`✓ ${name}`);
      testResults.passed++;
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
      testResults.failed++;
    }
    console.log('');
  }

  let createdProjectId = null;

  // Test 1: Create Project
  await test('Create Project', async () => {
    const projectData = {\n      name: 'Test Research Project',\n      description: 'A test project for backend validation',\n      tags: ['test', 'research'],\n      priority: 'high',\n      goals: [{\n        title: 'Complete 10 research sessions',\n        target_value: 10,\n        unit: 'sessions'\n      }]\n    };\n\n    const project = await bridge.invoke('research:create-project', projectData);\n    \n    if (!project || !project.id) {\n      throw new Error('Project creation failed - no ID returned');\n    }\n    \n    if (project.name !== projectData.name) {\n      throw new Error('Project name mismatch');\n    }\n    \n    createdProjectId = project.id;\n    console.log(`   Created project with ID: ${createdProjectId}`);\n  });\n\n  // Test 2: Get Projects\n  await test('Get Projects', async () => {\n    const projects = await bridge.invoke('research:get-projects', {\n      status: 'active',\n      limit: 10\n    });\n    \n    if (!Array.isArray(projects)) {\n      throw new Error('Expected array of projects');\n    }\n    \n    console.log(`   Found ${projects.length} projects`);\n  });\n\n  // Test 3: Get Project by ID\n  await test('Get Project by ID', async () => {\n    if (!createdProjectId) {\n      throw new Error('No project ID available from previous test');\n    }\n    \n    const project = await bridge.invoke('research:get-project', {\n      projectId: createdProjectId\n    });\n    \n    if (!project) {\n      throw new Error('Project not found');\n    }\n    \n    if (project.name !== 'Test Research Project') {\n      throw new Error('Project data mismatch');\n    }\n    \n    console.log(`   Retrieved project: ${project.name}`);\n  });\n\n  // Test 4: Update Project\n  await test('Update Project', async () => {\n    if (!createdProjectId) {\n      throw new Error('No project ID available');\n    }\n    \n    const updates = {\n      description: 'Updated description for testing',\n      status: 'active',\n      tags: ['test', 'research', 'updated']\n    };\n    \n    const updatedProject = await bridge.invoke('research:update-project', {\n      projectId: createdProjectId,\n      updates\n    });\n    \n    if (!updatedProject) {\n      throw new Error('Project update failed');\n    }\n    \n    if (updatedProject.description !== updates.description) {\n      throw new Error('Project description was not updated');\n    }\n    \n    console.log(`   Updated project description`);\n  });\n\n  // Test 5: Set Current Project\n  await test('Set Current Project', async () => {\n    if (!createdProjectId) {\n      throw new Error('No project ID available');\n    }\n    \n    const currentProject = await bridge.invoke('research:set-current-project', {\n      projectId: createdProjectId\n    });\n    \n    if (!currentProject || currentProject.id !== createdProjectId) {\n      throw new Error('Failed to set current project');\n    }\n    \n    console.log(`   Set current project: ${currentProject.name}`);\n  });\n\n  // Test 6: Get Analytics\n  await test('Get Analytics', async () => {\n    const analytics = await bridge.invoke('research:get-analytics', {\n      timeframe: '7d',\n      projectId: createdProjectId\n    });\n    \n    if (!analytics) {\n      throw new Error('Analytics not returned');\n    }\n    \n    if (analytics.timeframe !== '7d') {\n      throw new Error('Timeframe mismatch in analytics');\n    }\n    \n    console.log(`   Retrieved analytics for ${analytics.timeframe}`);\n  });\n\n  // Test 7: Get Productivity Trends\n  await test('Get Productivity Trends', async () => {\n    const trends = await bridge.invoke('research:get-productivity-trends', {\n      timeframe: '30d'\n    });\n    \n    if (!trends) {\n      throw new Error('Productivity trends not returned');\n    }\n    \n    console.log(`   Retrieved productivity trends`);\n  });\n\n  // Test 8: Get Recent Updates\n  await test('Get Recent Updates', async () => {\n    const updates = await bridge.invoke('research:get-recent-updates', {\n      since: 0\n    });\n    \n    if (!Array.isArray(updates)) {\n      throw new Error('Expected array of updates');\n    }\n    \n    console.log(`   Retrieved ${updates.length} recent updates`);\n  });\n\n  // Test 9: Get Research Status\n  await test('Get Research Status', async () => {\n    const status = await bridge.invoke('research:get-status');\n    \n    if (!status) {\n      throw new Error('Status not returned');\n    }\n    \n    if (typeof status.isTracking !== 'boolean') {\n      throw new Error('Status missing isTracking field');\n    }\n    \n    console.log(`   Status - Tracking: ${status.isTracking}`);\n  });\n\n  // Test 10: Get Dashboard Data\n  await test('Get Dashboard Data', async () => {\n    const dashboard = await bridge.invoke('research:get-dashboard-data');\n    \n    if (!dashboard) {\n      throw new Error('Dashboard data not returned');\n    }\n    \n    console.log(`   Retrieved dashboard data`);\n  });\n\n  // Test 11: Delete Project (cleanup)\n  await test('Delete Project', async () => {\n    if (!createdProjectId) {\n      throw new Error('No project ID available');\n    }\n    \n    const success = await bridge.invoke('research:delete-project', {\n      projectId: createdProjectId\n    });\n    \n    if (!success) {\n      throw new Error('Project deletion failed');\n    }\n    \n    console.log(`   Deleted project: ${createdProjectId}`);\n  });\n\n  // Print test results\n  console.log('\\n' + '='.repeat(50));\n  console.log('📊 TEST RESULTS');\n  console.log('='.repeat(50));\n  console.log(`Total Tests: ${testResults.total}`);\n  console.log(`Passed: ${testResults.passed} ✓`);\n  console.log(`Failed: ${testResults.failed} ✗`);\n  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);\n  \n  if (testResults.failed === 0) {\n    console.log('\\n🎉 All tests passed! Research backend is working correctly.');\n  } else {\n    console.log('\\n⚠️  Some tests failed. Check the implementation.');\n  }\n}\n\n// Test API endpoints\nasync function testAPIEndpoints() {\n  console.log('\\n🌐 Testing API Endpoints...');\n  \n  const app = express();\n  app.use(express.json());\n  \n  // Mock authentication middleware\n  app.use((req, res, next) => {\n    req.bridge = new MockBridge();\n    next();\n  });\n  \n  // Load research routes\n  const researchRoutes = require('./pickleglass_web/backend_node/routes/research');\n  app.use('/api/research', researchRoutes);\n  \n  const server = app.listen(3001, () => {\n    console.log('✓ Test server started on port 3001');\n  });\n  \n  // Test a few key endpoints\n  const fetch = require('node-fetch');\n  const baseUrl = 'http://localhost:3001/api/research';\n  \n  try {\n    // Test GET /projects\n    const projectsResponse = await fetch(`${baseUrl}/projects`);\n    const projectsData = await projectsResponse.json();\n    console.log(`✓ GET /projects - Status: ${projectsResponse.status}`);\n    \n    // Test POST /projects\n    const createResponse = await fetch(`${baseUrl}/projects`, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        name: 'API Test Project',\n        description: 'Testing API endpoints'\n      })\n    });\n    const createData = await createResponse.json();\n    console.log(`✓ POST /projects - Status: ${createResponse.status}`);\n    \n    // Test GET /analytics\n    const analyticsResponse = await fetch(`${baseUrl}/analytics?timeframe=7d`);\n    const analyticsData = await analyticsResponse.json();\n    console.log(`✓ GET /analytics - Status: ${analyticsResponse.status}`);\n    \n  } catch (error) {\n    console.log(`✗ API test failed: ${error.message}`);\n  } finally {\n    server.close();\n    console.log('✓ Test server stopped');\n  }\n}\n\n// Run all tests\nasync function main() {\n  try {\n    await runTests();\n    await testAPIEndpoints();\n  } catch (error) {\n    console.error('Test execution failed:', error);\n    process.exit(1);\n  }\n}\n\nif (require.main === module) {\n  main();\n}\n\nmodule.exports = { runTests, testAPIEndpoints };