const express = require('express');
const router = express.Router();

router.get('/timeline', async (req, res) => {
    try {
        const { date, project_id } = req.query;
        
        // Get timeline data from the Electron app
        const timelineData = await req.bridge.invoke('activity:get-timeline', { 
            date: date || new Date().toISOString().split('T')[0],
            projectId: project_id 
        });
        
        res.json(timelineData);
    } catch (error) {
        console.error('Error getting activity timeline:', error);
        res.status(500).json({ error: 'Failed to get activity timeline' });
    }
});

router.get('/productivity-metrics', async (req, res) => {
    try {
        const { date, period = 'daily' } = req.query;
        
        const metrics = await req.bridge.invoke('activity:get-productivity-metrics', { 
            date: date || new Date().toISOString().split('T')[0],
            period 
        });
        
        res.json(metrics);
    } catch (error) {
        console.error('Error getting productivity metrics:', error);
        res.status(500).json({ error: 'Failed to get productivity metrics' });
    }
});

router.get('/weekly-stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const stats = await req.bridge.invoke('activity:get-weekly-stats', { 
            startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: endDate || new Date().toISOString().split('T')[0]
        });
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting weekly stats:', error);
        res.status(500).json({ error: 'Failed to get weekly stats' });
    }
});

router.get('/goals', async (req, res) => {
    try {
        const goals = await req.bridge.invoke('activity:get-goal-progress');
        res.json(goals);
    } catch (error) {
        console.error('Error getting goal progress:', error);
        res.status(500).json({ error: 'Failed to get goal progress' });
    }
});

router.post('/goals', async (req, res) => {
    try {
        const { daily, weekly, monthly } = req.body;
        
        const result = await req.bridge.invoke('activity:set-goals', {
            daily,
            weekly,
            monthly
        });
        
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error setting goals:', error);
        res.status(500).json({ error: 'Failed to set goals' });
    }
});

module.exports = router;