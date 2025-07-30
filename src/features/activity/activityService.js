const activityRepository = require('./repositories');
const { BrowserWindow, desktopCapturer } = require('electron');
const { createLLM } = require('../common/ai/factory');
const modelStateService = require('../common/services/modelStateService');
const path = require('node:path');
const fs = require('node:fs');
const os = require('os');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

// Try to load sharp for image processing
let sharp;
try {
    sharp = require('sharp');
    console.log('[Activity Service] Sharp module loaded successfully');
} catch (error) {
    console.warn('[Activity Service] Sharp module not available, using fallback image processing');
    sharp = null;
}

class ActivityService {
  constructor() {
    this.isTracking = false;
    this.captureInterval = null;
    this.currentActivity = null;
    this.lastScreenshot = null;
    this.lastAnalysis = null;
    this.goals = {
      daily: 8,
      weekly: 40,
      monthly: 160
    };
    this.settings = {
      captureInterval: 15 * 60 * 1000, // 15 minutes default
      enableAIAnalysis: true,
      activityCategories: ['Focus', 'Communication', 'Research', 'Break', 'Creative', 'Other'],
      privacyMode: false // When true, only stores aggregated data
    };
    this.captureHistory = [];
    this.maxHistorySize = 100; // Keep last 100 captures
  }

  async initialize() {
    console.log('[Activity Service] Initializing comprehensive activity tracking...');
    try {
      await activityRepository.initialize();
      
      // Load existing goals and settings
      const storedGoals = await activityRepository.getGoals();
      if (storedGoals) {
        this.goals = { ...this.goals, ...storedGoals };
      }

      const storedSettings = await activityRepository.getSettings();
      if (storedSettings) {
        this.settings = { ...this.settings, ...storedSettings };
      }
      
      console.log('[Activity Service] Activity repository initialized with AI analysis capabilities');
      return true;
    } catch (error) {
      console.error('[Activity Service] Failed to initialize:', error);
      return false;
    }
  }

  async getTimeline({ date, projectId }) {
    try {
      const activities = await activityRepository.getActivitiesByDate(date, projectId);
      
      // Calculate timeline data
      const totalTime = activities.reduce((sum, activity) => sum + activity.duration_ms, 0);
      const categories = {};
      
      activities.forEach(activity => {
        if (!categories[activity.category]) {
          categories[activity.category] = 0;
        }
        categories[activity.category] += activity.duration_ms;
      });

      return {
        activities,
        totalTime,
        activeTime: totalTime * 0.85, // Assuming 85% active time
        categories
      };
    } catch (error) {
      console.error('[Activity Service] Failed to get timeline:', error);
      return {
        activities: [],
        totalTime: 0,
        activeTime: 0,
        categories: {}
      };
    }
  }

