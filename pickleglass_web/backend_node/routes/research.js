const express = require('express');
const router = express.Router();

router.get('/status', async (req, res) => {
    try {
        const status = await req.bridge.invoke('research:get-status');
        res.json(status);
    } catch (error) {
        console.error('Error getting research status:', error);
        res.status(500).json({ error: 'Failed to get research status' });
    }
});

router.get('/dashboard', async (req, res) => {
    try {
        const dashboardData = await req.bridge.invoke('research:get-dashboard-data');
        res.json(dashboardData);
    } catch (error) {
        console.error('Error getting research dashboard data:', error);
        res.status(500).json({ error: 'Failed to get research dashboard data' });
    }
});

router.post('/start', async (req, res) => {
    try {
        const result = await req.bridge.invoke('research:start-tracking');
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error starting research tracking:', error);
        res.status(500).json({ error: 'Failed to start research tracking' });
    }
});

router.post('/stop', async (req, res) => {
    try {
        const result = await req.bridge.invoke('research:stop-tracking');
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error stopping research tracking:', error);
        res.status(500).json({ error: 'Failed to stop research tracking' });
    }
});

router.get('/sessions', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const sessions = await req.bridge.invoke('research:get-sessions', { limit: parseInt(limit), offset: parseInt(offset) });
        res.json(sessions);
    } catch (error) {
        console.error('Error getting research sessions:', error);
        res.status(500).json({ error: 'Failed to get research sessions' });
    }
});

router.get('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await req.bridge.invoke('research:get-session-details', { sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        console.error('Error getting session details:', error);
        res.status(500).json({ error: 'Failed to get session details' });
    }
});

router.get('/stats/daily', async (req, res) => {
    try {
        const { date } = req.query;
        const stats = await req.bridge.invoke('research:get-daily-stats', { date });
        res.json(stats);
    } catch (error) {
        console.error('Error getting daily stats:', error);
        res.status(500).json({ error: 'Failed to get daily stats' });
    }
});

router.get('/stats/weekly', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await req.bridge.invoke('research:get-weekly-stats', { startDate, endDate });
        res.json(stats);
    } catch (error) {
        console.error('Error getting weekly stats:', error);
        res.status(500).json({ error: 'Failed to get weekly stats' });
    }
});

router.get('/pdfs', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const pdfs = await req.bridge.invoke('research:get-pdf-list', { limit: parseInt(limit), offset: parseInt(offset) });
        res.json(pdfs);
    } catch (error) {
        console.error('Error getting PDF list:', error);
        res.status(500).json({ error: 'Failed to get PDF list' });
    }
});

module.exports = router;