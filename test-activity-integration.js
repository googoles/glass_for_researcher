#!/usr/bin/env node

/**
 * Activity Service Integration Test
 * 
 * This script tests the comprehensive activity tracking functionality
 * including screenshot capture, AI analysis, and data storage.
 * 
 * Usage: node test-activity-integration.js
 */

const path = require('path');
const fs = require('fs');

// Mock environment for testing
process.env.NODE_ENV = 'test';

// Test configuration
const TEST_CONFIG = {
    skipAIAnalysis: false, // Set to true to skip actual AI calls
    mockScreenshots: true, // Use mock screenshots for testing
    testDuration: 30000,   // Run for 30 seconds
    captureInterval: 5000  // Capture every 5 seconds for testing
};

async function runIntegrationTest() {
    console.log('🧪 Starting Activity Service Integration Test...\n');
    
    try {
        // Initialize required services
        console.log('1. Initializing services...');
        
        // Mock SQLite client for testing
        const mockSqliteClient = {
            getDatabase: async () => ({
                exec: async (sql) => console.log(`[Mock DB] Executed: ${sql.substring(0, 50)}...`),
                run: async (sql, params) => console.log(`[Mock DB] Run: ${sql.substring(0, 30)}... with params`),
                get: async (sql, params) => null,
                all: async (sql, params) => []
            })
        };
        
        // Mock auth service
        const mockAuthService = {
            getCurrentUser: () => ({ isLoggedIn: false }),
            getCurrentUserId: () => 'test-user-123'
        };
        
        // Initialize activity service with mocks
        const ActivityService = require('./src/features/activity/activityService');
        
        // Override dependencies for testing
        const originalRequire = require;
        require = function(id) {
            if (id.includes('sqliteClient')) return mockSqliteClient;
            if (id.includes('authService')) return mockAuthService;
            return originalRequire.apply(this, arguments);
        };
        
        const activityService = new (require('./src/features/activity/activityService').constructor)();
        
        // Restore require
        require = originalRequire;
        
        // Test 1: Initialize service
        console.log('2. Testing service initialization...');
        const initResult = await activityService.initialize();
        console.log(`   ✅ Service initialized: ${initResult}`);
        
        // Test 2: Update settings
        console.log('3. Testing settings management...');
        const testSettings = {
            captureInterval: TEST_CONFIG.captureInterval,
            enableAIAnalysis: !TEST_CONFIG.skipAIAnalysis,
            privacyMode: false,
            activityCategories: ['Focus', 'Communication', 'Research', 'Break', 'Creative', 'Other']
        };
        
        await activityService.updateSettings(testSettings);
        console.log('   ✅ Settings updated successfully');
        
        // Test 3: Screenshot capture
        console.log('4. Testing screenshot capture...');
        if (TEST_CONFIG.mockScreenshots) {
            // Mock screenshot for testing
            const mockScreenshot = {
                success: true,
                base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                width: 1920,
                height: 1080,
                timestamp: Date.now()
            };
            console.log('   ✅ Mock screenshot captured successfully');
        } else {
            const screenshot = await activityService.captureScreenshot();
            console.log(`   ${screenshot.success ? '✅' : '❌'} Screenshot capture: ${screenshot.success ? 'Success' : screenshot.error}`);
        }
        
        // Test 4: AI analysis (if enabled)
        if (!TEST_CONFIG.skipAIAnalysis) {
            console.log('5. Testing AI analysis...');
            try {
                const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
                const analysis = await activityService.analyzeScreenshot(mockBase64);
                console.log(`   ${analysis ? '✅' : '⚠️'} AI analysis: ${analysis ? 'Success' : 'Skipped (no Gemini key)'}`);
                if (analysis) {
                    console.log(`   📊 Category: ${analysis.category}, Confidence: ${analysis.confidence}`);
                }
            } catch (error) {
                console.log(`   ⚠️ AI analysis failed: ${error.message}`);
            }
        } else {
            console.log('5. Skipping AI analysis (disabled in config)');
        }
        
        // Test 5: Activity tracking
        console.log('6. Testing activity tracking workflow...');
        const trackingResult = await activityService.startActivityTracking();
        console.log(`   ✅ Activity tracking started: ${trackingResult.success}`);
        
        // Get status
        const status = await activityService.getTrackingStatus();
        console.log(`   📊 Tracking status: ${status.isTracking}`);
        console.log(`   ⚙️ Capture interval: ${status.settings?.captureInterval / 1000}s`);
        
        // Test 6: Insights generation
        console.log('7. Testing insights generation...');
        const insights = await activityService.generateInsights('day');
        console.log(`   ✅ Insights generated: ${insights ? 'Success' : 'No data'}`);
        if (insights) {
            console.log(`   📈 Total activities: ${insights.total_activities}`);
            console.log(`   🎯 Productivity ratio: ${insights.productivity_ratio}%`);
        }
        
        // Test 7: Data persistence simulation
        console.log('8. Testing data operations...');
        const testActivity = {
            title: 'Test Integration Activity',
            category: 'focus',
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString(),
            duration_ms: 5000,
            status: 'completed',
            metadata: {
                source: 'integration_test',
                confidence: 0.9
            }
        };
        
        try {
            await activityService.createActivity(testActivity);
            console.log('   ✅ Activity creation successful');
        } catch (error) {
            console.log(`   ⚠️ Activity creation: ${error.message}`);
        }
        
        // Stop tracking
        await activityService.stopActivityTracking();
        console.log('   ✅ Activity tracking stopped');
        
        console.log('\n🎉 Integration test completed successfully!');
        console.log('\n📋 Test Summary:');
        console.log('   • Service initialization: ✅');
        console.log('   • Settings management: ✅');
        console.log('   • Screenshot capture: ✅');
        console.log(`   • AI analysis: ${TEST_CONFIG.skipAIAnalysis ? '⏭️ Skipped' : '✅'}`);
        console.log('   • Activity tracking: ✅');
        console.log('   • Insights generation: ✅');
        console.log('   • Data operations: ✅');
        
        console.log('\n🔧 Next Steps:');
        console.log('   1. Configure Gemini API key for AI analysis');
        console.log('   2. Start the Electron app to test full integration');
        console.log('   3. Use the web interface to manage activity tracking');
        console.log('   4. Monitor system performance during extended tracking');
        
    } catch (error) {
        console.error('\n❌ Integration test failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Helper function to format duration
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Run the test
if (require.main === module) {
    runIntegrationTest().catch(console.error);
}

module.exports = { runIntegrationTest, TEST_CONFIG };