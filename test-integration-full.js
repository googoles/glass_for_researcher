// Test Research Integration with Mock Data
// Simulates the complete integration without requiring a full Glass setup

const path = require('path');

// Mock the database path to use a temporary test database
process.env.GLASS_DB_PATH = path.join(__dirname, 'test.db');

async function testResearchIntegration() {
  console.log('\n=== Testing Research Mode Integration ===\n');

  try {
    // Test 1: Research service initialization
    console.log('1. Testing Research Service initialization...');
    const researchService = require('./src/research-modules/services/researchService');
    
    // Initialize the database connection first
    const sqliteClient = require('./src/features/common/services/sqliteClient');
    await sqliteClient.connect();
    
    await researchService.initialize();
    console.log('✅ Research service initialized successfully');

    // Test 2: Database table creation
    console.log('\n2. Testing database table creation...');
    const db = sqliteClient.getDatabase();
    
    // Check if tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'research_%'
    `);
    
    console.log(`✅ Found ${tables.length} research tables:`, tables.map(t => t.name));

    // Test 3: Insert test session
    console.log('\n3. Testing session creation...');
    const sessionId = await researchService.startSession({
      session_type: 'pdf_reading',
      title: 'Test Paper.pdf',
      metadata: { filename: 'test-paper.pdf', source: 'test' }
    });
    console.log(`✅ Created test session with ID: ${sessionId}`);

    // Test 4: End session and check duration
    console.log('\n4. Testing session completion...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await researchService.endSession(sessionId);
    
    const session = await researchService.getSessionById(sessionId);
    console.log(`✅ Session completed. Duration: ${session.duration_ms}ms`);

    // Test 5: Get dashboard data
    console.log('\n5. Testing dashboard data retrieval...');
    const dashboardData = {
      recentSessions: await researchService.getRecentSessions(5),
      recentPdfs: await researchService.getRecentPdfs(5),
      dailyStats: await researchService.getDailyStats(new Date().toISOString().split('T')[0])
    };
    
    console.log('✅ Dashboard data retrieved:');
    console.log(`   - Recent sessions: ${dashboardData.recentSessions.length}`);
    console.log(`   - Recent PDFs: ${dashboardData.recentPdfs.length}`);
    console.log(`   - Daily stats: ${dashboardData.dailyStats ? 'Available' : 'Not available'}`);

    // Test 6: Research integration API
    console.log('\n6. Testing research integration API...');
    
    // Enable research mode for testing
    process.env.RESEARCH_MODE = 'true';
    
    const researchIntegration = require('./src/research-integration');
    
    // Test status API
    const status = await researchIntegration.getStatus();
    console.log(`✅ Status API: isInitialized=${status.isInitialized}`);
    
    // Test dashboard API
    const dashboardApiData = await researchIntegration.getDashboardData();
    console.log(`✅ Dashboard API: ${dashboardApiData.recentSessions.length} sessions`);

    // Test 7: Web API endpoints simulation
    console.log('\n7. Testing web API endpoints...');
    
    // Mock Express request object
    const mockReq = {
      bridge: {
        invoke: async (method, params) => {
          switch (method) {
            case 'research:get-status':
              return await researchIntegration.getStatus();
            case 'research:get-dashboard-data':
              return await researchIntegration.getDashboardData();
            case 'research:get-sessions':
              return await researchIntegration.getSessions(params?.limit, params?.offset);
            default:
              throw new Error(`Unknown method: ${method}`);
          }
        }
      }
    };

    // Test status endpoint
    const statusResult = await mockReq.bridge.invoke('research:get-status');
    console.log(`✅ Status endpoint: tracking=${statusResult.isTracking}`);

    // Test dashboard endpoint
    const dashboardResult = await mockReq.bridge.invoke('research:get-dashboard-data');
    console.log(`✅ Dashboard endpoint: ${dashboardResult.recentSessions.length} sessions`);

    // Test sessions endpoint
    const sessionsResult = await mockReq.bridge.invoke('research:get-sessions', { limit: 10, offset: 0 });
    console.log(`✅ Sessions endpoint: ${sessionsResult.length} sessions`);

    console.log('\n🎉 All integration tests passed!');
    
    // Cleanup
    await sqliteClient.close();
    
    return true;

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testResearchIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = { testResearchIntegration };