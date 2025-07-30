const sqliteRepository = require('./sqlite.repository');
const firebaseRepository = require('./firebase.repository');
const authService = require('../../common/services/authService');

function getBaseRepository() {
    const user = authService.getCurrentUser();
    if (user && user.isLoggedIn) {
        return firebaseRepository;
    }
    return sqliteRepository;
}

// The adapter layer that injects the UID
const activityRepositoryAdapter = {
    initialize: () => {
        return getBaseRepository().initialize();
    },

    createActivity: (activityData) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().createActivity({ uid, ...activityData });
    },

    updateActivity: (activityId, updates) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().updateActivity(activityId, { uid, ...updates });
    },

    getActivityById: (activityId) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getActivityById(activityId, uid);
    },

    getActivitiesByDate: (date, projectId) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getActivitiesByDate(date, projectId, uid);
    },

    getActivitiesBetweenDates: (startDate, endDate) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getActivitiesBetweenDates(startDate, endDate, uid);
    },

    getGoals: () => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getGoals(uid);
    },

    saveGoals: (goals) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().saveGoals(goals, uid);
    },

    // Settings methods
    getSettings: () => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getSettings(uid);
    },

    saveSettings: (settings) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().saveSettings(settings, uid);
    },

    // Capture data methods
    storeCaptureData: (captureData) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().storeCaptureData(captureData, uid);
    },

    getCaptureData: (limit, offset) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getCaptureData(uid, limit, offset);
    },

    // Analytics methods
    getActivityStats: (startDate, endDate) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getActivityStats(uid, startDate, endDate);
    },

    getProductivityTrends: (days) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getProductivityTrends(uid, days);
    }
};

module.exports = activityRepositoryAdapter;