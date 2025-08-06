const express = require('express');
const router = express.Router();
const { ipcRequest } = require('../ipcBridge');

router.get('/', async (req, res) => {
    try {
        const { timeRange, limit, offset } = req.query;
        
        // Pass filtering parameters to IPC
        const params = {
            timeRange: timeRange || null,
            limit: limit ? parseInt(limit) : null,
            offset: offset ? parseInt(offset) : null
        };
        
        const sessions = await ipcRequest(req, 'get-sessions', params);
        
        // If backend doesn't support filtering yet, do it client-side as fallback
        if (timeRange && Array.isArray(sessions)) {
            const now = Date.now();
            const timeRangeMs = {
                week: 7 * 24 * 60 * 60 * 1000,
                month: 30 * 24 * 60 * 60 * 1000,
                quarter: 90 * 24 * 60 * 60 * 1000
            };
            
            if (timeRangeMs[timeRange]) {
                const cutoffTime = now - timeRangeMs[timeRange];
                const filtered = sessions.filter(session => 
                    session.started_at * 1000 >= cutoffTime
                );
                
                // Apply limit and offset
                const start = offset ? parseInt(offset) : 0;
                const end = limit ? start + parseInt(limit) : filtered.length;
                
                return res.json(filtered.slice(start, end));
            }
        }
        
        res.json(sessions);
    } catch (error) {
        console.error('Failed to get sessions via IPC:', error);
        res.status(500).json({ error: 'Failed to retrieve sessions' });
    }
});

router.post('/', async (req, res) => {
    try {
        const result = await ipcRequest(req, 'create-session', req.body);
        res.status(201).json({ ...result, message: 'Session created successfully' });
    } catch (error) {
        console.error('Failed to create session via IPC:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

router.get('/:session_id', async (req, res) => {
    try {
        const details = await ipcRequest(req, 'get-session-details', req.params.session_id);
        if (!details) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(details);
    } catch (error) {
        console.error(`Failed to get session details via IPC for ${req.params.session_id}:`, error);
        res.status(500).json({ error: 'Failed to retrieve session details' });
    }
});

router.delete('/:session_id', async (req, res) => {
    try {
        await ipcRequest(req, 'delete-session', req.params.session_id);
        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete session via IPC for ${req.params.session_id}:`, error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// The search functionality will be more complex to move to IPC.
// For now, we can disable it or leave it as is, knowing it's a future task.
router.get('/search', (req, res) => {
    res.status(501).json({ error: 'Search not implemented for IPC bridge yet.' });
});

module.exports = router; 