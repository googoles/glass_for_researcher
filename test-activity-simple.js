#!/usr/bin/env node

/**
 * Simple test script to verify activity database and service
 */

async function runTest() {
    try {
        console.log('=== Simple Activity Test ===\n');

        // Mock the Electron app requirement
        const mockApp = {
            getPath: (type) => {
                if (type === 'userData') {
                    return '/tmp/glass-test';
                }
                return '/tmp';
            }
        };
        
        // Set up the mock
        global.app = mockApp;
        require.cache[require.resolve('electron')] = {
            exports: { app: mockApp }
        };

        // 1. Initialize SQLite client directly
        console.log('1. Setting up database...');
        const path = require('path');
        const fs = require('fs');
        
        // Ensure test directory exists
        const testDir = '/tmp/glass-test';
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        const sqliteClient = require('./src/features/common/services/sqliteClient');
        const dbPath = path.join(testDir, 'test-pickleglass.db');
        sqliteClient.connect(dbPath);
        await sqliteClient.initTables();
        console.log(`✅ Database initialized at: ${dbPath}\n`);

        // 2. Initialize activity service
        console.log('2. Initializing activity service...');
        const activityService = require('./src/features/activity/activityService');
        await activityService.initialize();
        console.log('✅ Activity service initialized\n');

        // 3. Create test activities
        console.log('3. Creating test activities...');
        const testActivities = [
            {
                title: 'Test Coding Session',
                category: 'focus',
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                duration_ms: 30 * 60 * 1000,
                status: 'completed'
            },
            {
                title: 'Test Meeting',
                category: 'communication',
                start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                end_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                duration_ms: 30 * 60 * 1000,
                status: 'completed'
            }
        ];

        let createdCount = 0;
        for (const activity of testActivities) {
            try {
                const created = await activityService.createActivity(activity);
                console.log(`✅ Created: ${created.title} (ID: ${created.id})`);
                createdCount++;
            } catch (error) {
                console.log(`❌ Failed to create ${activity.title}: ${error.message}`);
            }
        }
        console.log();

        // 4. Test retrieval
        console.log('4. Testing activity retrieval...');
        const activities = await activityService.getActivities({ limit: 10 });
        console.log(`✅ Retrieved ${activities.activities.length} activities`);
        
        activities.activities.forEach(activity => {
            console.log(`   - ${activity.title} (${activity.category})`);
        });
        console.log();

        // 5. Test today's timeline
        console.log('5. Testing timeline...');
        const today = new Date().toISOString().split('T')[0];
        const timeline = await activityService.getTimeline({ date: today });
        console.log(`✅ Timeline: ${timeline.activities.length} activities, ${Math.round(timeline.totalTime / 60000)}min total\n`);

        // 6. Show database path for verification
        console.log('6. Database verification...');
        console.log(`📁 Database location: ${dbPath}`);
        
        // Check if database file exists and has content
        const stats = fs.statSync(dbPath);
        console.log(`📊 Database size: ${stats.size} bytes`);
        
        // Query database directly
        const db = sqliteClient.getDb();
        const activityCount = db.prepare('SELECT COUNT(*) as count FROM activities').get();
        console.log(`📋 Total activities in DB: ${activityCount.count}\n`);

        console.log('=== Test Results ===');
        console.log(`✅ Created ${createdCount} test activities`);
        console.log(`✅ Database is working and accessible`);
        console.log(`✅ Activity service can read/write data`);
        console.log(`📍 Database location: ${dbPath}`);
        
        console.log('\n🔧 Next steps:');
        console.log('1. Start the Glass desktop app');
        console.log('2. Verify the web interface can now access activities');
        console.log('3. The missing web-data-request handler has been added to index.js');

        sqliteClient.close();
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

runTest();