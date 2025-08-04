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
    },

    // Project management methods
    createProject: (projectData) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().createProject({ uid, ...projectData });
    },

    updateProject: (projectId, projectData) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().updateProject(projectId, { uid, ...projectData });
    },

    getProjectById: (projectId) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getProjectById(projectId, uid);
    },

    getProjects: (options) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getProjects(options, uid);
    },

    getSessionsByProject: (projectId) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getSessionsByProject(projectId, uid);
    },

    getProjectAnalysis: (projectId, days) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getProjectAnalysis(projectId, days, uid);
    },

    getSessionsInRange: (startTime, endTime, projectId) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getSessionsInRange(startTime, endTime, projectId, uid);
    },

    getAnalysisInRange: (startTime, endTime, projectId) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().getAnalysisInRange(startTime, endTime, projectId, uid);
    }
};

module.exports = researchRepositoryAdapter;