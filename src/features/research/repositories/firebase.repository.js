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
}

module.exports = new ResearchFirebaseRepository();