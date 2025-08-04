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

// AI Analysis endpoints

router.get('/analysis/current-score', async (req, res) => {
    try {
        const score = await req.bridge.invoke('research:get-current-productivity-score');
        res.json(score);
    } catch (error) {
        console.error('Error getting current productivity score:', error);
        res.status(500).json({ error: 'Failed to get current productivity score' });
    }
});

router.get('/analysis/history', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const history = await req.bridge.invoke('research:get-analysis-history', { limit: parseInt(limit) });
        res.json(history);
    } catch (error) {
        console.error('Error getting analysis history:', error);
        res.status(500).json({ error: 'Failed to get analysis history' });
    }
});

router.get('/insights/:timeframe', async (req, res) => {
    try {
        const { timeframe } = req.params;
        const insights = await req.bridge.invoke('research:generate-insights', { timeframe });
        res.json(insights);
    } catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

router.get('/analysis/productivity-stats/:timeframe', async (req, res) => {
    try {
        const { timeframe } = req.params;
        const stats = await req.bridge.invoke('research:get-productivity-stats', { timeframe });
        res.json(stats);
    } catch (error) {
        console.error('Error getting productivity stats:', error);
        res.status(500).json({ error: 'Failed to get productivity stats' });
    }
});

router.get('/analysis/app-usage/:appName', async (req, res) => {
    try {
        const { appName } = req.params;
        const analysis = await req.bridge.invoke('research:analyze-app-usage', { appName });
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing app usage:', error);
        res.status(500).json({ error: 'Failed to analyze app usage' });
    }
});

router.post('/analysis/manual-capture', async (req, res) => {
    try {
        const result = await req.bridge.invoke('research:manual-capture-analyze');
        res.json(result);
    } catch (error) {
        console.error('Error performing manual analysis:', error);
        res.status(500).json({ error: 'Failed to perform manual analysis' });
    }
});

router.get('/ai-status', async (req, res) => {
    try {
        const status = await req.bridge.invoke('research:get-ai-status');
        res.json(status);
    } catch (error) {
        console.error('Error getting AI status:', error);
        res.status(500).json({ error: 'Failed to get AI status' });
    }
});

// ========== PROJECT MANAGEMENT ENDPOINTS ==========

router.get('/projects', async (req, res) => {
    try {
        const { status = 'active', limit = 50, offset = 0, sortBy = 'updated_at', sortOrder = 'desc' } = req.query;
        const projects = await req.bridge.invoke('research:get-projects', {
            status,
            limit: parseInt(limit),
            offset: parseInt(offset),
            sortBy,
            sortOrder
        });
        res.json({ success: true, data: projects });
    } catch (error) {
        console.error('Error getting projects:', error);
        res.status(500).json({ error: 'Failed to get projects' });
    }
});

router.post('/projects', async (req, res) => {
    try {
        const projectData = req.body;
        
        // Validate required fields
        if (!projectData.name) {
            return res.status(400).json({ error: 'Project name is required' });
        }
        
        const project = await req.bridge.invoke('research:create-project', projectData);
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

router.get('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await req.bridge.invoke('research:get-project', { projectId });
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json({ success: true, data: project });
    } catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({ error: 'Failed to get project' });
    }
});

router.put('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const updates = req.body;
        
        const project = await req.bridge.invoke('research:update-project', { projectId, updates });
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json({ success: true, data: project });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

router.delete('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const success = await req.bridge.invoke('research:delete-project', { projectId });
        
        if (!success) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

router.post('/projects/:projectId/set-current', async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await req.bridge.invoke('research:set-current-project', { projectId });
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json({ success: true, data: project });
    } catch (error) {
        console.error('Error setting current project:', error);
        res.status(500).json({ error: 'Failed to set current project' });
    }
});

router.get('/projects/:projectId/sessions', async (req, res) => {
    try {
        const { projectId } = req.params;
        const sessions = await req.bridge.invoke('research:get-project-sessions', { projectId });
        res.json({ success: true, data: sessions });
    } catch (error) {
        console.error('Error getting project sessions:', error);
        res.status(500).json({ error: 'Failed to get project sessions' });
    }
});

router.get('/projects/:projectId/analytics', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { timeframe = '7d' } = req.query;
        const analytics = await req.bridge.invoke('research:get-project-analytics', {
            projectId,
            timeframe
        });
        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error('Error getting project analytics:', error);
        res.status(500).json({ error: 'Failed to get project analytics' });
    }
});

