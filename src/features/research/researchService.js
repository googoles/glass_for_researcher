const researchRepository = require('./repositories');
const { BrowserWindow } = require('electron');

class ResearchService {
  constructor() {
    this.isTracking = false;
    this.currentSession = null;
    this.lastDetectedPDF = null;
    this.checkInterval = 3000; // Check every 3 seconds
    this.intervalId = null;
  }

  async initialize() {
    console.log('[Research Service] Initializing research tracking...');
    try {
      await researchRepository.initialize();
      console.log('[Research Service] Research repository initialized');
      return true;
    } catch (error) {
      console.error('[Research Service] Failed to initialize:', error);
      return false;
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
    }, this.checkInterval);

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
    // Simple PDF detection based on window titles
    const windows = BrowserWindow.getAllWindows();
    
    for (const window of windows) {
      if (window && !window.isDestroyed()) {
        const title = window.getTitle();
        if (title && (title.includes('.pdf') || title.toLowerCase().includes('pdf'))) {
          return {
            title: title,
            source: 'electron-window',
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