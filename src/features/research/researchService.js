const researchRepository = require('./repositories');
const { BrowserWindow, desktopCapturer } = require('electron');
const AnalysisService = require('./ai/analysisService');
const settingsService = require('../settings/settingsService');

class ResearchService {
  constructor() {
    this.isTracking = false;
    this.currentSession = null;
    this.lastDetectedPDF = null;
    this.checkInterval = 3000; // Check every 3 seconds
    this.intervalId = null;
    this.analysisService = new AnalysisService();
    this.aiEnabled = false;
    this.screenshotHistory = [];
    this.analysisHistory = [];
    this.lastScreenshotTime = 0;
    this.screenshotInterval = 60000; // Take screenshot every minute during tracking
  }

  async initialize() {
    console.log('[Research Service] Initializing research tracking...');
    try {
      await researchRepository.initialize();
      console.log('[Research Service] Research repository initialized');
      
      // Initialize AI analysis if API keys are available
      await this.initializeAI();
      
      return true;
    } catch (error) {
      console.error('[Research Service] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Initialize AI analysis service with available API keys
   */
  async initializeAI() {
    try {
      const settings = await settingsService.getSettings();
      
      // Try to initialize with available AI providers
      if (settings.gemini?.apiKey) {
        const success = await this.analysisService.initialize(
          settings.gemini.apiKey, 
          'gemini', 
          'gemini-2.5-flash'
        );
        if (success) {
          this.aiEnabled = true;
          console.log('[Research Service] AI analysis enabled with Gemini');
          return;
        }
      }
      
      if (settings.openai?.apiKey) {
        const success = await this.analysisService.initialize(
          settings.openai.apiKey, 
          'openai', 
          'gpt-4o'
        );
        if (success) {
          this.aiEnabled = true;
          console.log('[Research Service] AI analysis enabled with OpenAI');
          return;
        }
      }
      
      console.log('[Research Service] AI analysis not available - no valid API keys');
    } catch (error) {
      console.error('[Research Service] Failed to initialize AI:', error);
    }
  }

  async startTracking() {
    if (this.isTracking) {
      console.log('[Research Service] Already tracking');
      return { success: true, message: 'Already tracking' };
    }

    console.log('[Research Service] Starting research tracking...');
    this.isTracking = true;

    // Start PDF detection loop
    this.intervalId = setInterval(() => {
      this.checkForPDFs();
      this.performPeriodicAnalysis();
    }, this.checkInterval);

    // Take initial screenshot if AI is enabled
    if (this.aiEnabled) {
      await this.captureAndAnalyze();
    }

    return { success: true, message: 'Research tracking started' };
  }

  async stopTracking() {
    if (!this.isTracking) {
      console.log('[Research Service] Not currently tracking');
      return { success: true, message: 'Not tracking' };
    }

    console.log('[Research Service] Stopping research tracking...');
    this.isTracking = false;

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // End current session if exists
    if (this.currentSession) {
      await this.endCurrentSession();
    }

    return { success: true, message: 'Research tracking stopped' };
  }

  async checkForPDFs() {
    try {
      const detectedPDF = await this.detectActivePDF();
      
      if (detectedPDF) {
        if (!this.lastDetectedPDF || this.lastDetectedPDF.title !== detectedPDF.title) {
          console.log(`[Research Service] New PDF detected: ${detectedPDF.title}`);
          await this.handleNewPDF(detectedPDF);
          this.lastDetectedPDF = detectedPDF;
        }
      } else {
        if (this.lastDetectedPDF) {
          console.log('[Research Service] PDF no longer active');
          await this.endCurrentSession();
          this.lastDetectedPDF = null;
        }
      }
    } catch (error) {
      console.error('[Research Service] Error checking for PDFs:', error);
    }
  }

  async detectActivePDF() {
    // Enhanced PDF detection for Zotero and other PDF readers
    const windows = BrowserWindow.getAllWindows();
    
    for (const window of windows) {
      if (window && !window.isDestroyed()) {
        const title = window.getTitle();
        
        // Check for Zotero window with PDF
        if (title && (
          title.includes('Zotero') || 
          title.includes('.pdf') || 
          title.toLowerCase().includes('pdf') ||
          title.includes('Adobe') ||
          title.includes('Preview') ||
          title.includes('Foxit') ||
          title.includes('Sumatra')
        )) {
          // Extract PDF name from title
          let pdfTitle = title;
          
          // Handle Zotero format: "Author - Title - Zotero"
          if (title.includes('Zotero')) {
            const parts = title.split(' - ');
            if (parts.length >= 2) {
              pdfTitle = parts.slice(0, -1).join(' - ');
            }
          }
          
          // Handle standard PDF format
          const pdfMatch = title.match(/([^\/\\]+\.pdf)/i);
          if (pdfMatch) {
            pdfTitle = pdfMatch[1];
          }
          
          return {
            title: pdfTitle,
            source: title.includes('Zotero') ? 'zotero' : 'pdf-reader',
            timestamp: new Date().toISOString()
          };
        }
      }
    }

    return null;
  }

  async handleNewPDF(pdfData) {
    try {
      // End previous session if exists
      if (this.currentSession) {
        await this.endCurrentSession();
      }

      // Create new session
      this.currentSession = await researchRepository.createSession({
        title: pdfData.title,
        session_type: 'pdf_reading',
        start_time: new Date().toISOString(),
        pdf_source: pdfData.source
      });

      console.log(`[Research Service] Started new session: ${this.currentSession.id}`);
    } catch (error) {
      console.error('[Research Service] Failed to handle new PDF:', error);
    }
  }

  async endCurrentSession() {
    if (!this.currentSession) return;

    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(this.currentSession.start_time);
      const duration = new Date(endTime) - startTime;

      await researchRepository.updateSession(this.currentSession.id, {
        end_time: endTime,
        duration_ms: duration
      });

      console.log(`[Research Service] Ended session: ${this.currentSession.id}, Duration: ${Math.round(duration / 1000)}s`);
      this.currentSession = null;
    } catch (error) {
      console.error('[Research Service] Failed to end session:', error);
    }
  }

  async getStatus() {
    return {
      isTracking: this.isTracking,
      currentSession: this.currentSession,
      lastDetectedPDF: this.lastDetectedPDF
    };
  }

  async getDashboardData() {
    try {
      const [recentSessions, dailyStats] = await Promise.all([
        researchRepository.getRecentSessions(10),
        researchRepository.getDailyStats(new Date().toISOString().split('T')[0])
      ]);

      return {
        recentSessions,
        dailyStats,
        currentSession: this.currentSession
      };
    } catch (error) {
      console.error('[Research Service] Failed to get dashboard data:', error);
      return {
        recentSessions: [],
        dailyStats: null,
        currentSession: this.currentSession
      };
    }
  }

  async getSessions(limit = 20, offset = 0) {
    try {
      return await researchRepository.getSessions(limit, offset);
    } catch (error) {
      console.error('[Research Service] Failed to get sessions:', error);
      return [];
    }
  }

  async getSessionDetails(sessionId) {
    try {
      return await researchRepository.getSessionById(sessionId);
    } catch (error) {
      console.error('[Research Service] Failed to get session details:', error);
      return null;
    }
  }

  /**
   * Perform periodic AI analysis if enabled
   */
  async performPeriodicAnalysis() {
    if (!this.aiEnabled || !this.isTracking) return;
    
    const now = Date.now();
    if (now - this.lastScreenshotTime >= this.screenshotInterval) {
      await this.captureAndAnalyze();
      this.lastScreenshotTime = now;
    }
  }

  /**
   * Capture screenshot and perform AI analysis
   */
  async captureAndAnalyze() {
    try {
      const screenshot = await this.captureScreenshot();
      if (!screenshot.success) {
        console.warn('[Research Service] Screenshot capture failed:', screenshot.error);
        return;
      }

      const context = {
        timestamp: Date.now(),
        activeApplication: await this.getActiveApplication(),
        windowTitle: await this.getActiveWindowTitle(),
        sessionId: this.currentSession?.id
      };

      // Perform AI analysis
      const analysis = await this.analysisService.analyzeScreenshot(
        screenshot.base64,
        context
      );

      // Store screenshot and analysis
      this.screenshotHistory.push({
        timestamp: context.timestamp,
        base64: screenshot.base64,
        width: screenshot.width,
        height: screenshot.height,
        context
      });

      this.analysisHistory.push({
        ...analysis,
        timestamp: context.timestamp,
        sessionId: context.sessionId
      });

      // Limit history size to prevent memory issues
      if (this.screenshotHistory.length > 100) {
        this.screenshotHistory = this.screenshotHistory.slice(-50);
      }
      if (this.analysisHistory.length > 100) {
        this.analysisHistory = this.analysisHistory.slice(-50);
      }

      // Store analysis in database
      if (this.currentSession) {
        await this.storeAnalysis(analysis, context);
      }

      // Send real-time updates to renderer
      this.sendToRenderer('analysis-update', {
        analysis,
        context,
        productivity_score: analysis.productivity_score || 0
      });

      console.log(`[Research Service] Analysis completed - Productivity: ${analysis.productivity_score || 'N/A'}`);
    } catch (error) {
      console.error('[Research Service] Analysis failed:', error);
    }
  }

  /**
   * Capture screenshot using desktop capturer
   */
  async captureScreenshot() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: 1920,
          height: 1080
        }
      });

      if (sources.length === 0) {
        return { success: false, error: 'No screen sources available' };
      }

      const primaryScreen = sources[0];
      const thumbnail = primaryScreen.thumbnail;
      
      // Convert to base64
      const base64 = thumbnail.toPNG().toString('base64');
      const size = thumbnail.getSize();

      return {
        success: true,
        base64,
        width: size.width,
        height: size.height
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active application name
   */
  async getActiveApplication() {
    try {
      // Try to get from focused window
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        return 'Glass'; // Our own application
      }

      // For other applications, we'd need platform-specific code
      // This is a simplified version
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get active window title
   */
  async getActiveWindowTitle() {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        return focusedWindow.getTitle();
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Store analysis results in database
   */
  async storeAnalysis(analysis, context) {
    try {
      await researchRepository.createAnalysis({
        session_id: context.sessionId,
        timestamp: context.timestamp,
        productivity_score: analysis.productivity_score || 0,
        activity_type: analysis.activity_type || 'unknown',
        applications: JSON.stringify(analysis.applications || []),
        focus_quality: analysis.focus_quality || 'unknown',
        raw_analysis: analysis.raw_analysis || '',
        confidence_score: analysis.confidence_score || 0,
        categories: JSON.stringify(analysis.categories || []),
        tags: JSON.stringify(analysis.tags || [])
      });
    } catch (error) {
      console.error('[Research Service] Failed to store analysis:', error);
    }
  }

  /**
   * Generate comprehensive insights from analysis history
   */
  async generateInsights(timeframe = '24h') {
    if (!this.aiEnabled || this.analysisHistory.length < 5) {
      return {
        error: 'Insufficient data for insights',
        message: 'Continue using the system to generate meaningful insights'
      };
    }

    try {
      // Filter data by timeframe
      const cutoffTime = this.getTimeframeCutoff(timeframe);
      const recentAnalysis = this.analysisHistory.filter(
        a => a.timestamp >= cutoffTime
      );

      if (recentAnalysis.length < 3) {
        return {
          error: 'Insufficient recent data',
          message: `Only ${recentAnalysis.length} data points in the last ${timeframe}`
        };
      }

      // Generate pattern analysis
      const patterns = await this.analysisService.analyzePatterns(
        this.screenshotHistory.filter(s => s.timestamp >= cutoffTime),
        timeframe
      );

      // Generate personalized insights
      const insights = await this.analysisService.generateInsights(
        recentAnalysis,
        await this.getUserPreferences()
      );

      return {
        timeframe,
        dataPoints: recentAnalysis.length,
        patterns,
        insights,
        generatedAt: Date.now()
      };
    } catch (error) {
      console.error('[Research Service] Failed to generate insights:', error);
      return {
        error: error.message,
        message: 'Failed to generate insights'
      };
    }
  }

  /**
   * Analyze application usage patterns
   */
  async analyzeApplicationUsage(appName) {
    if (!this.aiEnabled) {
      return { error: 'AI analysis not available' };
    }

    try {
      const appScreenshots = this.screenshotHistory.filter(
        s => s.context.activeApplication === appName
      );

      if (appScreenshots.length < 3) {
        return {
          error: 'Insufficient data',
          message: `Only ${appScreenshots.length} screenshots found for ${appName}`
        };
      }

      return await this.analysisService.analyzeApplicationUsage(appName, appScreenshots);
    } catch (error) {
      console.error('[Research Service] App analysis failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Get productivity score for current activity
   */
  async getCurrentProductivityScore() {
    if (!this.aiEnabled || this.analysisHistory.length === 0) {
      return { score: null, message: 'AI analysis not available' };
    }

    const latest = this.analysisHistory[this.analysisHistory.length - 1];
    return {
      score: latest.productivity_score || 0,
      timestamp: latest.timestamp,
      confidence: latest.confidence_score || 0,
      analysis: latest.activity_type || 'unknown'
    };
  }

  /**
   * Get analysis history for dashboard
   */
  getAnalysisHistory(limit = 50) {
    return this.analysisHistory.slice(-limit).map(analysis => ({
      timestamp: analysis.timestamp,
      productivity_score: analysis.productivity_score || 0,
      activity_type: analysis.activity_type || 'unknown',
      applications: analysis.applications || [],
      focus_quality: analysis.focus_quality || 'unknown',
      confidence_score: analysis.confidence_score || 0
    }));
  }

  // Helper methods

  getTimeframeCutoff(timeframe) {
    const now = Date.now();
    switch (timeframe) {
      case '1h': return now - (60 * 60 * 1000);
      case '4h': return now - (4 * 60 * 60 * 1000);
      case '12h': return now - (12 * 60 * 60 * 1000);
      case '24h': return now - (24 * 60 * 60 * 1000);
      case '7d': return now - (7 * 24 * 60 * 60 * 1000);
      default: return now - (24 * 60 * 60 * 1000);
    }
  }

  async getUserPreferences() {
    try {
      const settings = await settingsService.getSettings();
      return {
        goals: settings.research?.goals || [],
        preferences: settings.research?.preferences || {},
        workStyle: settings.research?.workStyle || 'balanced'
      };
    } catch (error) {
      return { goals: [], preferences: {}, workStyle: 'balanced' };
    }
  }

  /**
   * Get AI analysis status
   */
  getAIStatus() {
    return {
      enabled: this.aiEnabled,
      analysisHistory: this.analysisHistory.length,
      screenshotHistory: this.screenshotHistory.length,
      lastAnalysis: this.analysisHistory.length > 0 ? 
        this.analysisHistory[this.analysisHistory.length - 1].timestamp : null
    };
  }

  /**
   * Manually trigger capture and analysis
   */
  async manualCaptureAndAnalyze() {
    if (!this.aiEnabled) {
      return { error: 'AI analysis not available' };
    }

    try {
      await this.captureAndAnalyze();
      return { success: true, message: 'Analysis completed' };
    } catch (error) {
      console.error('[Research Service] Manual analysis failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Get productivity statistics from repository
   */
  async getProductivityStatsFromDB(timeframe) {
    try {
      return await researchRepository.getProductivityStats(timeframe);
    } catch (error) {
      console.error('[Research Service] Failed to get productivity stats:', error);
      return null;
    }
  }

  // Send event to renderer processes
  sendToRenderer(event, data) {
    BrowserWindow.getAllWindows().forEach(win => {
      if (win && !win.isDestroyed()) {
        win.webContents.send(`research:${event}`, data);
      }
    });
  }
}

module.exports = new ResearchService();