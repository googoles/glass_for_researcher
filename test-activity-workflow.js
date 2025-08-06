/**
 * Activity Workflow Test
 * Tests actual activity tracking workflow with the running Glass application
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class ActivityWorkflowTester {
    constructor() {
        this.baseUrl = 'http://localhost:54322'; // Glass backend API
        this.testResults = [];
        this.reportPath = path.join(__dirname, 'ACTIVITY_WORKFLOW_TEST_REPORT.md');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = { info: '📋', success: '✅', error: '❌', test: '🧪' }[type] || '📋';
        console.log(`${prefix} [${timestamp}] ${message}`);
        this.testResults.push({ timestamp, type, message });
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            const req = http.request(url, options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const result = {
                            status: res.statusCode,
                            data: body ? JSON.parse(body) : null,
                            headers: res.headers
                        };
                        resolve(result);
                    } catch (error) {
                        resolve({
                            status: res.statusCode,
                            data: body,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async testAPIConnection() {
        try {
            this.log('Testing API connection...', 'test');
            const response = await this.makeRequest('/');
            
            if (response.status === 200) {
                this.log('API connection successful', 'success');
                return true;
            } else {
                this.log(`API connection failed - Status: ${response.status}`, 'error');
                return false;
            }
        } catch (error) {
            this.log(`API connection error: ${error.message}`, 'error');
            return false;
        }
    }

    async testActivityEndpoints() {
        try {
            this.log('Testing activity-related API endpoints...', 'test');
            
            // Test activity dashboard endpoint
            try {
                const dashboardResponse = await this.makeRequest(`/api/activity/dashboard`);
                
                if (dashboardResponse.status === 200) {
                    this.log(`Activity dashboard endpoint working - Overview available`, 'success');
                } else {
                    this.log(`Activity dashboard endpoint failed - Status: ${dashboardResponse.status}`, 'error');
                }
            } catch (error) {
                this.log(`Activity dashboard test failed: ${error.message}`, 'error');
            }

            // Test activity stats endpoint
            try {
                const statsResponse = await this.makeRequest(`/api/activity/stats/day`);
                
                if (statsResponse.status === 200) {
                    this.log(`Activity stats endpoint working - Score: ${statsResponse.data?.score || 'N/A'}`, 'success');
                } else {
                    this.log(`Activity stats endpoint failed - Status: ${statsResponse.status}`, 'error');
                }
            } catch (error) {
                this.log(`Activity stats test failed: ${error.message}`, 'error');
            }

            // Test activity tracking status
            try {
                const statusResponse = await this.makeRequest('/api/activity/current');
                
                if (statusResponse.status === 200) {
                    const isTracking = statusResponse.data?.isTracking || false;
                    this.log(`Activity status endpoint working - Tracking: ${isTracking}`, 'success');
                } else {
                    this.log(`Activity status endpoint failed - Status: ${statusResponse.status}`, 'error');
                }
            } catch (error) {
                this.log(`Activity status test failed: ${error.message}`, 'error');
            }

            return true;
        } catch (error) {
            this.log(`Activity endpoints test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testDatabaseQueries() {
        try {
            this.log('Testing database query endpoints...', 'test');
            
            // Test recent activities
            try {
                const activitiesResponse = await this.makeRequest('/api/activity/sessions?limit=10');
                
                if (activitiesResponse.status === 200) {
                    const activities = activitiesResponse.data?.activities || [];
                    this.log(`Activities list endpoint working - ${activities.length} activities found`, 'success');
                    
                    if (activities.length > 0) {
                        const sampleActivity = activities[0];
                        this.log(`Sample activity: ${sampleActivity.title} (${sampleActivity.category})`, 'info');
                    }
                } else {
                    this.log(`Activities list endpoint failed - Status: ${activitiesResponse.status}`, 'error');
                }
            } catch (error) {
                this.log(`Activities list test failed: ${error.message}`, 'error');
            }

            // Test insights data
            try {
                const insightsResponse = await this.makeRequest('/api/activity/insights?timeframe=week');
                
                if (insightsResponse.status === 200) {
                    const insights = insightsResponse.data;
                    this.log(`Insights endpoint working`, 'success');
                    this.log(`  Total activities: ${insights?.total_activities || 0}`, 'info');
                    this.log(`  Productivity ratio: ${insights?.productivity_ratio || 0}%`, 'info');
                } else {
                    this.log(`Insights endpoint failed - Status: ${insightsResponse.status}`, 'error');
                }
            } catch (error) {
                this.log(`Insights test failed: ${error.message}`, 'error');
            }

            return true;
        } catch (error) {
            this.log(`Database queries test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testSessionEndpoints() {
        try {
            this.log('Testing session-related endpoints...', 'test');
            
            // Test sessions list
            try {
                const sessionsResponse = await this.makeRequest('/api/conversations');
                
                if (sessionsResponse.status === 200) {
                    const sessions = sessionsResponse.data || [];
                    this.log(`Sessions endpoint working - ${sessions.length} sessions found`, 'success');
                    
                    if (sessions.length > 0) {
                        const askSessions = sessions.filter(s => s.session_type === 'ask').length;
                        const listenSessions = sessions.filter(s => s.session_type === 'listen').length;
                        this.log(`  Ask sessions: ${askSessions}, Listen sessions: ${listenSessions}`, 'info');
                    }
                } else {
                    this.log(`Sessions endpoint failed - Status: ${sessionsResponse.status}`, 'error');
                }
            } catch (error) {
                this.log(`Sessions test failed: ${error.message}`, 'error');
            }

            return true;
        } catch (error) {
            this.log(`Session endpoints test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async generateWorkflowReport() {
        const successfulTests = this.testResults.filter(r => r.type === 'success').length;
        const errorTests = this.testResults.filter(r => r.type === 'error').length;
        const totalTests = successfulTests + errorTests;
        const successRate = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;

        const report = `# Glass Activity Workflow Test Report

**Generated**: ${new Date().toISOString()}  
**Test Type**: API Workflow Testing  
**Success Rate**: ${successRate}% (${successfulTests}/${totalTests} tests passed)

## Test Overview

This test verifies that activity tracking workflows are functioning properly by testing the Glass backend API endpoints.

## Test Results Summary

| Test Category | Status | Details |
|---------------|--------|---------|
| API Connection | ${this.testResults.some(r => r.message.includes('API connection successful')) ? '✅ PASSED' : '❌ FAILED'} | Backend API accessibility |
| Activity Endpoints | ${this.testResults.some(r => r.message.includes('Activity timeline endpoint working')) ? '✅ PASSED' : '❌ FAILED'} | Timeline, metrics, status endpoints |
| Database Queries | ${this.testResults.some(r => r.message.includes('Activities list endpoint working')) ? '✅ PASSED' : '❌ FAILED'} | Data retrieval operations |
| Session Endpoints | ${this.testResults.some(r => r.message.includes('Sessions endpoint working')) ? '✅ PASSED' : '❌ FAILED'} | Ask/Listen session data |

## Detailed Test Log

${this.testResults.map(result => {
    const icon = { info: '📋', success: '✅', error: '❌', test: '🧪' }[result.type] || '📋';
    return `**${result.timestamp}** ${icon} ${result.message}`;
}).join('\n')}

## Key Findings

### Database Connectivity
${this.testResults.some(r => r.message.includes('activities found')) ? 
'- ✅ Database is accessible and contains activity data' :
'- ❌ Database may not be accessible or contains no data'}

### Activity Tracking System
${this.testResults.some(r => r.message.includes('Activity timeline endpoint working')) ?
'- ✅ Activity tracking API endpoints are functional' :
'- ❌ Activity tracking endpoints may have issues'}

### Session Management
${this.testResults.some(r => r.message.includes('Sessions endpoint working')) ?
'- ✅ Session management (Ask/Listen) is working' :
'- ❌ Session management may have issues'}

## Recommendations

### Immediate Actions
${successRate < 80 ? 
'1. 🚨 **Critical**: Review failed API endpoints and fix connectivity issues\n2. 📊 Check database connection and ensure data is being stored\n3. 🔧 Verify backend service configuration' :
'1. ✅ **Good**: System is functioning well\n2. 📈 Consider adding more comprehensive monitoring\n3. 🔄 Implement automated health checks'}

### Monitoring Setup
1. **API Health**: Monitor all endpoint response times and error rates
2. **Database Performance**: Track query performance and data growth
3. **User Activity**: Monitor active tracking sessions and data volume

### Data Verification Tasks
1. **Manual Verification**: Use Glass UI to trigger activities and verify data storage
2. **Database Inspection**: Directly query SQLite database to confirm data integrity
3. **End-to-End Testing**: Complete workflow testing from UI through to database

## Next Steps

1. 🧪 **Run Manual UI Tests**: Test activity tracking through the Glass interface
2. 🗄️ **Database Direct Access**: Verify data is actually being stored in SQLite
3. 📊 **Performance Testing**: Test with multiple concurrent activities
4. 🔧 **Error Handling**: Test error scenarios and recovery mechanisms

---
*Generated by Glass Activity Workflow Tester*
*This test focuses on API connectivity and data flow verification*`;

        fs.writeFileSync(this.reportPath, report);
        this.log(`Workflow test report saved to: ${this.reportPath}`, 'info');
        
        return {
            successRate,
            totalTests,
            successfulTests,
            errorTests,
            reportPath: this.reportPath
        };
    }

    async runWorkflowTests() {
        this.log('Starting Glass Activity Workflow Tests...', 'test');
        
        try {
            // Test 1: API Connection
            const apiConnected = await this.testAPIConnection();
            if (!apiConnected) {
                this.log('Cannot proceed without API connection', 'error');
                await this.generateWorkflowReport();
                return;
            }

            // Test 2: Activity Endpoints
            await this.testActivityEndpoints();
            
            // Test 3: Database Queries
            await this.testDatabaseQueries();
            
            // Test 4: Session Endpoints
            await this.testSessionEndpoints();
            
            // Generate Report
            const report = await this.generateWorkflowReport();
            
            this.log(`Workflow tests completed - ${report.successRate}% success rate`, 'info');
            
        } catch (error) {
            this.log(`Workflow test suite failed: ${error.message}`, 'error');
        }
    }
}

// Run the workflow tests
async function runWorkflowTests() {
    console.log('🔄 Glass Activity Workflow Test');
    console.log('================================\n');
    console.log('Testing activity tracking workflow via API endpoints...');
    console.log('Make sure the Glass application is running on localhost:54322\n');

    const tester = new ActivityWorkflowTester();
    await tester.runWorkflowTests();
    
    console.log('\n✅ Workflow testing completed!');
    console.log('Check the generated report for detailed results.');
}

if (require.main === module) {
    runWorkflowTests().catch(console.error);
}

module.exports = { ActivityWorkflowTester };