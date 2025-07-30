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
    }
};

module.exports = activityRepositoryAdapter;