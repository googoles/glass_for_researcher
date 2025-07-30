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
}

module.exports = new ActivityFirebaseRepository();