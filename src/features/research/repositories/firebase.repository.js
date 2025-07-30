const firebaseClient = require('../../common/services/firebaseClient');

class ResearchFirebaseRepository {
  async initialize() {
    // Firebase collections are created automatically
    console.log('[Research Firebase Repository] Initialized (collections created on first use)');
  }

  async createSession(sessionData) {
    const db = firebaseClient.getDb();
    
    const sessionDoc = {
      uid: sessionData.uid,
      title: sessionData.title,
      session_type: sessionData.session_type || 'pdf_reading',
      start_time: sessionData.start_time,
      end_time: sessionData.end_time || null,
      duration_ms: sessionData.duration_ms || null,
      pdf_source: sessionData.pdf_source || '',
      metadata: sessionData.metadata || {},
      created_at: new Date().toISOString()
    };

    const docRef = await db.collection('research_sessions').add(sessionDoc);
    
    return {
      id: docRef.id,
      ...sessionDoc
    };
  }

  async updateSession(sessionId, updates) {
    const db = firebaseClient.getDb();
    
    const updateData = {};
    
    if (updates.end_time !== undefined) {
      updateData.end_time = updates.end_time;
    }
    
    if (updates.duration_ms !== undefined) {
      updateData.duration_ms = updates.duration_ms;
    }
    
    if (updates.metadata !== undefined) {
      updateData.metadata = updates.metadata;
    }

    if (Object.keys(updateData).length === 0) return false;

    await db.collection('research_sessions').doc(sessionId).update(updateData);
    return true;
  }

  async getSessionById(sessionId, uid) {
    const db = firebaseClient.getDb();
    
    const doc = await db.collection('research_sessions').doc(sessionId).get();
    
    if (!doc.exists) return null;
    
    const data = doc.data();
    if (data.uid !== uid) return null;
    
    return {
      id: doc.id,
      ...data
    };
  }

