const express = require('express');
const router = express.Router();

// Get current tracking status
router.get('/current', async (req, res) => {
    try {
        const status = await req.bridge.invoke('activity:get-tracking-status');
        res.json(status);
    } catch (error) {
        console.error('Error getting activity status:', error);
        res.status(500).json({ error: 'Failed to get activity status' });
    }
});

// Start activity tracking
router.post('/tracking/start', async (req, res) => {
    try {
        const result = await req.bridge.invoke('activity:start-tracking');
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error starting activity tracking:', error);
        res.status(500).json({ error: 'Failed to start activity tracking' });
    }
});

// Stop activity tracking
router.post('/tracking/stop', async (req, res) => {
    try {
        const result = await req.bridge.invoke('activity:stop-tracking');
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error stopping activity tracking:', error);
        res.status(500).json({ error: 'Failed to stop activity tracking' });
    }
});

// Manual capture and analysis
router.post('/capture', async (req, res) => {
    try {
        const result = await req.bridge.invoke('activity:capture-screenshot');
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
        const insights = await req.bridge.invoke('activity:generate-insights', { timeframe });
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
        const sessions = await req.bridge.invoke('activity:get-activities', { 
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
        const session = await req.bridge.invoke('activity:get-activity-details', { activityId: sessionId });
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
        let stats;
        
        if (timeframe === 'week') {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            stats = await req.bridge.invoke('activity:get-weekly-stats', { 
                startDate: startDate.toISOString().split('T')[0], 
                endDate 
            });
        } else if (timeframe === 'day') {
            const date = new Date().toISOString().split('T')[0];
            stats = await req.bridge.invoke('activity:get-productivity-metrics', { date });
        } else {
            // Default to current period metrics
            const date = new Date().toISOString().split('T')[0];
            stats = await req.bridge.invoke('activity:get-productivity-metrics', { date, period: timeframe });
        }
        
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
        const history = await req.bridge.invoke('activity:get-capture-history', { 
            limit: parseInt(limit)
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
        
        const settings = {
            captureInterval: intervalMinutes * 60 * 1000 // Convert to milliseconds
        };
        
        await req.bridge.invoke('activity:update-settings', settings);
        res.json({ success: true, intervalMinutes });
    } catch (error) {
        console.error('Error updating capture interval:', error);
        res.status(500).json({ error: 'Failed to update capture interval' });
    }
});

// Get AI status
router.get('/ai-status', async (req, res) => {
    try {
        const status = await req.bridge.invoke('activity:get-tracking-status');
        // Extract AI-related status from the tracking status
        const aiStatus = {
            aiEnabled: status.settings?.enableAIAnalysis || false,
            lastAnalysis: status.lastAnalysis,
            analysisAvailable: !!status.lastAnalysis
        };
        res.json(aiStatus);
    } catch (error) {
        console.error('Error getting AI status:', error);
        res.status(500).json({ error: 'Failed to get AI status' });
    }
});

// Get dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const dashboardData = await req.bridge.invoke('activity:get-dashboard-data');
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
        // Note: Activity service doesn't have delete functionality yet
        // This would need to be implemented in the activity service
        res.status(501).json({ error: 'Delete functionality not yet implemented for activities' });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// Export activity data
router.get('/export', async (req, res) => {
    try {
        const { format = 'json', timeframe = 'month' } = req.query;
        
        // Get activities for the specified timeframe
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        
        if (timeframe === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (timeframe === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (timeframe === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }
        
        const activities = await req.bridge.invoke('activity:get-activities', {
            startDate: startDate.toISOString().split('T')[0],
            endDate,
            limit: 1000 // High limit for export
        });
        
        let exportData;
        if (format === 'csv') {
            // Convert to CSV format
            const headers = ['Title', 'Category', 'Start Time', 'End Time', 'Duration (minutes)', 'Status'];
            const csvRows = [headers.join(',')];
            
            activities.activities.forEach(activity => {
                const duration = activity.duration_ms ? Math.round(activity.duration_ms / 60000) : 0;
                const row = [
                    `"${activity.title || ''}"`,
                    `"${activity.category || ''}"`,
                    `"${activity.start_time || ''}"`,
                    `"${activity.end_time || ''}"`,
                    duration,
                    `"${activity.status || ''}"`
                ];
                csvRows.push(row.join(','));
            });
            
            exportData = csvRows.join('\n');
        } else {
            exportData = JSON.stringify(activities, null, 2);
        }
        
        res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="activity-export-${Date.now()}.${format}"`);
        res.send(exportData);
    } catch (error) {
        console.error('Error exporting activity data:', error);
        res.status(500).json({ error: 'Failed to export activity data' });
    }
});

module.exports = router;