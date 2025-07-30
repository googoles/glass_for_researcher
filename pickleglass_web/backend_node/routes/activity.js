const express = require('express');
const router = express.Router();

// Get current tracking status
router.get('/current', async (req, res) => {
    try {
        const status = await req.bridge.invoke('research:get-status');
        res.json(status);
    } catch (error) {
        console.error('Error getting activity status:', error);
        res.status(500).json({ error: 'Failed to get activity status' });
    }
});

// Start activity tracking
router.post('/tracking/start', async (req, res) => {
    try {
        const result = await req.bridge.invoke('research:start-tracking');
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error starting activity tracking:', error);
        res.status(500).json({ error: 'Failed to start activity tracking' });
    }
});

// Stop activity tracking
router.post('/tracking/stop', async (req, res) => {
    try {
        const result = await req.bridge.invoke('research:stop-tracking');
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error stopping activity tracking:', error);
        res.status(500).json({ error: 'Failed to stop activity tracking' });
    }
});

// Manual capture and analysis
router.post('/capture', async (req, res) => {
    try {
        const result = await req.bridge.invoke('research:manual-capture-analyze');
        res.json(result);
    } catch (error) {
        console.error('Error performing manual capture:', error);
        res.status(500).json({ error: 'Failed to perform manual capture' });
    }
});

// Get activity insights
router.get('/insights', async (req, res) => {
    try {
        const { timeframe = 'week' } = req.query;
        const insights = await req.bridge.invoke('research:generate-insights', { timeframe });
        res.json(insights);
    } catch (error) {
        console.error('Error generating activity insights:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

// Get activity sessions
router.get('/sessions', async (req, res) => {
    try {
        const { limit = 50, offset = 0, sessionType } = req.query;
        const sessions = await req.bridge.invoke('research:get-sessions', { 
            limit: parseInt(limit), 
            offset: parseInt(offset),
            sessionType 
        });
        res.json(sessions);
    } catch (error) {
        console.error('Error getting activity sessions:', error);
        res.status(500).json({ error: 'Failed to get activity sessions' });
    }
});

// Get session details
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

// Get productivity statistics
router.get('/stats/:timeframe', async (req, res) => {
    try {
        const { timeframe } = req.params;
        const stats = await req.bridge.invoke('research:get-productivity-stats', { timeframe });
        res.json(stats);
    } catch (error) {
        console.error('Error getting productivity stats:', error);
        res.status(500).json({ error: 'Failed to get productivity stats' });
    }
});

// Get analysis history
router.get('/analysis/history', async (req, res) => {
    try {
        const { limit = 100, timeframe = 'week' } = req.query;
        const history = await req.bridge.invoke('research:get-analysis-history', { 
            limit: parseInt(limit), 
            timeframe 
        });
        res.json(history);
    } catch (error) {
        console.error('Error getting analysis history:', error);
        res.status(500).json({ error: 'Failed to get analysis history' });
    }
});

// Update tracking settings
router.post('/settings/capture-interval', async (req, res) => {
    try {
        const { intervalMinutes } = req.body;
        if (!intervalMinutes || intervalMinutes < 1 || intervalMinutes > 60) {
            return res.status(400).json({ error: 'Invalid interval. Must be between 1-60 minutes.' });
        }
        
        await req.bridge.invoke('research:set-capture-interval', { intervalMinutes });
        res.json({ success: true, intervalMinutes });
    } catch (error) {
        console.error('Error updating capture interval:', error);
        res.status(500).json({ error: 'Failed to update capture interval' });
    }
});

// Get AI status
router.get('/ai-status', async (req, res) => {
    try {
        const status = await req.bridge.invoke('research:get-ai-status');
        res.json(status);
    } catch (error) {
        console.error('Error getting AI status:', error);
        res.status(500).json({ error: 'Failed to get AI status' });
    }
});

// Get dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const dashboardData = await req.bridge.invoke('research:get-dashboard-data');
        res.json(dashboardData);
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

// Delete activity session
router.delete('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await req.bridge.invoke('research:delete-session', { sessionId });
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// Export activity data
router.get('/export', async (req, res) => {
    try {
        const { format = 'json', timeframe = 'month' } = req.query;
        const exportData = await req.bridge.invoke('research:export-data', { format, timeframe });
        
        res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="activity-export-${Date.now()}.${format}"`);
        res.send(exportData);
    } catch (error) {
        console.error('Error exporting activity data:', error);
        res.status(500).json({ error: 'Failed to export activity data' });
    }
});

module.exports = router;