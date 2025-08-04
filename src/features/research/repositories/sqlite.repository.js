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

    // Create analysis table for AI-generated insights
    db.exec(`
      CREATE TABLE IF NOT EXISTS research_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        uid TEXT,
        timestamp DATETIME NOT NULL,
        productivity_score REAL DEFAULT 0,
        activity_type TEXT,
        applications TEXT DEFAULT '[]',
        focus_quality TEXT,
        raw_analysis TEXT,
        confidence_score REAL DEFAULT 0,
        categories TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES research_sessions (id) ON DELETE CASCADE
      )
    `);

    // Create insights table for generated recommendations
    db.exec(`
      CREATE TABLE IF NOT EXISTS research_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        insight_type TEXT NOT NULL,
        timeframe TEXT DEFAULT '24h',
        data_points INTEGER DEFAULT 0,
        insights_data TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )
    `);

    // Create projects table for project management
    db.exec(`
      CREATE TABLE IF NOT EXISTS research_projects (
        id TEXT PRIMARY KEY,
        uid TEXT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'active',
        tags TEXT DEFAULT '[]',
        zotero_key TEXT,
        metadata TEXT DEFAULT '{}',
        goals TEXT DEFAULT '[]',
        deadline DATETIME,
        priority TEXT DEFAULT 'medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add project_id to research_sessions if it doesn't exist
    try {
      db.exec(`ALTER TABLE research_sessions ADD COLUMN project_id TEXT`);
    } catch (error) {
      // Column already exists, ignore
    }

    console.log('[Research SQLite Repository] Tables created/verified');
    
    // Clean expired insights on initialization
    try {
      await this.cleanExpiredInsights();
    } catch (error) {
      console.warn('[Research SQLite Repository] Failed to clean expired insights:', error);
    }
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

  /**
   * Store AI analysis results
   */
  async createAnalysis(analysisData) {
    const db = sqliteClient.getDb();
    
    const result = await db.run(`
      INSERT INTO research_analysis (
        session_id, uid, timestamp, productivity_score, activity_type,
        applications, focus_quality, raw_analysis, confidence_score,
        categories, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      analysisData.session_id,
      analysisData.uid,
      analysisData.timestamp,
      analysisData.productivity_score || 0,
      analysisData.activity_type || 'unknown',
      analysisData.applications || '[]',
      analysisData.focus_quality || 'unknown',
      analysisData.raw_analysis || '',
      analysisData.confidence_score || 0,
      analysisData.categories || '[]',
      analysisData.tags || '[]'
    ]);

    return {
      id: result.lastID,
      ...analysisData
    };
  }

  /**
   * Get analysis data for a session
   */
  async getSessionAnalysis(sessionId, uid) {
    const db = sqliteClient.getDb();
    
    const analyses = await db.all(`
      SELECT * FROM research_analysis
      WHERE session_id = ? AND uid = ?
      ORDER BY timestamp ASC
    `, [sessionId, uid]);

    return analyses.map(analysis => ({
      ...analysis,
      applications: JSON.parse(analysis.applications || '[]'),
      categories: JSON.parse(analysis.categories || '[]'),
      tags: JSON.parse(analysis.tags || '[]')
    }));
  }

  /**
   * Get recent analysis data for insights
   */
  async getRecentAnalysis(hours = 24, uid) {
    const db = sqliteClient.getDb();
    
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    const analyses = await db.all(`
      SELECT * FROM research_analysis
      WHERE uid = ? AND timestamp >= ?
      ORDER BY timestamp DESC
    `, [uid, cutoffTime]);

    return analyses.map(analysis => ({
      ...analysis,
      applications: JSON.parse(analysis.applications || '[]'),
      categories: JSON.parse(analysis.categories || '[]'),
      tags: JSON.parse(analysis.tags || '[]')
    }));
  }

  /**
   * Get productivity statistics
   */
  async getProductivityStats(timeframe, uid) {
    const db = sqliteClient.getDb();
    
    let cutoffTime;
    switch (timeframe) {
      case '1h': cutoffTime = new Date(Date.now() - (60 * 60 * 1000)); break;
      case '24h': cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); break;
      case '7d': cutoffTime = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); break;
      default: cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000));
    }

    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_analyses,
        AVG(productivity_score) as avg_productivity,
        MAX(productivity_score) as max_productivity,
        MIN(productivity_score) as min_productivity,
        AVG(confidence_score) as avg_confidence
      FROM research_analysis
      WHERE uid = ? AND timestamp >= ?
    `, [uid, cutoffTime.toISOString()]);

    return stats;
  }

  /**
   * Store generated insights
   */
  async storeInsights(insightData) {
    const db = sqliteClient.getDb();
    
    // Calculate expiration time (insights valid for 4 hours)
    const expiresAt = new Date(Date.now() + (4 * 60 * 60 * 1000)).toISOString();
    
    const result = await db.run(`
      INSERT INTO research_insights (
        uid, insight_type, timeframe, data_points, insights_data, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      insightData.uid,
      insightData.insight_type || 'general',
      insightData.timeframe || '24h',
      insightData.data_points || 0,
      JSON.stringify(insightData.insights_data),
      expiresAt
    ]);

    return {
      id: result.lastID,
      ...insightData,
      expires_at: expiresAt
    };
  }

  /**
   * Get cached insights if still valid
   */
  async getCachedInsights(insightType, timeframe, uid) {
    const db = sqliteClient.getDb();
    
    const insight = await db.get(`
      SELECT * FROM research_insights
      WHERE uid = ? AND insight_type = ? AND timeframe = ?
        AND expires_at > datetime('now')
      ORDER BY generated_at DESC
      LIMIT 1
    `, [uid, insightType, timeframe]);

    if (insight) {
      return {
        ...insight,
        insights_data: JSON.parse(insight.insights_data)
      };
    }

    return null;
  }

  /**
   * Clean expired insights
   */
  async cleanExpiredInsights() {
    const db = sqliteClient.getDb();
    
    await db.run(`
      DELETE FROM research_insights
      WHERE expires_at <= datetime('now')
    `);
  }

  // ========== PROJECT MANAGEMENT METHODS ==========

  async createProject(projectData) {
    const db = sqliteClient.getDb();
    
    const result = await db.run(`
      INSERT INTO research_projects (
        id, uid, name, description, status, tags, zotero_key,
        metadata, goals, deadline, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      projectData.id,
      projectData.uid,
      projectData.name,
      projectData.description || '',
      projectData.status || 'active',
      JSON.stringify(projectData.tags || []),
      projectData.zotero_key || null,
      JSON.stringify(projectData.metadata || {}),
      JSON.stringify(projectData.goals || []),
      projectData.deadline || null,
      projectData.priority || 'medium'
    ]);

    return {
      ...projectData,
      tags: projectData.tags || [],
      metadata: projectData.metadata || {},
      goals: projectData.goals || []
    };
  }

  async updateProject(projectId, projectData) {
    const db = sqliteClient.getDb();
    
    const fields = [];
    const params = [];

    // Only update provided fields
    if (projectData.name !== undefined) {
      fields.push('name = ?');
      params.push(projectData.name);
    }
    if (projectData.description !== undefined) {
      fields.push('description = ?');
      params.push(projectData.description);
    }
    if (projectData.status !== undefined) {
      fields.push('status = ?');
      params.push(projectData.status);
    }
    if (projectData.tags !== undefined) {
      fields.push('tags = ?');
      params.push(JSON.stringify(projectData.tags));
    }
    if (projectData.zotero_key !== undefined) {
      fields.push('zotero_key = ?');
      params.push(projectData.zotero_key);
    }
    if (projectData.metadata !== undefined) {
      fields.push('metadata = ?');
      params.push(JSON.stringify(projectData.metadata));
    }
    if (projectData.goals !== undefined) {
      fields.push('goals = ?');
      params.push(JSON.stringify(projectData.goals));
    }
    if (projectData.deadline !== undefined) {
      fields.push('deadline = ?');
      params.push(projectData.deadline);
    }
    if (projectData.priority !== undefined) {
      fields.push('priority = ?');
      params.push(projectData.priority);
    }

    // Always update the updated_at timestamp
    fields.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(projectId);
    params.push(projectData.uid);

    await db.run(`
      UPDATE research_projects
      SET ${fields.join(', ')}
      WHERE id = ? AND uid = ?
    `, params);

    return await this.getProjectById(projectId, projectData.uid);
  }

  async getProjectById(projectId, uid) {
    const db = sqliteClient.getDb();
    
    const project = await db.get(`
      SELECT * FROM research_projects
      WHERE id = ? AND uid = ?
    `, [projectId, uid]);

    if (project) {
      return {
        ...project,
        tags: JSON.parse(project.tags || '[]'),
        metadata: JSON.parse(project.metadata || '{}'),
        goals: JSON.parse(project.goals || '[]')
      };
    }

    return null;
  }

  async getProjects(options = {}, uid) {
    const db = sqliteClient.getDb();
    
    const {
      status = 'active',
      limit = 50,
      offset = 0,
      sortBy = 'updated_at',
      sortOrder = 'desc'
    } = options;

    let query = `
      SELECT * FROM research_projects
      WHERE uid = ?
    `;
    const params = [uid];

    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const projects = await db.all(query, params);

    return projects.map(project => ({
      ...project,
      tags: JSON.parse(project.tags || '[]'),
      metadata: JSON.parse(project.metadata || '{}'),
      goals: JSON.parse(project.goals || '[]')
    }));
  }

  async getSessionsByProject(projectId, uid) {
    const db = sqliteClient.getDb();
    
    const sessions = await db.all(`
      SELECT * FROM research_sessions
      WHERE project_id = ? AND uid = ?
      ORDER BY start_time DESC
    `, [projectId, uid]);

    return sessions.map(session => ({
      ...session,
      metadata: JSON.parse(session.metadata || '{}')
    }));
  }

  async getProjectAnalysis(projectId, days = 7, uid) {
    const db = sqliteClient.getDb();
    
    const cutoffTime = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
    
    const analyses = await db.all(`
      SELECT ra.* FROM research_analysis ra
      JOIN research_sessions rs ON ra.session_id = rs.id
      WHERE rs.project_id = ? AND ra.uid = ? AND ra.timestamp >= ?
      ORDER BY ra.timestamp DESC
    `, [projectId, uid, cutoffTime]);

    return analyses.map(analysis => ({
      ...analysis,
      applications: JSON.parse(analysis.applications || '[]'),
      categories: JSON.parse(analysis.categories || '[]'),
      tags: JSON.parse(analysis.tags || '[]')
    }));
  }

  async getSessionsInRange(startTime, endTime, projectId = null, uid) {
    const db = sqliteClient.getDb();
    
    let query = `
      SELECT * FROM research_sessions
      WHERE uid = ? AND start_time >= ? AND start_time <= ?
    `;
    const params = [uid, startTime, endTime];

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }

    query += ' ORDER BY start_time DESC';

    const sessions = await db.all(query, params);

    return sessions.map(session => ({
      ...session,
      metadata: JSON.parse(session.metadata || '{}')
    }));
  }

  async getAnalysisInRange(startTime, endTime, projectId = null, uid) {
    const db = sqliteClient.getDb();
    
    let query = `
      SELECT ra.* FROM research_analysis ra
    `;
    
    if (projectId) {
      query += `
        JOIN research_sessions rs ON ra.session_id = rs.id
        WHERE ra.uid = ? AND ra.timestamp >= ? AND ra.timestamp <= ?
        AND rs.project_id = ?
      `;
    } else {
      query += `
        WHERE ra.uid = ? AND ra.timestamp >= ? AND ra.timestamp <= ?
      `;
    }

    query += ' ORDER BY ra.timestamp DESC';

    const params = projectId 
      ? [uid, startTime, endTime, projectId]
      : [uid, startTime, endTime];

    const analyses = await db.all(query, params);

    return analyses.map(analysis => ({
      ...analysis,
      applications: JSON.parse(analysis.applications || '[]'),
      categories: JSON.parse(analysis.categories || '[]'),
      tags: JSON.parse(analysis.tags || '[]')
    }));
  }
}

module.exports = new ResearchSqliteRepository();