router.get('/projects/:projectId/progress', async (req, res) => {
    try {
        const { projectId } = req.params;
        const progress = await req.bridge.invoke('research:get-project-progress', { projectId });
        res.json({ success: true, data: progress });
    } catch (error) {
        console.error('Error getting project progress:', error);
        res.status(500).json({ error: 'Failed to get project progress' });
    }
});

// ========== ZOTERO INTEGRATION ENDPOINTS ==========

router.post('/projects/:projectId/sync-zotero', async (req, res) => {
    try {
        const { projectId } = req.params;
        const zoteroData = await req.bridge.invoke('research:sync-project-zotero', { projectId });
        res.json({ success: true, data: zoteroData });
    } catch (error) {
        console.error('Error syncing with Zotero:', error);
        res.status(500).json({ error: 'Failed to sync with Zotero' });
    }
});

router.post('/projects/:projectId/link-zotero', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { zoteroKey } = req.body;
        
        if (!zoteroKey) {
            return res.status(400).json({ error: 'Zotero key is required' });
        }
        
        const project = await req.bridge.invoke('research:link-project-zotero', {
            projectId,
            zoteroKey
        });
        
        res.json({ success: true, data: project });
    } catch (error) {
        console.error('Error linking project to Zotero:', error);
        res.status(500).json({ error: 'Failed to link project to Zotero' });
    }
});

// ========== ANALYTICS ENDPOINTS ==========

router.get('/analytics', async (req, res) => {
    try {
        const { timeframe = '7d', projectId } = req.query;
        const analytics = await req.bridge.invoke('research:get-analytics', {
            timeframe,
            projectId: projectId || null
        });
        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

router.get('/analytics/productivity-trends', async (req, res) => {
    try {
        const { timeframe = '30d' } = req.query;
        const trends = await req.bridge.invoke('research:get-productivity-trends', { timeframe });
        res.json({ success: true, data: trends });
    } catch (error) {
        console.error('Error getting productivity trends:', error);
        res.status(500).json({ error: 'Failed to get productivity trends' });
    }
});

router.get('/sessions/:sessionId/analytics', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const analytics = await req.bridge.invoke('research:get-session-analytics', { sessionId });
        
        if (!analytics) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error('Error getting session analytics:', error);
        res.status(500).json({ error: 'Failed to get session analytics' });
    }
});

// ========== REAL-TIME UPDATES ENDPOINT ==========

router.get('/updates', async (req, res) => {
    try {
        const { since = 0 } = req.query;
        const updates = await req.bridge.invoke('research:get-recent-updates', {
            since: parseInt(since)
        });
        res.json({ success: true, data: updates });
    } catch (error) {
        console.error('Error getting recent updates:', error);
        res.status(500).json({ error: 'Failed to get recent updates' });
    }
});

// ========== SETTINGS AND CONFIGURATION ==========

router.post('/settings/capture-interval', async (req, res) => {
    try {
        const { intervalMinutes } = req.body;
        
        if (!intervalMinutes || intervalMinutes < 1 || intervalMinutes > 60) {
            return res.status(400).json({ error: 'Interval must be between 1 and 60 minutes' });
        }
        
        await req.bridge.invoke('research:set-capture-interval', { intervalMinutes });
        res.json({ success: true, message: 'Capture interval updated' });
    } catch (error) {
        console.error('Error setting capture interval:', error);
        res.status(500).json({ error: 'Failed to set capture interval' });
    }
});

module.exports = router;