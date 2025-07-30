const sqliteClient = require('../../common/services/sqliteClient');

class ResearchSqliteRepository {
  async initialize() {
    const db = sqliteClient.getDb();
    
    // Create research sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS research_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        title TEXT NOT NULL,
        session_type TEXT DEFAULT 'pdf_reading',
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        duration_ms INTEGER,
        pdf_source TEXT,
        metadata TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create research events table for detailed tracking
    db.exec(`
      CREATE TABLE IF NOT EXISTS research_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        uid TEXT,
        event_type TEXT NOT NULL,
        event_data TEXT DEFAULT '{}',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES research_sessions (id) ON DELETE CASCADE
      )
    `);

    console.log('[Research SQLite Repository] Tables created/verified');
  }

  async createSession(sessionData) {
    const db = sqliteClient.getDb();
    
    const result = await db.run(`
      INSERT INTO research_sessions (uid, title, session_type, start_time, pdf_source, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      sessionData.uid,
      sessionData.title,
      sessionData.session_type || 'pdf_reading',
      sessionData.start_time,
      sessionData.pdf_source || '',
      JSON.stringify(sessionData.metadata || {})
    ]);

    return {
      id: result.lastID,
      ...sessionData
    };
  }

  async updateSession(sessionId, updates) {
    const db = sqliteClient.getDb();
    
    const fields = [];
    const params = [];

    if (updates.end_time !== undefined) {
      fields.push('end_time = ?');
      params.push(updates.end_time);
    }

    if (updates.duration_ms !== undefined) {
      fields.push('duration_ms = ?');
      params.push(updates.duration_ms);
    }

    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      params.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) return false;

    params.push(sessionId);
    params.push(updates.uid);

    await db.run(`
      UPDATE research_sessions
      SET ${fields.join(', ')}
      WHERE id = ? AND uid = ?
    `, params);

    return true;
  }

  async getSessionById(sessionId, uid) {
    const db = sqliteClient.getDb();
    
    const session = await db.get(`
      SELECT * FROM research_sessions
      WHERE id = ? AND uid = ?
    `, [sessionId, uid]);

    if (session) {
      session.metadata = JSON.parse(session.metadata || '{}');
    }

    return session;
  }

  async getSessions(limit = 20, offset = 0, uid) {
    const db = sqliteClient.getDb();
    
    const sessions = await db.all(`
      SELECT * FROM research_sessions
      WHERE uid = ?
      ORDER BY start_time DESC
      LIMIT ? OFFSET ?
    `, [uid, limit, offset]);

    return sessions.map(session => ({
      ...session,
      metadata: JSON.parse(session.metadata || '{}')
    }));
  }

  async getRecentSessions(limit = 10, uid) {
    const db = sqliteClient.getDb();
    
    const sessions = await db.all(`
      SELECT * FROM research_sessions
      WHERE uid = ?
      ORDER BY start_time DESC
      LIMIT ?
    `, [uid, limit]);

    return sessions.map(session => ({
      ...session,
      metadata: JSON.parse(session.metadata || '{}')
    }));
  }

  async getDailyStats(date, uid) {
    const db = sqliteClient.getDb();
    
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(duration_ms) as total_time_ms,
        AVG(duration_ms) as avg_session_length_ms,
        COUNT(DISTINCT title) as unique_pdfs
      FROM research_sessions
      WHERE uid = ? 
      AND DATE(start_time) = ?
      AND duration_ms IS NOT NULL
    `, [uid, date]);

    return stats;
  }

  async addEvent(eventData) {
    const db = sqliteClient.getDb();
    
    const result = await db.run(`
      INSERT INTO research_events (session_id, uid, event_type, event_data)
      VALUES (?, ?, ?, ?)
    `, [
      eventData.session_id,
      eventData.uid,
      eventData.event_type,
      JSON.stringify(eventData.event_data || {})
    ]);

    return {
      id: result.lastID,
      ...eventData
    };
  }
}

module.exports = new ResearchSqliteRepository();