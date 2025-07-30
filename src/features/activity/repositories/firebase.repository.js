const firebaseClient = require('../../common/services/firebaseClient');
const { v4: uuidv4 } = require('uuid');

class ActivityFirebaseRepository {
    constructor() {
        this.firestore = null;
    }

    async initialize() {
        try {
            this.firestore = await firebaseClient.getFirestore();
            console.log('[Activity Firebase Repository] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to initialize:', error);
            throw error;
        }
    }

    async createActivity(activityData) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

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
                metadata: activityData.metadata || null,
                created_at: now,
                updated_at: now
            };

            await this.firestore
                .collection('activities')
                .doc(id)
                .set(activity);

            console.log(`[Activity Firebase Repository] Created activity: ${id}`);
            return activity;
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to create activity:', error);
            throw error;
        }
    }

    async updateActivity(activityId, updates) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const updateData = { ...updates };
            delete updateData.id;
            delete updateData.created_at;
            updateData.updated_at = new Date().toISOString();

            await this.firestore
                .collection('activities')
                .doc(activityId)
                .update(updateData);

            console.log(`[Activity Firebase Repository] Updated activity: ${activityId}`);
            return true;
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to update activity:', error);
            throw error;
        }
    }

    async getActivityById(activityId, uid) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const doc = await this.firestore
                .collection('activities')
                .doc(activityId)
                .get();

            if (doc.exists && doc.data().uid === uid) {
                return doc.data();
            }

            return null;
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to get activity:', error);
            throw error;
        }
    }

    async getActivitiesByDate(date, projectId, uid) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            let query = this.firestore
                .collection('activities')
                .where('uid', '==', uid)
                .where('start_time', '>=', startOfDay.toISOString())
                .where('start_time', '<=', endOfDay.toISOString());

            if (projectId) {
                query = query.where('project_id', '==', projectId);
            }

            const snapshot = await query
                .orderBy('start_time', 'asc')
                .get();

            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to get activities by date:', error);
            return [];
        }
    }

    async getActivitiesBetweenDates(startDate, endDate, uid) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const snapshot = await this.firestore
                .collection('activities')
                .where('uid', '==', uid)
                .where('start_time', '>=', start.toISOString())
                .where('start_time', '<=', end.toISOString())
                .orderBy('start_time', 'asc')
                .get();

            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to get activities between dates:', error);
            return [];
        }
    }

    async getGoals(uid) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const doc = await this.firestore
                .collection('activity_goals')
                .doc(uid)
                .get();

            if (doc.exists) {
                const data = doc.data();
                return {
                    daily: data.daily_target,
                    weekly: data.weekly_target,
                    monthly: data.monthly_target
                };
            }

            return null;
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to get goals:', error);
            throw error;
        }
    }

    async saveGoals(goals, uid) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const now = new Date().toISOString();

            await this.firestore
                .collection('activity_goals')
                .doc(uid)
                .set({
                    uid,
                    daily_target: goals.daily,
                    weekly_target: goals.weekly,
                    monthly_target: goals.monthly,
                    created_at: now,
                    updated_at: now
                }, { merge: true });

            console.log(`[Activity Firebase Repository] Saved goals for user: ${uid}`);
            return true;
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to save goals:', error);
            throw error;
        }
    }

    // Settings Management
    async getSettings(uid) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const doc = await this.firestore
                .collection('activity_settings')
                .doc(uid)
                .get();

            if (doc.exists) {
                const data = doc.data();
                return {
                    captureInterval: data.capture_interval,
                    enableAIAnalysis: data.enable_ai_analysis,
                    privacyMode: data.privacy_mode,
                    activityCategories: data.activity_categories || ['Focus', 'Communication', 'Research', 'Break', 'Creative', 'Other']
                };
            }

            return null;
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to get settings:', error);
            throw error;
        }
    }

    async saveSettings(settings, uid) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const now = new Date().toISOString();

            await this.firestore
                .collection('activity_settings')
                .doc(uid)
                .set({
                    uid,
                    capture_interval: settings.captureInterval || 900000,
                    enable_ai_analysis: settings.enableAIAnalysis !== false,
                    privacy_mode: settings.privacyMode === true,
                    activity_categories: settings.activityCategories || ['Focus', 'Communication', 'Research', 'Break', 'Creative', 'Other'],
                    created_at: now,
                    updated_at: now
                }, { merge: true });

            console.log(`[Activity Firebase Repository] Saved settings for user: ${uid}`);
            return true;
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to save settings:', error);
            throw error;
        }
    }

    // Capture Data Storage
    async storeCaptureData(captureData, uid) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const id = uuidv4();
            const now = new Date().toISOString();

            const data = {
                id,
                uid,
                timestamp: captureData.timestamp,
                screenshot_hash: captureData.screenshot_hash,
                analysis_category: captureData.analysis_summary?.category || null,
                analysis_confidence: captureData.analysis_summary?.confidence || null,
                productivity_indicator: captureData.analysis_summary?.productivity_indicator || null,
                distraction_level: captureData.metadata?.distraction_level || null,
                primary_application: captureData.metadata?.primary_application || null,
                content_type: captureData.metadata?.content_type || null,
                metadata: captureData.metadata || {},
                created_at: now
            };

            await this.firestore
                .collection('activity_captures')
                .doc(id)
                .set(data);

            console.log(`[Activity Firebase Repository] Stored capture data: ${id}`);
            return { id, ...captureData };
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to store capture data:', error);
            throw error;
        }
    }

    async getCaptureData(uid, limit = 50, offset = 0) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const snapshot = await this.firestore
                .collection('activity_captures')
                .where('uid', '==', uid)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .offset(offset)
                .get();

            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to get capture data:', error);
            return [];
        }
    }

    // Analytics and Insights
    async getActivityStats(uid, startDate, endDate) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const snapshot = await this.firestore
                .collection('activities')
                .where('uid', '==', uid)
                .where('start_time', '>=', start.toISOString())
                .where('start_time', '<=', end.toISOString())
                .get();

            const activities = snapshot.docs.map(doc => doc.data());
            const categoryStats = {};

            activities.forEach(activity => {
                const category = activity.category;
                if (!categoryStats[category]) {
                    categoryStats[category] = {
                        activity_count: 0,
                        total_duration: 0,
                        avg_duration: 0
                    };
                }
                categoryStats[category].activity_count += 1;
                categoryStats[category].total_duration += activity.duration_ms || 0;
            });

            // Calculate averages
            Object.keys(categoryStats).forEach(category => {
                const stats = categoryStats[category];
                stats.avg_duration = stats.activity_count > 0 
                    ? stats.total_duration / stats.activity_count 
                    : 0;
            });

            return Object.entries(categoryStats).map(([category, stats]) => ({
                category,
                ...stats
            }));
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to get activity stats:', error);
            return [];
        }
    }

    async getProductivityTrends(uid, days = 7) {
        try {
            if (!this.firestore) {
                throw new Error('Firestore not initialized');
            }

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const snapshot = await this.firestore
                .collection('activity_captures')
                .where('uid', '==', uid)
                .where('timestamp', '>=', startDate.toISOString())
                .where('timestamp', '<=', endDate.toISOString())
                .orderBy('timestamp', 'desc')
                .get();

            const captures = snapshot.docs.map(doc => doc.data());
            const trendData = {};

            captures.forEach(capture => {
                const date = new Date(capture.timestamp).toISOString().split('T')[0];
                const key = `${date}_${capture.analysis_category}_${capture.productivity_indicator}`;
                
                if (!trendData[key]) {
                    trendData[key] = {
                        capture_date: date,
                        analysis_category: capture.analysis_category,
                        productivity_indicator: capture.productivity_indicator,
                        capture_count: 0
                    };
                }
                trendData[key].capture_count += 1;
            });

            return Object.values(trendData);
        } catch (error) {
            console.error('[Activity Firebase Repository] Failed to get productivity trends:', error);
            return [];
        }
    }
}

module.exports = new ActivityFirebaseRepository();