  async getProductivityMetrics({ date, period }) {
    try {
      const activities = await activityRepository.getActivitiesByDate(date);
      
      if (activities.length === 0) {
        return this.getDefaultMetrics();
      }

      // Calculate productivity score based on various factors
      const totalTime = activities.reduce((sum, activity) => sum + activity.duration_ms, 0);
      const focusTime = activities
        .filter(activity => ['coding', 'research', 'design'].includes(activity.category))
        .reduce((sum, activity) => sum + activity.duration_ms, 0);
      
      const completedTasks = activities.filter(activity => activity.status === 'completed').length;
      const averageSessionLength = totalTime / activities.length;
      
      // Simple productivity scoring algorithm
      const focusRatio = focusTime / totalTime;
      const sessionEfficiency = Math.min(averageSessionLength / (45 * 60 * 1000), 1); // 45 minutes is optimal
      const completionRate = completedTasks / activities.length;
      
      const score = (focusRatio * 0.4 + sessionEfficiency * 0.3 + completionRate * 0.3) * 10;
      
      // Detect peak hours
      const hourlyActivity = {};
      activities.forEach(activity => {
        const hour = new Date(activity.start_time).getHours();
        if (!hourlyActivity[hour]) hourlyActivity[hour] = 0;
        hourlyActivity[hour] += activity.duration_ms;
      });
      
      const peakHours = Object.entries(hourlyActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([hour]) => `${hour}:00-${parseInt(hour) + 1}:00`);

      return {
        score: Math.round(score * 10) / 10,
        trend: this.calculateTrend(date),
        change: 0.3, // This would be calculated by comparing with previous days
        peakHours,
        focusTime,
        distractionTime: totalTime - focusTime,
        completedTasks,
        averageSessionLength
      };
    } catch (error) {
      console.error('[Activity Service] Failed to get productivity metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  getDefaultMetrics() {
    return {
      score: 7.5,
      trend: 'stable',
      change: 0,
      peakHours: ['9:00-11:00', '14:00-16:00'],
      focusTime: 5 * 60 * 60 * 1000, // 5 hours
      distractionTime: 1 * 60 * 60 * 1000, // 1 hour
      completedTasks: 8,
      averageSessionLength: 30 * 60 * 1000 // 30 minutes
    };
  }

  calculateTrend(date) {
    // Simplified trend calculation - would normally compare with historical data
    return Math.random() > 0.5 ? 'up' : 'down';
  }

  async getWeeklyStats({ startDate, endDate }) {
    try {
      const activities = await activityRepository.getActivitiesBetweenDates(startDate, endDate);
      
      const totalHours = activities.reduce((sum, activity) => sum + activity.duration_ms, 0) / (60 * 60 * 1000);
      const productiveHours = activities
        .filter(activity => ['coding', 'research', 'design'].includes(activity.category))
        .reduce((sum, activity) => sum + activity.duration_ms, 0) / (60 * 60 * 1000);
      
      const completedProjects = new Set(
        activities
          .filter(activity => activity.status === 'completed' && activity.project_id)
          .map(activity => activity.project_id)
      ).size;

      // Generate daily scores
      const dailyScores = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayActivities = activities.filter(activity => 
          activity.start_time.startsWith(dateStr)
        );
        
        const dayScore = dayActivities.length > 0 
          ? (await this.getProductivityMetrics({ date: dateStr })).score
          : 0;
        
        dailyScores.push({
          date: dateStr,
          score: dayScore
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Category breakdown
      const categoryTotals = {};
      activities.forEach(activity => {
        if (!categoryTotals[activity.category]) {
          categoryTotals[activity.category] = 0;
        }
        categoryTotals[activity.category] += activity.duration_ms;
      });
      
      const totalTime = Object.values(categoryTotals).reduce((sum, time) => sum + time, 0);
      const categoryBreakdown = {};
      Object.entries(categoryTotals).forEach(([category, time]) => {
        categoryBreakdown[category] = Math.round((time / totalTime) * 100);
      });

      return {
        totalHours: Math.round(totalHours * 10) / 10,
        productiveHours: Math.round(productiveHours * 10) / 10,
        completedProjects,
        averageScore: dailyScores.reduce((sum, day) => sum + day.score, 0) / dailyScores.length,
        dailyScores,
        categoryBreakdown
      };
    } catch (error) {
      console.error('[Activity Service] Failed to get weekly stats:', error);
      return {
        totalHours: 0,
        productiveHours: 0,
        completedProjects: 0,
        averageScore: 0,
        dailyScores: [],
        categoryBreakdown: {}
      };
    }
  }

  async getGoalProgress() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date();
      monthStart.setDate(1);

      const [dailyData, weeklyData, monthlyData] = await Promise.all([
        this.getTimeline({ date: today }),
        this.getWeeklyStats({ 
          startDate: weekStart.toISOString().split('T')[0], 
          endDate: today 
        }),
        this.getWeeklyStats({ 
          startDate: monthStart.toISOString().split('T')[0], 
          endDate: today 
        })
      ]);

      const dailyHours = dailyData.totalTime / (60 * 60 * 1000);
      const weeklyHours = weeklyData.totalHours;
      const monthlyHours = monthlyData.totalHours;

      return {
        daily: {
          target: this.goals.daily,
          actual: Math.round(dailyHours * 10) / 10,
          percentage: Math.round((dailyHours / this.goals.daily) * 100 * 10) / 10
        },
        weekly: {
          target: this.goals.weekly,
          actual: Math.round(weeklyHours * 10) / 10,
          percentage: Math.round((weeklyHours / this.goals.weekly) * 100 * 10) / 10
        },
        monthly: {
          target: this.goals.monthly,
          actual: Math.round(monthlyHours * 10) / 10,
          percentage: Math.round((monthlyHours / this.goals.monthly) * 100 * 10) / 10
        }
      };
    } catch (error) {
      console.error('[Activity Service] Failed to get goal progress:', error);
      return {
        daily: { target: this.goals.daily, actual: 0, percentage: 0 },
        weekly: { target: this.goals.weekly, actual: 0, percentage: 0 },
        monthly: { target: this.goals.monthly, actual: 0, percentage: 0 }
      };
    }
  }

  async setGoals(goals) {
    try {
      this.goals = { ...this.goals, ...goals };
      await activityRepository.saveGoals(this.goals);
      return this.goals;
    } catch (error) {
      console.error('[Activity Service] Failed to set goals:', error);
      throw error;
    }
  }

  // Screenshot Capture Methods
  async captureScreenshot(options = {}) {
    if (process.platform === 'darwin') {
      try {
        const tempPath = path.join(os.tmpdir(), `activity-screenshot-${Date.now()}.jpg`);
        await execFile('screencapture', ['-x', '-t', 'jpg', tempPath]);
        
        const imageBuffer = await fs.promises.readFile(tempPath);
        await fs.promises.unlink(tempPath);

        if (sharp) {
          try {
            const resizedBuffer = await sharp(imageBuffer)
              .resize({ height: 384 })
              .jpeg({ quality: 70 })
              .toBuffer();
            
            const base64 = resizedBuffer.toString('base64');
            const metadata = await sharp(resizedBuffer).metadata();
            
            return {
              success: true,
              base64,
              width: metadata.width,
              height: metadata.height,
              timestamp: Date.now()
            };
          } catch (sharpError) {
            console.warn('[Activity Service] Sharp processing failed, using fallback:', sharpError.message);
          }
        }
        
        const base64 = imageBuffer.toString('base64');
        return {
          success: true,
          base64,
          width: null,
          height: null,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('[Activity Service] macOS screenshot capture failed:', error);
        return { success: false, error: error.message };
      }
    }

    // Fallback to Electron's desktopCapturer for other platforms
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      const source = sources[0];
      const buffer = source.thumbnail.toJPEG(70);
      const base64 = buffer.toString('base64');
      const size = source.thumbnail.getSize();

      return {
        success: true,
        base64,
        width: size.width,
        height: size.height,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[Activity Service] Desktop capturer failed:', error);
      return { success: false, error: error.message };
    }
  }

  // AI Analysis with Gemini
  async analyzeScreenshot(screenshotBase64) {
    if (!this.settings.enableAIAnalysis) {
      return null;
    }

    try {
      const modelInfo = await modelStateService.getCurrentModelInfo('llm');
      if (!modelInfo || modelInfo.provider !== 'gemini' || !modelInfo.apiKey) {
        console.log('[Activity Service] Gemini not configured, skipping AI analysis');
        return null;
      }

      const geminiLLM = createLLM({
        apiKey: modelInfo.apiKey,
        model: modelInfo.model || 'gemini-2.5-flash',
        temperature: 0.3,
        maxTokens: 1024
      });

      const analysisPrompt = `
Analyze this screenshot to categorize the user's current activity. 

Provide your analysis in this exact JSON format:
{
  "category": "one of: Focus, Communication, Research, Break, Creative, Other",
  "activity_title": "brief descriptive title (max 50 chars)",
  "confidence": 0.85,
  "details": {
    "primary_application": "main app being used",
    "content_type": "type of content (code, document, web, etc.)",
    "productivity_indicator": "high/medium/low",
    "distraction_level": "low/medium/high"
  },
  "insights": "brief insight about the activity pattern"
}

Categories:
- Focus: Deep work, coding, writing, design work
- Communication: Email, chat, meetings, calls
- Research: Reading, browsing documentation, learning
- Break: Social media, entertainment, personal browsing
- Creative: Design, brainstorming, planning, ideation
- Other: System tasks, file management, unclear activities

Be accurate and honest in your assessment.`;

      const parts = [
        analysisPrompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: screenshotBase64
          }
        }
      ];

      const result = await geminiLLM.generateContent(parts);
      const responseText = await result.response.text();
      
      // Parse JSON response
      try {
        const analysis = JSON.parse(responseText.trim());
        analysis.timestamp = Date.now();
        analysis.model_used = modelInfo.model;
        return analysis;
      } catch (parseError) {
        console.error('[Activity Service] Failed to parse AI analysis JSON:', parseError);
        console.error('[Activity Service] Raw response:', responseText);
        
        // Fallback: extract basic info from text response
        return this._parseFallbackAnalysis(responseText);
      }
    } catch (error) {
      console.error('[Activity Service] AI analysis failed:', error);
      return null;
    }
  }

  _parseFallbackAnalysis(responseText) {
    const lowerText = responseText.toLowerCase();
    let category = 'Other';
    let confidence = 0.5;
    
    // Simple keyword-based fallback categorization
    if (lowerText.includes('code') || lowerText.includes('programming') || lowerText.includes('development')) {
      category = 'Focus';
      confidence = 0.7;
    } else if (lowerText.includes('email') || lowerText.includes('chat') || lowerText.includes('meeting')) {
      category = 'Communication';
      confidence = 0.7;
    } else if (lowerText.includes('research') || lowerText.includes('reading') || lowerText.includes('documentation')) {
      category = 'Research';
      confidence = 0.7;
    } else if (lowerText.includes('social') || lowerText.includes('entertainment') || lowerText.includes('break')) {
      category = 'Break';
      confidence = 0.6;
    } else if (lowerText.includes('design') || lowerText.includes('creative') || lowerText.includes('brainstorm')) {
      category = 'Creative';
      confidence = 0.6;
    }

    return {
      category,
      activity_title: 'Detected Activity',
      confidence,
      details: {
        primary_application: 'Unknown',
        content_type: 'unknown',
        productivity_indicator: 'medium',
        distraction_level: 'medium'
      },
      insights: 'Basic analysis from fallback parsing',
      timestamp: Date.now(),
      fallback_analysis: true
    };
  }

  // Activity Tracking Control
  async startActivityTracking() {
    if (this.isTracking) {
      console.log('[Activity Service] Already tracking activities');
      return { success: true, message: 'Already tracking' };
    }

    console.log(`[Activity Service] Starting activity tracking with ${this.settings.captureInterval / 1000 / 60}min intervals`);
    this.isTracking = true;

    // Take initial screenshot and analysis
    await this._performActivityCapture();

    // Start periodic captures
    this.captureInterval = setInterval(async () => {
      try {
        await this._performActivityCapture();
      } catch (error) {
        console.error('[Activity Service] Periodic capture failed:', error);
      }
    }, this.settings.captureInterval);

    // Broadcast status to renderer processes
    this._broadcastStatus();

    return { success: true, message: 'Activity tracking started' };
  }

  async stopActivityTracking() {
    if (!this.isTracking) {
      console.log('[Activity Service] Not currently tracking');
      return { success: true, message: 'Not tracking' };
    }

    console.log('[Activity Service] Stopping activity tracking');
    this.isTracking = false;

    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    // End current activity if exists
    if (this.currentActivity) {
      await this._endCurrentActivity();
    }

    this._broadcastStatus();
    return { success: true, message: 'Activity tracking stopped' };
  }

  async _performActivityCapture() {
    try {
      console.log('[Activity Service] Performing activity capture and analysis...');
      
      const screenshot = await this.captureScreenshot();
      if (!screenshot.success) {
        console.error('[Activity Service] Screenshot capture failed:', screenshot.error);
        return;
      }

      this.lastScreenshot = screenshot;
      
      // Analyze with AI if enabled
      let analysis = null;
      if (this.settings.enableAIAnalysis) {
        analysis = await this.analyzeScreenshot(screenshot.base64);
        this.lastAnalysis = analysis;
      }

      // Store capture in history (without full screenshot data for memory efficiency)
      const captureRecord = {
        timestamp: screenshot.timestamp,
        analysis: analysis,
        screenshot_available: true
      };
      
      this.captureHistory.unshift(captureRecord);
      if (this.captureHistory.length > this.maxHistorySize) {
        this.captureHistory = this.captureHistory.slice(0, this.maxHistorySize);
      }

      // Create or update activity based on analysis
      if (analysis) {
        await this._processActivityFromAnalysis(analysis, screenshot.timestamp);
      }

      // Store detailed capture data if not in privacy mode
      if (!this.settings.privacyMode) {
        await this._storeCaptureData(screenshot, analysis);
      }

      console.log(`[Activity Service] Capture completed. Category: ${analysis?.category || 'No analysis'}, Confidence: ${analysis?.confidence || 0}`);
      
    } catch (error) {
      console.error('[Activity Service] Activity capture failed:', error);
    }
  }

  async _processActivityFromAnalysis(analysis, timestamp) {
    try {
      const now = new Date(timestamp);
      const activityTitle = analysis.activity_title || `${analysis.category} Activity`;
      
      // Check if this is continuation of current activity or a new one
      const shouldCreateNewActivity = !this.currentActivity || 
        this.currentActivity.category !== analysis.category ||
        (now - new Date(this.currentActivity.updated_at)) > (this.settings.captureInterval * 2); // Gap threshold

      if (shouldCreateNewActivity) {
        // End current activity if exists
        if (this.currentActivity) {
          await this._endCurrentActivity();
        }

        // Create new activity
        const activityData = {
          title: activityTitle,
          category: analysis.category.toLowerCase(),
          start_time: now.toISOString(),
          end_time: null,
          duration_ms: 0,
          status: 'active',
          metadata: {
            ai_analysis: analysis,
            capture_interval: this.settings.captureInterval,
            productivity_indicator: analysis.details?.productivity_indicator,
            distraction_level: analysis.details?.distraction_level,
            primary_application: analysis.details?.primary_application,
            content_type: analysis.details?.content_type,
            confidence: analysis.confidence,
            auto_generated: true
          }
        };

        this.currentActivity = await activityRepository.createActivity(activityData);
        console.log(`[Activity Service] Started new activity: ${activityTitle} (${analysis.category})`);
      } else {
        // Update existing activity
        const updatedMetadata = {
          ...this.currentActivity.metadata,
          last_analysis: analysis,
          updated_count: (this.currentActivity.metadata.updated_count || 0) + 1
        };

        await activityRepository.updateActivity(this.currentActivity.id, {
          updated_at: now.toISOString(),
          metadata: updatedMetadata
        });

        console.log(`[Activity Service] Updated existing activity: ${this.currentActivity.title}`);
      }
    } catch (error) {
      console.error('[Activity Service] Failed to process activity from analysis:', error);
    }
  }

  async _endCurrentActivity() {
    if (!this.currentActivity) return;

    try {
      const endTime = new Date();
      const startTime = new Date(this.currentActivity.start_time);
      const duration = endTime - startTime;

      await activityRepository.updateActivity(this.currentActivity.id, {
        end_time: endTime.toISOString(),
        duration_ms: duration,
        status: 'completed'
      });

      console.log(`[Activity Service] Ended activity: ${this.currentActivity.title}, Duration: ${Math.round(duration / 60000)}min`);
      this.currentActivity = null;
    } catch (error) {
      console.error('[Activity Service] Failed to end current activity:', error);
    }
  }

  async _storeCaptureData(screenshot, analysis) {
    try {
      const captureData = {
        timestamp: new Date(screenshot.timestamp).toISOString(),
        screenshot_hash: this._generateScreenshotHash(screenshot.base64),
        analysis_summary: analysis ? {
          category: analysis.category,
          confidence: analysis.confidence,
          productivity_indicator: analysis.details?.productivity_indicator
        } : null,
        metadata: {
          screenshot_dimensions: {
            width: screenshot.width,
            height: screenshot.height
          },
          capture_settings: {
            interval: this.settings.captureInterval,
            ai_enabled: this.settings.enableAIAnalysis
          }
        }
      };

      await activityRepository.storeCaptureData(captureData);
    } catch (error) {
      console.error('[Activity Service] Failed to store capture data:', error);
    }
  }

  _generateScreenshotHash(base64) {
    // Simple hash for deduplication (in production, use crypto.createHash)
    return Buffer.from(base64.substring(0, 100)).toString('hex');
  }

  _broadcastStatus() {
    const status = {
      isTracking: this.isTracking,
      currentActivity: this.currentActivity,
      lastAnalysis: this.lastAnalysis,
      settings: this.settings
    };
    
    BrowserWindow.getAllWindows().forEach(win => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('activity:status-update', status);
      }
    });
  }

  // Settings Management
  async updateSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await activityRepository.saveSettings(this.settings);
      
      // Restart tracking if interval changed
      if (this.isTracking && newSettings.captureInterval && newSettings.captureInterval !== this.settings.captureInterval) {
        await this.stopActivityTracking();
        await this.startActivityTracking();
      }
      
      this._broadcastStatus();
      return this.settings;
    } catch (error) {
      console.error('[Activity Service] Failed to update settings:', error);
      throw error;
    }
  }

  // Smart Insights Generation
  async generateInsights(timeframe = 'week') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const activities = await activityRepository.getActivitiesBetweenDates(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      return this._analyzeActivityPatterns(activities, timeframe);
    } catch (error) {
      console.error('[Activity Service] Failed to generate insights:', error);
      return null;
    }
  }

  _analyzeActivityPatterns(activities, timeframe) {
    if (activities.length === 0) {
      return {
        timeframe,
        total_activities: 0,
        insights: ['No activity data available for the selected timeframe'],
        recommendations: ['Start activity tracking to generate insights']
      };
    }

    const categoryStats = {};
    let totalProductiveTime = 0;
    let totalDistractionTime = 0;
    const hourlyDistribution = {};
    
    activities.forEach(activity => {
      const category = activity.category;
      const duration = activity.duration_ms || 0;
      const startHour = new Date(activity.start_time).getHours();
      
      // Category stats
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, duration: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].duration += duration;
      
      // Productivity metrics
      const productivity = activity.metadata?.productivity_indicator;
      if (productivity === 'high' || ['focus', 'creative', 'research'].includes(category)) {
        totalProductiveTime += duration;
      } else if (productivity === 'low' || category === 'break') {
        totalDistractionTime += duration;
      }
      
      // Hourly distribution
      if (!hourlyDistribution[startHour]) {
        hourlyDistribution[startHour] = 0;
      }
      hourlyDistribution[startHour] += duration;
    });

    // Find peak productivity hours
    const peakHours = Object.entries(hourlyDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // Generate insights
    const insights = [];
    const recommendations = [];

    const totalTime = totalProductiveTime + totalDistractionTime;
    const productivityRatio = totalTime > 0 ? totalProductiveTime / totalTime : 0;
    
    if (productivityRatio > 0.7) {
      insights.push(`High productivity period with ${Math.round(productivityRatio * 100)}% focused work`);
    } else if (productivityRatio < 0.4) {
      insights.push(`Low productivity period with only ${Math.round(productivityRatio * 100)}% focused work`);
      recommendations.push('Consider reducing distractions and implementing focused work blocks');
    }

    // Most common category
    const topCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b.duration - a.duration)[0];
    
    if (topCategory) {
      insights.push(`Most time spent on ${topCategory[0]} activities (${Math.round(topCategory[1].duration / 60000)} minutes)`);
    }

    if (peakHours.length > 0) {
      insights.push(`Peak activity hours: ${peakHours.join(', ')}`);
      recommendations.push(`Schedule important work during peak hours: ${peakHours[0]} - ${peakHours[1]}`);
    }

    return {
      timeframe,
      total_activities: activities.length,
      productivity_ratio: Math.round(productivityRatio * 100),
      category_breakdown: categoryStats,
      peak_hours: peakHours,
      insights,
      recommendations,
      generated_at: new Date().toISOString()
    };
  }

  // Status and Data Access Methods
  async getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      currentActivity: this.currentActivity,
      lastAnalysis: this.lastAnalysis,
      settings: this.settings,
      captureHistory: this.captureHistory.slice(0, 10) // Last 10 captures
    };
  }

  async getCaptureHistory(limit = 50) {
    return this.captureHistory.slice(0, limit);
  }

  // Utility method to create activity entries
  async createActivity(activityData) {
    try {
      return await activityRepository.createActivity(activityData);
    } catch (error) {
      console.error('[Activity Service] Failed to create activity:', error);
      throw error;
    }
  }
}

module.exports = new ActivityService();