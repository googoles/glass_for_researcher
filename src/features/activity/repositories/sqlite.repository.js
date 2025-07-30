const sqliteClient = require('../../common/services/sqliteClient');
const { v4: uuidv4 } = require('uuid');

class ActivitySQLiteRepository {
    async initialize() {
        try {
            const db = await sqliteClient.getDatabase();
            
            // Create activities table
            await db.exec(`
                CREATE TABLE IF NOT EXISTS activities (
                    id TEXT PRIMARY KEY,
                    uid TEXT NOT NULL,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'other',
                    start_time TEXT NOT NULL,
                    end_time TEXT,
                    duration_ms INTEGER DEFAULT 0,
                    project_id TEXT,
                    project_name TEXT,
                    status TEXT DEFAULT 'active',
                    metadata TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            `);

            // Create goals table
            await db.exec(`
                CREATE TABLE IF NOT EXISTS activity_goals (
                    id TEXT PRIMARY KEY,
                    uid TEXT NOT NULL UNIQUE,
                    daily_target INTEGER DEFAULT 8,
                    weekly_target INTEGER DEFAULT 40,
                    monthly_target INTEGER DEFAULT 160,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            `);

            // Create indexes
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_activities_uid_date ON activities(uid, start_time);
                CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
                CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
                CREATE INDEX IF NOT EXISTS idx_goals_uid ON activity_goals(uid);
            `);

            console.log('[Activity SQLite Repository] Tables created successfully');
            return true;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to initialize:', error);
            throw error;
        }
    }

    async createActivity(activityData) {
        try {
            const db = await sqliteClient.getDatabase();
            const id = uuidv4();
            const now = new Date().toISOString();

            const activity = {
                id,
                uid: activityData.uid,
                title: activityData.title,
                category: activityData.category || 'other',
                start_time: activityData.start_time,
                end_time: activityData.end_time || null,
                duration_ms: activityData.duration_ms || 0,
                project_id: activityData.project_id || null,
                project_name: activityData.project_name || null,
                status: activityData.status || 'active',
                metadata: activityData.metadata ? JSON.stringify(activityData.metadata) : null,
                created_at: now,
                updated_at: now
            };

            await db.run(`
                INSERT INTO activities (
                    id, uid, title, category, start_time, end_time, duration_ms,
                    project_id, project_name, status, metadata, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                activity.id, activity.uid, activity.title, activity.category,
                activity.start_time, activity.end_time, activity.duration_ms,
                activity.project_id, activity.project_name, activity.status,
                activity.metadata, activity.created_at, activity.updated_at
            ]);

            console.log(`[Activity SQLite Repository] Created activity: ${id}`);
            return activity;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to create activity:', error);
            throw error;
        }
    }

    async updateActivity(activityId, updates) {
        try {
            const db = await sqliteClient.getDatabase();
            const now = new Date().toISOString();

            const setClauses = [];
            const values = [];

            Object.entries(updates).forEach(([key, value]) => {
                if (key !== 'id' && key !== 'created_at') {
                    setClauses.push(`${key} = ?`);
                    values.push(key === 'metadata' && typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : value
                    );
                }
            });

            setClauses.push('updated_at = ?');
            values.push(now, activityId, updates.uid);

            await db.run(`
                UPDATE activities 
                SET ${setClauses.join(', ')} 
                WHERE id = ? AND uid = ?
            `, values);

            console.log(`[Activity SQLite Repository] Updated activity: ${activityId}`);
            return true;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to update activity:', error);
            throw error;
        }
    }

    async getActivityById(activityId, uid) {
        try {
            const db = await sqliteClient.getDatabase();
            const row = await db.get(`
                SELECT * FROM activities 
                WHERE id = ? AND uid = ?
            `, [activityId, uid]);

            if (row && row.metadata) {
                try {
                    row.metadata = JSON.parse(row.metadata);
                } catch (e) {
                    row.metadata = null;
                }
            }

            return row || null;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to get activity:', error);
            throw error;
        }
    }

    async getActivitiesByDate(date, projectId, uid) {
        try {
            const db = await sqliteClient.getDatabase();
            let query = `
                SELECT * FROM activities 
                WHERE uid = ? 
                AND date(start_time) = date(?)
            `;
            const params = [uid, date];

            if (projectId) {
                query += ' AND project_id = ?';
                params.push(projectId);
            }

            query += ' ORDER BY start_time ASC';

            const rows = await db.all(query, params);
            
            return rows.map(row => {
                if (row.metadata) {
                    try {
                        row.metadata = JSON.parse(row.metadata);
                    } catch (e) {
                        row.metadata = null;
                    }
                }
                return row;
            });
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to get activities by date:', error);
            return [];
        }
    }

    async getActivitiesBetweenDates(startDate, endDate, uid) {
        try {
            const db = await sqliteClient.getDatabase();
            const rows = await db.all(`
                SELECT * FROM activities 
                WHERE uid = ? 
                AND date(start_time) >= date(?)
                AND date(start_time) <= date(?)
                ORDER BY start_time ASC
            `, [uid, startDate, endDate]);

            return rows.map(row => {
                if (row.metadata) {
                    try {
                        row.metadata = JSON.parse(row.metadata);
                    } catch (e) {
                        row.metadata = null;
                    }
                }
                return row;
            });
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to get activities between dates:', error);
            return [];
        }
    }

    async getGoals(uid) {
        try {
            const db = await sqliteClient.getDatabase();
            const row = await db.get(`
                SELECT daily_target, weekly_target, monthly_target 
                FROM activity_goals 
                WHERE uid = ?
            `, [uid]);

            if (row) {
                return {
                    daily: row.daily_target,
                    weekly: row.weekly_target,
                    monthly: row.monthly_target
                };
            }

            return null;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to get goals:', error);
            throw error;
        }
    }

    async saveGoals(goals, uid) {
        try {
            const db = await sqliteClient.getDatabase();
            const now = new Date().toISOString();

            await db.run(`
                INSERT OR REPLACE INTO activity_goals (
                    id, uid, daily_target, weekly_target, monthly_target, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                uuidv4(), uid, goals.daily, goals.weekly, goals.monthly, now, now
            ]);

            console.log(`[Activity SQLite Repository] Saved goals for user: ${uid}`);
            return true;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to save goals:', error);
            throw error;
        }
    }

    // Settings Management
    async getSettings(uid) {
        try {
            const db = await sqliteClient.getDatabase();
            const row = await db.get(`
                SELECT capture_interval, enable_ai_analysis, privacy_mode, activity_categories
                FROM activity_settings 
                WHERE uid = ?
            `, [uid]);

            if (row) {
                return {
                    captureInterval: row.capture_interval,
                    enableAIAnalysis: row.enable_ai_analysis === 1,
                    privacyMode: row.privacy_mode === 1,
                    activityCategories: row.activity_categories ? row.activity_categories.split(',') : ['Focus', 'Communication', 'Research', 'Break', 'Creative', 'Other']
                };
            }

            return null;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to get settings:', error);
            throw error;
        }
    }

    async saveSettings(settings, uid) {
        try {
            const db = await sqliteClient.getDatabase();
            const now = new Date().toISOString();

            await db.run(`
                INSERT OR REPLACE INTO activity_settings (
                    id, uid, capture_interval, enable_ai_analysis, privacy_mode, activity_categories, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                uuidv4(), uid, 
                settings.captureInterval || 900000,
                settings.enableAIAnalysis ? 1 : 0,
                settings.privacyMode ? 1 : 0,
                Array.isArray(settings.activityCategories) ? settings.activityCategories.join(',') : 'Focus,Communication,Research,Break,Creative,Other',
                now, now
            ]);

            console.log(`[Activity SQLite Repository] Saved settings for user: ${uid}`);
            return true;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to save settings:', error);
            throw error;
        }
    }

    // Capture Data Storage
    async storeCaptureData(captureData, uid) {
        try {
            const db = await sqliteClient.getDatabase();
            const id = uuidv4();
            const now = new Date().toISOString();

            await db.run(`
                INSERT INTO activity_captures (
                    id, uid, timestamp, screenshot_hash, analysis_category, analysis_confidence,
                    productivity_indicator, distraction_level, primary_application, content_type,
                    metadata, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, uid, captureData.timestamp, captureData.screenshot_hash,
                captureData.analysis_summary?.category || null,
                captureData.analysis_summary?.confidence || null,
                captureData.analysis_summary?.productivity_indicator || null,
                captureData.metadata?.distraction_level || null,
                captureData.metadata?.primary_application || null,
                captureData.metadata?.content_type || null,
                JSON.stringify(captureData.metadata || {}),
                now
            ]);

            console.log(`[Activity SQLite Repository] Stored capture data: ${id}`);
            return { id, ...captureData };
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to store capture data:', error);
            throw error;
        }
    }

    async getCaptureData(uid, limit = 50, offset = 0) {
        try {
            const db = await sqliteClient.getDatabase();
            const rows = await db.all(`
                SELECT * FROM activity_captures 
                WHERE uid = ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            `, [uid, limit, offset]);

            return rows.map(row => {
                if (row.metadata) {
                    try {
                        row.metadata = JSON.parse(row.metadata);
                    } catch (e) {
                        row.metadata = {};
                    }
                }
                return row;
            });
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to get capture data:', error);
            return [];
        }
    }

    // Analytics and Insights
    async getActivityStats(uid, startDate, endDate) {
        try {
            const db = await sqliteClient.getDatabase();
            const rows = await db.all(`
                SELECT 
                    category,
                    COUNT(*) as activity_count,
                    SUM(duration_ms) as total_duration,
                    AVG(duration_ms) as avg_duration
                FROM activities 
                WHERE uid = ? 
                AND date(start_time) >= date(?)
                AND date(start_time) <= date(?)
                GROUP BY category
            `, [uid, startDate, endDate]);

            return rows;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to get activity stats:', error);
            return [];
        }
    }

    async getProductivityTrends(uid, days = 7) {
        try {
            const db = await sqliteClient.getDatabase();
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const rows = await db.all(`
                SELECT 
                    date(timestamp) as capture_date,
                    analysis_category,
                    productivity_indicator,
                    COUNT(*) as capture_count
                FROM activity_captures 
                WHERE uid = ? 
                AND date(timestamp) >= date(?)
                AND date(timestamp) <= date(?)
                GROUP BY date(timestamp), analysis_category, productivity_indicator
                ORDER BY capture_date DESC
            `, [uid, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

            return rows;
        } catch (error) {
            console.error('[Activity SQLite Repository] Failed to get productivity trends:', error);
            return [];
        }
    }
}

module.exports = new ActivitySQLiteRepository();