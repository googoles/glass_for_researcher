const express = require('express');
const router = express.Router();

// Store Zotero credentials securely
router.post('/zotero', async (req, res) => {
  try {
    const { apiKey, zoteroUserId } = req.body;
    const userId = req.user?.uid || 'anonymous';

    if (!apiKey || !zoteroUserId) {
      return res.status(400).json({
        success: false,
        error: 'API key and Zotero user ID are required'
      });
    }

    // Use IPC bridge to store credentials securely in Electron
    const result = await req.bridge.invokeMainProcess('credentials:store-zotero', {
      userId,
      apiKey,
      zoteroUserId
    });

    res.json(result);
  } catch (error) {
    console.error('Error storing Zotero credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store credentials'
    });
  }
});

// Retrieve Zotero credentials
router.get('/zotero', async (req, res) => {
  try {
    const userId = req.user?.uid || 'anonymous';

    // Use IPC bridge to get credentials securely from Electron
    const result = await req.bridge.invokeMainProcess('credentials:get-zotero', userId);

    if (result.success) {
      // Only return non-sensitive metadata, not the actual credentials
      res.json({
        success: true,
        hasCredentials: true,
        zoteroUserId: result.credentials?.zoteroUserId,
        timestamp: result.credentials?.timestamp
      });
    } else {
      res.json({
        success: true,
        hasCredentials: false
      });
    }
  } catch (error) {
    console.error('Error retrieving Zotero credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve credentials'
    });
  }
});

// Get credentials for API usage (returns actual credentials for authenticated requests)
router.get('/zotero/for-api', async (req, res) => {
  try {
    const userId = req.user?.uid || 'anonymous';

    // Use IPC bridge to get credentials securely from Electron
    const result = await req.bridge.invokeMainProcess('credentials:get-zotero', userId);

    if (result.success && result.credentials) {
      res.json({
        success: true,
        credentials: {
          apiKey: result.credentials.apiKey,
          zoteroUserId: result.credentials.zoteroUserId
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No credentials found'
      });
    }
  } catch (error) {
    console.error('Error retrieving Zotero credentials for API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve credentials'
    });
  }
});

// Remove Zotero credentials
router.delete('/zotero', async (req, res) => {
  try {
    const userId = req.user?.uid || 'anonymous';

    // Use IPC bridge to remove credentials securely from Electron
    const result = await req.bridge.invokeMainProcess('credentials:remove-zotero', userId);

    res.json(result);
  } catch (error) {
    console.error('Error removing Zotero credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove credentials'
    });
  }
});

module.exports = router;