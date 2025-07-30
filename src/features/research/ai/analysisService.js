/**
 * Advanced AI Analysis Service for Activity Tracking
 * Provides sophisticated analysis of screenshots and activity patterns
 */

const { createLLM } = require('../../common/ai/factory');
const ActivityPrompts = require('./activityPrompts');
const PrivacyAwarePrompts = require('./privacyAwarePrompts');
const PatternRecognizer = require('./patternRecognizer');
const ProductivityScorer = require('./productivityScorer');
const InsightGenerator = require('./insightGenerator');

class AnalysisService {
  constructor() {
    this.llmClient = null;
    this.analysisCache = new Map(); // Cache recent analyses
    this.patternRecognizer = new PatternRecognizer();
    this.productivityScorer = new ProductivityScorer();
    this.insightGenerator = new InsightGenerator();
    this.privacyMode = true; // Enable privacy-aware analysis by default
  }

  /**
   * Set privacy mode for analysis
   * @param {boolean} enabled - Enable privacy-aware analysis
   */
  setPrivacyMode(enabled) {
    this.privacyMode = enabled;
    console.log('[AnalysisService] Privacy mode:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Get current privacy mode status
   * @returns {boolean} Privacy mode status
   */
  getPrivacyMode() {
    return this.privacyMode;
  }

  /**
   * Initialize the analysis service with AI provider
   */
  async initialize(apiKey, provider = 'gemini', model = 'gemini-2.5-flash') {
    try {
      this.llmClient = createLLM({ 
        apiKey, 
        provider, 
        model,
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 4096
      });
      
      console.log('[AnalysisService] Initialized with', provider, model);
      return true;
    } catch (error) {
      console.error('[AnalysisService] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Comprehensive screenshot analysis
   * @param {string} base64Image - Base64 encoded screenshot
   * @param {Object} context - Additional context about the screenshot
   * @returns {Object} Detailed analysis results
   */
  async analyzeScreenshot(base64Image, context = {}) {
    if (!this.llmClient) {
      throw new Error('Analysis service not initialized');
    }

    const cacheKey = this.generateCacheKey(base64Image, context);
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      // Choose prompt based on privacy mode
      const analysisPrompt = this.privacyMode 
        ? PrivacyAwarePrompts.getPrivacyAwareAnalysisPrompt()
        : ActivityPrompts.getScreenshotAnalysisPrompt();

      // Prepare the multimodal content for Gemini
      const analysisContent = [
        analysisPrompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image
          }
        }
      ];

      // Add contextual information if available
      if (context.timestamp) {
        analysisContent.push(`\nTimestamp: ${new Date(context.timestamp).toLocaleString()}`);
      }
      if (context.activeApplication) {
        analysisContent.push(`\nActive Application: ${context.activeApplication}`);
      }
      if (context.windowTitle) {
        analysisContent.push(`\nWindow Title: ${context.windowTitle}`);
      }

      const result = await this.llmClient.generateContent(analysisContent);
      const analysisText = result.response.text();

      // Parse the analysis into structured data
      const structuredAnalysis = this.parseAnalysisResponse(analysisText);
      
      // Enhance with additional processing
      const enhancedAnalysis = await this.enhanceAnalysis(structuredAnalysis, context);

      // Cache the result (with TTL of 1 hour)
      this.analysisCache.set(cacheKey, enhancedAnalysis);
      setTimeout(() => this.analysisCache.delete(cacheKey), 3600000);

      return enhancedAnalysis;
    } catch (error) {
      console.error('[AnalysisService] Screenshot analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze patterns across multiple screenshots
   * @param {Array} screenshots - Array of screenshot data with timestamps
   * @param {string} timeframe - Time period for analysis
   * @returns {Object} Pattern analysis results
   */
  async analyzePatterns(screenshots, timeframe = '1 hour') {
    if (!this.llmClient || screenshots.length === 0) {
      throw new Error('Invalid input for pattern analysis');
    }

    try {
      // Use pattern recognizer for computational analysis
      const computationalPatterns = await this.patternRecognizer.analyzeSequence(screenshots);
      
      // Prepare representative screenshots for AI analysis
      const keyScreenshots = this.selectKeyScreenshots(screenshots, 5);
      
      const patternPrompt = this.privacyMode
        ? PrivacyAwarePrompts.getPrivacyAwarePatternPrompt(timeframe)
        : ActivityPrompts.getPatternAnalysisPrompt(timeframe);
      
      const patternContent = [
        patternPrompt,
        `\nAnalyzing ${screenshots.length} screenshots over ${timeframe}`,
        `\nComputational Pattern Summary: ${JSON.stringify(computationalPatterns, null, 2)}`
      ];

      // Add key screenshots for visual pattern analysis
      keyScreenshots.forEach((screenshot, index) => {
        patternContent.push(`\nScreenshot ${index + 1} (${new Date(screenshot.timestamp).toLocaleTimeString()}):`);
        patternContent.push({
          inlineData: {
            mimeType: 'image/png',
            data: screenshot.base64
          }
        });
      });

      const result = await this.llmClient.generateContent(patternContent);
      const patternAnalysis = result.response.text();

      return {
        aiAnalysis: patternAnalysis,
        computationalPatterns,
        keyInsights: this.extractKeyInsights(patternAnalysis),
        recommendations: this.extractRecommendations(patternAnalysis),
        timeframe,
        screenshotCount: screenshots.length
      };
    } catch (error) {
      console.error('[AnalysisService] Pattern analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate productivity score for a screenshot
   * @param {string} base64Image - Screenshot data
   * @param {Object} context - Context information
   * @returns {Object} Productivity score and breakdown
   */
  async generateProductivityScore(base64Image, context = {}) {
    if (!this.llmClient) {
      throw new Error('Analysis service not initialized');
    }

    try {
      const scoringPrompt = this.privacyMode
        ? PrivacyAwarePrompts.getPrivacyAwareProductivityPrompt()
        : ActivityPrompts.getProductivityScoringPrompt();

      const scoringContent = [
        scoringPrompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image
          }
        }
      ];

      const result = await this.llmClient.generateContent(scoringContent);
      const scoringText = result.response.text();

      // Extract numerical score and breakdown
      const scoreData = this.parseProductivityScore(scoringText);
      
      // Enhance with computational scoring
      const computationalScore = await this.productivityScorer.calculateScore(base64Image, context);
      
      return {
        aiScore: scoreData,
        computationalScore,
        combinedScore: this.combineScores(scoreData, computationalScore),
        analysis: scoringText,
        timestamp: context.timestamp || Date.now()
      };
    } catch (error) {
      console.error('[AnalysisService] Productivity scoring failed:', error);
      throw error;
    }
  }

  /**
   * Generate personalized insights and recommendations
   * @param {Array} analysisHistory - Historical analysis data
   * @param {Object} userPreferences - User preferences and goals
   * @returns {Object} Personalized insights
   */
  async generateInsights(analysisHistory, userPreferences = {}) {
    try {
      // Use insight generator for computational insights
      const computationalInsights = await this.insightGenerator.generate(analysisHistory, userPreferences);
      
      // Generate AI-powered insights if we have sufficient data
      if (analysisHistory.length >= 10) {
        const insightContent = [
          `You are a productivity consultant analyzing ${analysisHistory.length} work sessions to provide personalized insights.`,
          `\nUser Preferences: ${JSON.stringify(userPreferences, null, 2)}`,
          `\nAnalysis Summary: ${JSON.stringify(this.summarizeAnalysisHistory(analysisHistory), null, 2)}`,
          `\nComputational Insights: ${JSON.stringify(computationalInsights, null, 2)}`,
          `\nProvide specific, actionable recommendations based on this user's patterns and preferences.`
        ];

        const result = await this.llmClient.generateContent(insightContent);
        const aiInsights = result.response.text();

        return {
          personalizedRecommendations: this.extractRecommendations(aiInsights),
          patternInsights: computationalInsights.patterns,
          productivityTrends: computationalInsights.trends,
          optimizationOpportunities: computationalInsights.opportunities,
          fullAnalysis: aiInsights
        };
      }

      return computationalInsights;
    } catch (error) {
      console.error('[AnalysisService] Insight generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze specific application usage patterns
   * @param {string} appName - Application name
   * @param {Array} screenshots - Screenshots of the application
   * @returns {Object} Application-specific analysis
   */
  async analyzeApplicationUsage(appName, screenshots) {
    if (!this.llmClient || screenshots.length === 0) {
      throw new Error('Invalid input for application analysis');
    }

    try {
      const appContent = [
        ActivityPrompts.getApplicationAnalysisPrompt(appName),
        `\nAnalyzing ${screenshots.length} screenshots of ${appName}:`
      ];

      // Add up to 3 representative screenshots
      const selectedScreenshots = this.selectKeyScreenshots(screenshots, 3);
      selectedScreenshots.forEach((screenshot, index) => {
        appContent.push(`\nScreenshot ${index + 1}:`);
        appContent.push({
          inlineData: {
            mimeType: 'image/png',
            data: screenshot.base64
          }
        });
      });

      const result = await this.llmClient.generateContent(appContent);
      const appAnalysis = result.response.text();

      return {
        application: appName,
        usage_patterns: this.extractUsagePatterns(appAnalysis),
        efficiency_score: this.extractEfficiencyScore(appAnalysis),
        recommendations: this.extractRecommendations(appAnalysis),
        full_analysis: appAnalysis
      };
    } catch (error) {
      console.error('[AnalysisService] Application analysis failed:', error);
      throw error;
    }
  }

  // Helper methods for data processing

  generateCacheKey(base64Image, context) {
    const contextStr = JSON.stringify(context);
    const imageHash = base64Image.substring(0, 100); // Use first 100 chars as hash
    return `${imageHash}_${Buffer.from(contextStr).toString('base64').substring(0, 50)}`;
  }

  parseAnalysisResponse(analysisText) {
    // Extract structured information from AI response
    return {
      raw_analysis: analysisText,
      activity_type: this.extractSection(analysisText, 'WORK TYPE CLASSIFICATION'),
      productivity_score: this.extractProductivityScore(analysisText),
      focus_quality: this.extractSection(analysisText, 'FOCUS & ATTENTION ANALYSIS'),
      applications: this.extractApplications(analysisText),
      visual_cues: this.extractSection(analysisText, 'VISUAL CUE ANALYSIS'),
      recommendations: this.extractRecommendations(analysisText)
    };
  }

  async enhanceAnalysis(structuredAnalysis, context) {
    // Add computational enhancements
    const enhancements = {
      timestamp: context.timestamp || Date.now(),
      confidence_score: this.calculateConfidenceScore(structuredAnalysis),
      categories: this.categorizeActivity(structuredAnalysis),
      tags: this.generateTags(structuredAnalysis)
    };

    return { ...structuredAnalysis, ...enhancements };
  }

  selectKeyScreenshots(screenshots, maxCount) {
    if (screenshots.length <= maxCount) return screenshots;
    
    // Select evenly distributed screenshots across the time range
    const interval = Math.floor(screenshots.length / maxCount);
    return screenshots.filter((_, index) => index % interval === 0).slice(0, maxCount);
  }

  extractSection(text, sectionTitle) {
    const regex = new RegExp(`## \\d+\\. ${sectionTitle}[\\s\\S]*?(?=##|$)`, 'i');
    const match = text.match(regex);
    return match ? match[0].trim() : '';
  }

  extractProductivityScore(text) {
    const scoreMatch = text.match(/(\d+(?:\.\d+)?)(?:\s*\/\s*10|\s*out\s*of\s*10)/i);
    return scoreMatch ? parseFloat(scoreMatch[1]) : null;
  }

  extractApplications(text) {
    // Extract mentioned applications
    const appPatterns = [
      /vscode|visual studio code/i,
      /chrome|firefox|safari|browser/i,
      /slack|teams|discord/i,
      /zoom|meet|webex/i,
      /figma|sketch|photoshop/i,
      /notion|obsidian|roam/i
    ];
    
    const foundApps = [];
    appPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        foundApps.push(pattern.source.split('|')[0]);
      }
    });
    
    return foundApps;
  }

  extractRecommendations(text) {
    // Extract recommendation-like sentences
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(s => /recommend|suggest|should|could|consider|try|improve/i.test(s))
      .map(s => s.trim())
      .filter(s => s.length > 20);
  }

  extractKeyInsights(text) {
    const insights = [];
    const sections = text.split('##');
    
    sections.forEach(section => {
      if (section.includes('INSIGHT') || section.includes('PATTERN')) {
        const lines = section.split('\n').filter(line => line.trim().startsWith('-'));
        insights.push(...lines.map(line => line.replace('-', '').trim()));
      }
    });
    
    return insights;
  }

  parseProductivityScore(scoringText) {
    const scoreMatch = scoringText.match(/(?:final score|total score|productivity score)[:\s]*(\d+)/i);
    const baseScore = scoringText.match(/base.*score[:\s]*(\d+)/i);
    const multiplier = scoringText.match(/multiplier[:\s]*(\d+(?:\.\d+)?)/i);
    
    return {
      final_score: scoreMatch ? parseInt(scoreMatch[1]) : null,
      base_score: baseScore ? parseInt(baseScore[1]) : null,
      focus_multiplier: multiplier ? parseFloat(multiplier[1]) : null,
      breakdown: this.extractScoreBreakdown(scoringText)
    };
  }

  extractScoreBreakdown(text) {
    const breakdown = {};
    const components = ['base', 'focus', 'complexity', 'efficiency', 'deduction'];
    
    components.forEach(component => {
      const regex = new RegExp(`${component}[\\s\\w]*[:\\s]*([+-]?\\d+)`, 'i');
      const match = text.match(regex);
      if (match) {
        breakdown[component] = parseInt(match[1]);
      }
    });
    
    return breakdown;
  }

  combineScores(aiScore, computationalScore) {
    if (!aiScore?.final_score || !computationalScore?.score) {
      return aiScore?.final_score || computationalScore?.score || 0;
    }
    
    // Weighted average: 60% AI, 40% computational
    return Math.round(aiScore.final_score * 0.6 + computationalScore.score * 0.4);
  }

  calculateConfidenceScore(structuredAnalysis) {
    let confidence = 50; // Base confidence
    
    if (structuredAnalysis.productivity_score) confidence += 20;
    if (structuredAnalysis.applications?.length > 0) confidence += 15;
    if (structuredAnalysis.activity_type) confidence += 15;
    
    return Math.min(confidence, 100);
  }

  categorizeActivity(structuredAnalysis) {
    const categories = [];
    const text = structuredAnalysis.raw_analysis.toLowerCase();
    
    if (text.includes('coding') || text.includes('programming')) categories.push('development');
    if (text.includes('writing') || text.includes('document')) categories.push('writing');
    if (text.includes('meeting') || text.includes('video call')) categories.push('communication');
    if (text.includes('research') || text.includes('reading')) categories.push('research');
    if (text.includes('design') || text.includes('creative')) categories.push('design');
    
    return categories;
  }

  generateTags(structuredAnalysis) {
    const tags = [];
    const text = structuredAnalysis.raw_analysis.toLowerCase();
    
    // Focus-related tags
    if (text.includes('deep work')) tags.push('deep-work');
    if (text.includes('distracted') || text.includes('multitasking')) tags.push('distracted');
    if (text.includes('focused')) tags.push('focused');
    
    // Productivity-related tags
    if (structuredAnalysis.productivity_score > 7) tags.push('high-productivity');
    else if (structuredAnalysis.productivity_score < 4) tags.push('low-productivity');
    
    return tags;
  }

  summarizeAnalysisHistory(history) {
    return {
      total_sessions: history.length,
      average_productivity: history.reduce((sum, h) => sum + (h.productivity_score || 0), 0) / history.length,
      common_activities: this.getCommonActivities(history),
      peak_hours: this.identifyPeakHours(history),
      trend_direction: this.calculateTrend(history)
    };
  }

  getCommonActivities(history) {
    const activities = {};
    history.forEach(h => {
      if (h.activity_type) {
        activities[h.activity_type] = (activities[h.activity_type] || 0) + 1;
      }
    });
    return Object.entries(activities)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([activity]) => activity);
  }

  identifyPeakHours(history) {
    const hourCounts = {};
    history.forEach(h => {
      if (h.timestamp) {
        const hour = new Date(h.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + (h.productivity_score || 0);
      }
    });
    
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  calculateTrend(history) {
    if (history.length < 5) return 'insufficient_data';
    
    const recent = history.slice(-5).reduce((sum, h) => sum + (h.productivity_score || 0), 0) / 5;
    const earlier = history.slice(0, 5).reduce((sum, h) => sum + (h.productivity_score || 0), 0) / 5;
    
    const diff = recent - earlier;
    if (diff > 1) return 'improving';
    if (diff < -1) return 'declining';
    return 'stable';
  }

  extractUsagePatterns(text) {
    return this.extractSection(text, 'usage patterns') || text.substring(0, 200) + '...';
  }

  extractEfficiencyScore(text) {
    const match = text.match(/efficiency[:\s]*(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : null;
  }
}

module.exports = AnalysisService;