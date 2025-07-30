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
const researchRepositoryAdapter = {
    initialize: () => {
        return getBaseRepository().initialize();
    },

    createSession: (sessionData) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().createSession({ uid, ...sessionData });
    },

    updateSession: (sessionId, updates) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().updateSession(sessionId, { uid, ...updates });
    },

    getSessionById: (sessionId) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getSessionById(sessionId, uid);
    },

    getSessions: (limit, offset) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getSessions(limit, offset, uid);
    },

    getRecentSessions: (limit) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getRecentSessions(limit, uid);
    },

    getDailyStats: (date) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getDailyStats(date, uid);
    },

    // AI Analysis methods
    createAnalysis: (analysisData) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().createAnalysis({ uid, ...analysisData });
    },

    getSessionAnalysis: (sessionId) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getSessionAnalysis(sessionId, uid);
    },

    getRecentAnalysis: (hours) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getRecentAnalysis(hours, uid);
    },

    getProductivityStats: (timeframe) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getProductivityStats(timeframe, uid);
    },

    storeInsights: (insightData) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().storeInsights({ uid, ...insightData });
    },

    getCachedInsights: (insightType, timeframe) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getCachedInsights(insightType, timeframe, uid);
    }
};

module.exports = researchRepositoryAdapter;