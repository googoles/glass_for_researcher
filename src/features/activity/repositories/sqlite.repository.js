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
}

module.exports = new ActivitySQLiteRepository();