  async getSessions(limit = 20, offset = 0, uid) {
    const db = firebaseClient.getDb();
    
    let query = db.collection('research_sessions')
      .where('uid', '==', uid)
      .orderBy('start_time', 'desc')
      .limit(limit);
    
    if (offset > 0) {
      // Firebase doesn't have offset, so we'd need to implement pagination differently
      // For now, just return the limited results
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getRecentSessions(limit = 10, uid) {
    const db = firebaseClient.getDb();
    
    const snapshot = await db.collection('research_sessions')
      .where('uid', '==', uid)
      .orderBy('start_time', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getDailyStats(date, uid) {
    const db = firebaseClient.getDb();
    
    // Firebase doesn't support complex aggregations like SQLite
    // We'd need to fetch all sessions for the day and calculate client-side
    const startOfDay = new Date(date + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(date + 'T23:59:59.999Z').toISOString();
    
    const snapshot = await db.collection('research_sessions')
      .where('uid', '==', uid)
      .where('start_time', '>=', startOfDay)
      .where('start_time', '<=', endOfDay)
      .get();
    
    const sessions = snapshot.docs.map(doc => doc.data());
    const completedSessions = sessions.filter(s => s.duration_ms !== null);
    
    const stats = {
      total_sessions: sessions.length,
      total_time_ms: completedSessions.reduce((sum, s) => sum + (s.duration_ms || 0), 0),
      avg_session_length_ms: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.duration_ms || 0), 0) / completedSessions.length 
        : 0,
      unique_pdfs: new Set(sessions.map(s => s.title)).size
    };

    return stats;
  }

  async addEvent(eventData) {
    const db = firebaseClient.getDb();
    
    const eventDoc = {
      session_id: eventData.session_id,
      uid: eventData.uid,
      event_type: eventData.event_type,
      event_data: eventData.event_data || {},
      timestamp: new Date().toISOString()
    };

    const docRef = await db.collection('research_events').add(eventDoc);
    
    return {
      id: docRef.id,
      ...eventDoc
    };
  }

  /**
   * Store AI analysis results
   */
  async createAnalysis(analysisData) {
    const db = firebaseClient.getDb();
    
    const analysisDoc = {
      session_id: analysisData.session_id,
      uid: analysisData.uid,
      timestamp: analysisData.timestamp,
      productivity_score: analysisData.productivity_score || 0,
      activity_type: analysisData.activity_type || 'unknown',
      applications: JSON.parse(analysisData.applications || '[]'),
      focus_quality: analysisData.focus_quality || 'unknown',
      raw_analysis: analysisData.raw_analysis || '',
      confidence_score: analysisData.confidence_score || 0,
      categories: JSON.parse(analysisData.categories || '[]'),
      tags: JSON.parse(analysisData.tags || '[]'),
      created_at: new Date().toISOString()
    };

    const docRef = await db.collection('research_analysis').add(analysisDoc);
    
    return {
      id: docRef.id,
      ...analysisDoc
    };
  }

  /**
   * Get analysis data for a session
   */
  async getSessionAnalysis(sessionId, uid) {
    const db = firebaseClient.getDb();
    
    const snapshot = await db.collection('research_analysis')
      .where('session_id', '==', sessionId)
      .where('uid', '==', uid)
      .orderBy('timestamp', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Get recent analysis data for insights
   */
  async getRecentAnalysis(hours = 24, uid) {
    const db = firebaseClient.getDb();
    
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    const snapshot = await db.collection('research_analysis')
      .where('uid', '==', uid)
      .where('timestamp', '>=', cutoffTime)
      .orderBy('timestamp', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Get productivity statistics (simplified for Firebase)
   */
  async getProductivityStats(timeframe, uid) {
    const db = firebaseClient.getDb();
    
    let cutoffHours;
    switch (timeframe) {
      case '1h': cutoffHours = 1; break;
      case '24h': cutoffHours = 24; break;
      case '7d': cutoffHours = 7 * 24; break;
      default: cutoffHours = 24;
    }
    
    const cutoffTime = new Date(Date.now() - (cutoffHours * 60 * 60 * 1000)).toISOString();
    
    const snapshot = await db.collection('research_analysis')
      .where('uid', '==', uid)
      .where('timestamp', '>=', cutoffTime)
      .get();

    const analyses = snapshot.docs.map(doc => doc.data());
    
    if (analyses.length === 0) {
      return {
        total_analyses: 0,
        avg_productivity: 0,
        max_productivity: 0,
        min_productivity: 0,
        avg_confidence: 0
      };
    }

    const productivityScores = analyses.map(a => a.productivity_score || 0);
    const confidenceScores = analyses.map(a => a.confidence_score || 0);
    
    return {
      total_analyses: analyses.length,
      avg_productivity: productivityScores.reduce((sum, score) => sum + score, 0) / productivityScores.length,
      max_productivity: Math.max(...productivityScores),
      min_productivity: Math.min(...productivityScores),
      avg_confidence: confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
    };
  }

  /**
   * Store generated insights
   */
  async storeInsights(insightData) {
    const db = firebaseClient.getDb();
    
    // Calculate expiration time (insights valid for 4 hours)
    const expiresAt = new Date(Date.now() + (4 * 60 * 60 * 1000)).toISOString();
    
    const insightDoc = {
      uid: insightData.uid,
      insight_type: insightData.insight_type || 'general',
      timeframe: insightData.timeframe || '24h',
      data_points: insightData.data_points || 0,
      insights_data: insightData.insights_data,
      generated_at: new Date().toISOString(),
      expires_at: expiresAt
    };

    const docRef = await db.collection('research_insights').add(insightDoc);
    
    return {
      id: docRef.id,
      ...insightDoc
    };
  }

  /**
   * Get cached insights if still valid
   */
  async getCachedInsights(insightType, timeframe, uid) {
    const db = firebaseClient.getDb();
    
    const now = new Date().toISOString();
    
    const snapshot = await db.collection('research_insights')
      .where('uid', '==', uid)
      .where('insight_type', '==', insightType)
      .where('timeframe', '==', timeframe)
      .where('expires_at', '>', now)
      .orderBy('expires_at', 'desc')
      .orderBy('generated_at', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }

    return null;
  }

  /**
   * Clean expired insights (called periodically)
   */
  async cleanExpiredInsights() {
    const db = firebaseClient.getDb();
    
    const now = new Date().toISOString();
    
    const expiredSnapshot = await db.collection('research_insights')
      .where('expires_at', '<=', now)
      .limit(100) // Process in batches
      .get();

    const batch = db.batch();
    expiredSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    if (!expiredSnapshot.empty) {
      await batch.commit();
      console.log(`[Research Firebase Repository] Cleaned ${expiredSnapshot.docs.length} expired insights`);
    }
  }
}

module.exports = new ResearchFirebaseRepository();