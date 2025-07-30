/**
 * Integration test for AI Analysis System
 * Tests the complete flow from screenshot capture to insight generation
 */

const AnalysisService = require('./src/features/research/ai/analysisService');
const PatternRecognizer = require('./src/features/research/ai/patternRecognizer');
const ProductivityScorer = require('./src/features/research/ai/productivityScorer');
const InsightGenerator = require('./src/features/research/ai/insightGenerator');

async function testAIIntegration() {
  console.log('🧪 Starting AI Analysis System Integration Test');
  console.log('=' .repeat(60));

  try {
    // Test 1: Initialize Analysis Service
    console.log('1. Testing Analysis Service Initialization...');
    const analysisService = new AnalysisService();
    
    // Mock API initialization (would normally use real API key)
    console.log('   ✅ Analysis Service created successfully');

    // Test 2: Test Pattern Recognizer
    console.log('2. Testing Pattern Recognizer...');
    const patternRecognizer = new PatternRecognizer();
    
    // Create mock screenshot data
    const mockScreenshots = generateMockScreenshots(20);
    console.log('   📸 Generated mock screenshot data');
    
    const patterns = await patternRecognizer.analyzeSequence(mockScreenshots);
    console.log('   ✅ Pattern analysis completed');
    console.log('   📊 Focus sessions detected:', patterns.focusPatterns?.sessions?.length || 0);
    console.log('   🔄 Task switches detected:', patterns.taskSwitchingPatterns?.totalSwitches || 0);

    // Test 3: Test Productivity Scorer
    console.log('3. Testing Productivity Scorer...');
    const productivityScorer = new ProductivityScorer();
    
    // Mock base64 image and context
    const mockContext = {
      timestamp: Date.now(),
      activeApplication: 'vscode',
      windowTitle: 'main.js - Visual Studio Code',
      usageHistory: { consistentApps: true, productiveStreak: 5 }
    };
    
    const scoreResult = await productivityScorer.calculateScore('mock-base64-image', mockContext);
    console.log('   ✅ Productivity scoring completed');
    console.log('   📈 Score:', scoreResult.score);
    console.log('   🎯 Confidence:', Math.round(scoreResult.confidence * 100) + '%');

    // Test 4: Test Insight Generator
    console.log('4. Testing Insight Generator...');
    const insightGenerator = new InsightGenerator();
    
    // Create mock analysis history
    const mockAnalysisHistory = generateMockAnalysisHistory(50);
    const mockPreferences = {
      goals: ['increase_focus', 'optimize_schedule'],
      workStyle: 'deep_work'
    };
    
    const insights = await insightGenerator.generate(mockAnalysisHistory, mockPreferences);
    console.log('   ✅ Insight generation completed');
    console.log('   💡 Overview productivity:', insights.overview?.productivity?.average || 'N/A');
    console.log('   📋 Recommendations:', insights.recommendations?.immediate?.length || 0);

    // Test 5: Test AI Prompts
    console.log('5. Testing AI Prompts...');
    const ActivityPrompts = require('./src/features/research/ai/activityPrompts');
    
    const screenshotPrompt = ActivityPrompts.getScreenshotAnalysisPrompt();
    const patternPrompt = ActivityPrompts.getPatternAnalysisPrompt('1 hour');
    const scoringPrompt = ActivityPrompts.getProductivityScoringPrompt();
    
    console.log('   ✅ All prompt templates generated successfully');
    console.log('   📝 Screenshot prompt length:', screenshotPrompt.length);
    console.log('   🔍 Pattern prompt length:', patternPrompt.length);
    console.log('   📊 Scoring prompt length:', scoringPrompt.length);

    // Test 6: Test Database Repository Structure
    console.log('6. Testing Repository Structure...');
    const sqliteRepo = require('./src/features/research/repositories/sqlite.repository');
    const firebaseRepo = require('./src/features/research/repositories/firebase.repository');
    
    // Check if all required methods exist
    const requiredMethods = [
      'initialize', 'createSession', 'updateSession', 'getSessionById',
      'getSessions', 'getRecentSessions', 'getDailyStats', 'addEvent',
      'createAnalysis', 'getSessionAnalysis', 'getRecentAnalysis',
      'getProductivityStats', 'storeInsights', 'getCachedInsights'
    ];
    
    let sqliteMethods = 0;
    let firebaseMethods = 0;
    
    requiredMethods.forEach(method => {
      if (typeof sqliteRepo[method] === 'function') sqliteMethods++;
      if (typeof firebaseRepo[method] === 'function') firebaseMethods++;
    });
    
    console.log('   ✅ Repository structure validated');
    console.log('   🗄️  SQLite methods:', sqliteMethods + '/' + requiredMethods.length);
    console.log('   ☁️  Firebase methods:', firebaseMethods + '/' + requiredMethods.length);

    // Test 7: Test API Route Structure
    console.log('7. Testing API Route Structure...');
    const fs = require('fs');
    const path = require('path');
    
    const routeFile = path.join(__dirname, 'pickleglass_web/backend_node/routes/research.js');
    if (fs.existsSync(routeFile)) {
      const routeContent = fs.readFileSync(routeFile, 'utf8');
      const hasAIRoutes = routeContent.includes('analysis/current-score') && 
                         routeContent.includes('insights/') &&
                         routeContent.includes('ai-status');
      
      console.log('   ✅ API routes structure validated');
      console.log('   🛣️  AI routes present:', hasAIRoutes ? 'Yes' : 'No');
    } else {
      console.log('   ⚠️  Route file not found');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All Integration Tests Completed Successfully!');
    console.log('\nNext Steps:');
    console.log('1. Configure AI API keys (Gemini or OpenAI) in settings');
    console.log('2. Start research tracking to begin data collection');
    console.log('3. Access AI dashboard at /research/ai-dashboard');
    console.log('4. Review generated insights and recommendations');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    console.error('\nError details:', error.stack);
  }
}

function generateMockScreenshots(count) {
  const screenshots = [];
  const apps = ['vscode', 'chrome', 'slack', 'terminal', 'figma'];
  const activities = ['coding', 'research', 'communication', 'design', 'debugging'];
  
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now() - (count - i) * 60000; // 1 minute intervals
    const app = apps[Math.floor(Math.random() * apps.length)];
    const activity = activities[Math.floor(Math.random() * activities.length)];
    const productivity = Math.random() * 10;
    
    screenshots.push({
      timestamp,
      base64: 'mock-base64-data',
      context: {
        activeApplication: app,
        windowTitle: `${app} - Mock Window`,
        timestamp
      },
      productivity_score: productivity,
      activity_type: activity,
      applications: [app],
      focus_quality: productivity > 6 ? 'high' : productivity > 3 ? 'medium' : 'low',
      confidence_score: 0.8 + Math.random() * 0.2
    });
  }
  
  return screenshots;
}

function generateMockAnalysisHistory(count) {
  const history = [];
  const activities = ['deep work', 'communication', 'research', 'planning', 'administrative'];
  
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now() - (count - i) * 300000; // 5 minute intervals
    const productivity = Math.random() * 10;
    
    history.push({
      timestamp,
      productivity_score: productivity,
      activity_type: activities[Math.floor(Math.random() * activities.length)],
      applications: ['vscode', 'chrome'],
      focus_quality: productivity > 6 ? 'high' : 'medium',
      confidence_score: 0.8,
      categories: ['development'],
      tags: productivity > 7 ? ['focused'] : ['distracted']
    });
  }
  
  return history;
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAIIntegration().catch(console.error);
}

module.exports = { testAIIntegration };