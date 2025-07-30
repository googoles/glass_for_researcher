// try {
//     const reloader = require('electron-reloader');
//     reloader(module, {
//     });
// } catch (err) {
// }

require('dotenv').config();

if (require('electron-squirrel-startup')) {
    process.exit(0);
}

const { app, BrowserWindow, shell, ipcMain, dialog, desktopCapturer, session } = require('electron');
const { createWindows } = require('./window/windowManager.js');
const listenService = require('./features/listen/listenService');
const { initializeFirebase } = require('./features/common/services/firebaseClient');
const databaseInitializer = require('./features/common/services/databaseInitializer');
const authService = require('./features/common/services/authService');
const path = require('node:path');
const express = require('express');
const fetch = require('node-fetch');
const { autoUpdater } = require('electron-updater');
const { EventEmitter } = require('events');
const askService = require('./features/ask/askService');
const settingsService = require('./features/settings/settingsService');
const sessionRepository = require('./features/common/repositories/session');
const modelStateService = require('./features/common/services/modelStateService');
const featureBridge = require('./bridge/featureBridge');
const windowBridge = require('./bridge/windowBridge');

// Global variables
const eventBridge = new EventEmitter();
let WEB_PORT = 3000;
let isShuttingDown = false; // Flag to prevent infinite shutdown loop

//////// after_modelStateService ////////
global.modelStateService = modelStateService;
//////// after_modelStateService ////////

// Import and initialize OllamaService
const ollamaService = require('./features/common/services/ollamaService');
const ollamaModelRepository = require('./features/common/repositories/ollamaModel');

// Native deep link handling - cross-platform compatible
let pendingDeepLinkUrl = null;

function setupProtocolHandling() {
    // Protocol registration - must be done before app is ready
    const protocolName = 'pickleglass';
    
    try {
        // Register the protocol with Electron
        if (process.platform === 'win32' || process.platform === 'linux') {
            app.setAsDefaultProtocolClient(protocolName);
        } else if (process.platform === 'darwin') {
            app.setAsDefaultProtocolClient(protocolName);
        }
        
        console.log(`[Protocol] Protocol '${protocolName}' registered successfully`);
    } catch (error) {
        console.error('[Protocol] Failed to register protocol:', error);
    }

    // Check if we were launched with a protocol URL
    // For Windows and Linux, check process.argv
    if (process.platform === 'win32' || process.platform === 'linux') {
        for (let i = 1; i < process.argv.length; i++) {
            const arg = process.argv[i];
            if (arg && arg.startsWith(`${protocolName}://`)) {
                console.log('[Protocol] Found protocol URL in process.argv:', arg);
                pendingDeepLinkUrl = arg;
                break;
            }
        }
    }
    
    // For macOS, the URL will come through 'open-url' event
    // but we still check argv for consistency
    if (process.platform === 'darwin') {
        for (let i = 1; i < process.argv.length; i++) {
            const arg = process.argv[i];
            // Clean up the URL by removing problematic characters (korean characters issue...)
            const cleanUrl = arg.replace(/[\\₩]/g, '');
            
            if (!cleanUrl.includes(':') || cleanUrl.indexOf('://') === cleanUrl.lastIndexOf(':')) {
                console.log('[Protocol] Found protocol URL in initial arguments:', cleanUrl);
                pendingDeepLinkUrl = cleanUrl;
                break;
            }
        }
    }
    
    console.log('[Protocol] Initial process.argv:', process.argv);
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

// setup protocol after single instance lock
setupProtocolHandling();

app.whenReady().then(async () => {

    // Setup native loopback audio capture for Windows
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
            // Grant access to the first screen found with loopback audio
            callback({ video: sources[0], audio: 'loopback' });
        }).catch((error) => {
            console.error('Failed to get desktop capturer sources:', error);
            callback({});
        });
    });

    // Initialize core services
    initializeFirebase();
    
    try {
        await databaseInitializer.initialize();
        console.log('>>> [index.js] Database initialized successfully');
        
        // Clean up zombie sessions from previous runs first - MOVED TO authService
        // sessionRepository.endAllActiveSessions();

        await authService.initialize();

        //////// after_modelStateService ////////
        await modelStateService.initialize();
        //////// after_modelStateService ////////

        // Initialize activity service (includes comprehensive activity tracking with AI)
        const activityService = require('./features/activity/activityService');
        await activityService.initialize();
        console.log('>>> [index.js] Activity service initialized successfully');

        featureBridge.initialize();  // 추가: featureBridge 초기화
        windowBridge.initialize();
        setupWebDataHandlers();

        // Initialize Ollama models in database
        await ollamaModelRepository.initializeDefaultModels();

        // Auto warm-up selected Ollama model in background (non-blocking)
        setTimeout(async () => {
            try {
                console.log('[index.js] Starting background Ollama model warm-up...');
                await ollamaService.autoWarmUpSelectedModel();
            } catch (error) {
                console.log('[index.js] Background warm-up failed (non-critical):', error.message);
            }
        }, 2000); // Wait 2 seconds after app start

        // Start web server and create windows ONLY after all initializations are successful
        WEB_PORT = await startWebStack();
        console.log('Web front-end listening on', WEB_PORT);
        
        // Create windows first
        const windows = createWindows();
        
        console.log('[Activity] Activity tracking system ready - includes AI-powered screenshot analysis');

    } catch (err) {
        console.error('>>> [index.js] Database initialization failed - some features may not work', err);
        // Optionally, show an error dialog to the user
        dialog.showErrorBox(
            'Application Error',
            'A critical error occurred during startup. Some features might be disabled. Please restart the application.'
        );
    }

    // initAutoUpdater should be called after auth is initialized
    initAutoUpdater();

    // Process any pending deep link after everything is initialized
    if (pendingDeepLinkUrl) {
        console.log('[Protocol] Processing pending URL:', pendingDeepLinkUrl);
        handleCustomUrl(pendingDeepLinkUrl);
        pendingDeepLinkUrl = null;
    }
});

app.on('before-quit', async (event) => {
    // Prevent infinite loop by checking if shutdown is already in progress
    if (isShuttingDown) {
        console.log('[Shutdown] 🔄 Shutdown already in progress, allowing quit...');
        return;
    }
    
    console.log('[Shutdown] App is about to quit. Starting graceful shutdown...');
    
    // Set shutdown flag to prevent infinite loop
    isShuttingDown = true;
    
    // Prevent immediate quit to allow graceful shutdown
    event.preventDefault();
    
    try {
        // 1. Stop audio capture first (immediate)
        await listenService.closeSession();
        console.log('[Shutdown] Audio capture stopped');
        
        // 2. Stop activity tracking
        try {
            const activityService = require('./features/activity/activityService');
            await activityService.stopActivityTracking();
            console.log('[Shutdown] Activity tracking stopped');
        } catch (activityError) {
            console.warn('[Shutdown] Could not stop activity tracking:', activityError.message);
        }
        
        // 3. End all active sessions (database operations) - with error handling
        try {
            await sessionRepository.endAllActiveSessions();
            console.log('[Shutdown] Active sessions ended');
        } catch (dbError) {
            console.warn('[Shutdown] Could not end active sessions (database may be closed):', dbError.message);
        }
        
        // 4. Shutdown Ollama service (potentially time-consuming)
        console.log('[Shutdown] shutting down Ollama service...');
        const ollamaShutdownSuccess = await Promise.race([
            ollamaService.shutdown(false), // Graceful shutdown
            new Promise(resolve => setTimeout(() => resolve(false), 8000)) // 8s timeout
        ]);
        
        if (ollamaShutdownSuccess) {
            console.log('[Shutdown] Ollama service shut down gracefully');
        } else {
            console.log('[Shutdown] Ollama service shutdown timed out, forcing quit');
        }
        
        console.log('[Shutdown] All services stopped. Allowing app to quit...');
        
    } catch (error) {
        console.error('[Shutdown] Error during graceful shutdown:', error);
    } finally {
        // Always quit after timeout, even if there are errors
        setTimeout(() => {
            console.log('[Shutdown] Force quitting after timeout');
            app.quit();
        }, 1000);
    }
});

// Handle OAuth callback URL from OAuth providers (GitHub, Discord, etc)
app.on('open-url', (event, url) => {
    console.log('[Protocol] Received open-url event:', url);
    event.preventDefault();

    if (app.isReady()) {
        handleCustomUrl(url);
    } else {
        pendingDeepLinkUrl = url;
    }
});

// Handle protocol URL from second instance (Windows/Linux)
app.on('second-instance', (event, commandLine, workingDirectory) => {
    console.log('[Protocol] Second instance detected');
    console.log('[Protocol] Command line args:', commandLine);
    
    // Focus existing window
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        const mainWindow = windows[0];
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
    }

    // Look for protocol URL in command line arguments
    for (let i = 0; i < commandLine.length; i++) {
        const arg = commandLine[i];
        if (arg && arg.includes('://')) {
            console.log('[Protocol] Found protocol URL in second instance:', arg);
            if (app.isReady()) {
                handleCustomUrl(arg);
            }
            break;
        }
    }
});

function handleCustomUrl(url) {
    console.log('[Protocol] Processing custom URL:', url);
    
    try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname;
        const searchParams = parsedUrl.searchParams;
        
        console.log('[Protocol] URL host:', host);
        console.log('[Protocol] URL params:', Object.fromEntries(searchParams));
        
        if (host === 'oauth') {
            handleOAuthCallback(searchParams);
        } else if (host === 'auth' || host === 'callback') {
            // Handle Firebase auth callback
            handleAuthCallback(parsedUrl);
        } else {
            console.log('[Protocol] Unknown protocol host:', host);
        }
    } catch (error) {
        console.error('[Protocol] Error parsing custom URL:', error);
    }
}

function handleOAuthCallback(searchParams) {
    console.log('[OAuth] Processing OAuth callback');
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
        console.error('[OAuth] OAuth error:', error);
        return;
    }
    
    if (code && state) {
        console.log('[OAuth] OAuth success - code and state received');
        // Send to renderer processes
        BrowserWindow.getAllWindows().forEach(win => {
            if (win && !win.isDestroyed()) {
                win.webContents.send('oauth-callback', { code, state, provider: 'unknown' });
            }
        });
    }
}

function handleAuthCallback(parsedUrl) {
    console.log('[Auth] Processing auth callback');
    
    // Extract Firebase auth parameters
    const fragment = parsedUrl.hash.substring(1); // Remove the '#'
    const params = new URLSearchParams(fragment);
    
    const accessToken = params.get('access_token');
    const idToken = params.get('id_token');
    
    if (accessToken || idToken) {
        console.log('[Auth] Firebase auth tokens received');
        // Send to renderer processes
        BrowserWindow.getAllWindows().forEach(win => {
            if (win && !win.isDestroyed()) {
                win.webContents.send('firebase-auth-callback', { 
                    accessToken, 
                    idToken,
                    fragment: parsedUrl.hash
                });
            }
        });
    }
}

// Global handlers
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        const windows = createWindows();
    }
});

// Auto updater
function initAutoUpdater() {
    if (process.env.NODE_ENV === 'development') {
        console.log('[AutoUpdater] Skipping auto-updater in development mode');
        return;
    }

    autoUpdater.checkForUpdatesAndNotify().catch(err => {
        console.log('[AutoUpdater] Failed to check for updates:', err.message);
    });

    autoUpdater.on('checking-for-update', () => {
        console.log('[AutoUpdater] Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
        console.log('[AutoUpdater] Update available:', info.version);
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('[AutoUpdater] Update not available');
    });

    autoUpdater.on('error', (err) => {
        console.log('[AutoUpdater] Auto updater error:', err.message);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        const logMessage = `[AutoUpdater] Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
        console.log(logMessage);
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('[AutoUpdater] Update downloaded:', info.version);
        // Note: We don't auto-restart, let user control when to restart
    });
}

// Web server
async function startWebStack() {
  console.log('NODE_ENV =', process.env.NODE_ENV); 
  const isDev = !app.isPackaged;

  const getAvailablePort = () => {
    return new Promise((resolve, reject) => {
      const server = require('net').createServer();
      server.listen(0, (err) => {
        if (err) reject(err);
        const port = server.address().port;
        server.close(() => resolve(port));
      });
    });
  };

  const apiPort = await getAvailablePort();
  const frontendPort = await getAvailablePort();

  console.log(`🔧 Allocated ports: API=${apiPort}, Frontend=${frontendPort}`);

  process.env.pickleglass_API_PORT = apiPort.toString();
  process.env.pickleglass_API_URL = `http://localhost:${apiPort}`;
  process.env.pickleglass_WEB_PORT = frontendPort.toString();
  process.env.pickleglass_WEB_URL = `http://localhost:${frontendPort}`;

  console.log(`🌍 Environment variables set:`, {
    pickleglass_API_URL: process.env.pickleglass_API_URL,
    pickleglass_WEB_URL: process.env.pickleglass_WEB_URL
  });

  const createBackendApp = require('../pickleglass_web/backend_node');
  const nodeApi = createBackendApp(eventBridge);

  const staticDir = app.isPackaged
    ? path.join(process.resourcesPath, 'out')
    : path.join(__dirname, '..', 'pickleglass_web', 'out');

  const fs = require('fs');

  if (!fs.existsSync(staticDir)) {
    console.error(`============================================================`);
    console.error(`[ERROR] Frontend build directory not found!`);
    console.error(`Path: ${staticDir}`);
    console.error(`Please run 'npm run build' inside the 'pickleglass_web' directory first.`);
    console.error(`============================================================`);
    app.quit();
    return;
  }

  const runtimeConfig = {
    API_URL: `http://localhost:${apiPort}`,
    WEB_URL: `http://localhost:${frontendPort}`,
    timestamp: Date.now()
  };
  
  // Create runtime config in temp folder
  const tempDir = app.getPath('temp');
  const configPath = path.join(tempDir, 'runtime-config.json');
  fs.writeFileSync(configPath, JSON.stringify(runtimeConfig, null, 2));
  console.log(`📝 Runtime config created in temp location: ${configPath}`);

  const frontSrv = express();
  
  // Serve runtime config
  frontSrv.get('/runtime-config.json', (req, res) => {
    res.sendFile(configPath);
  });

  frontSrv.use((req, res, next) => {
    if (req.path.indexOf('.') === -1 && req.path !== '/') {
      req.url = req.path + '.html';
    }
    next();
  });

  frontSrv.use(express.static(staticDir));

  // Backend API server
  const apiServer = nodeApi.listen(apiPort, (err) => {
    if (err) {
      console.error(`Failed to start API server:`, err);
      app.quit();
      return;
    }
    console.log(`🚀 Backend API running on http://localhost:${apiPort}`);
  });

  // Frontend static server
  const frontendServer = frontSrv.listen(frontendPort, (err) => {
    if (err) {
      console.error(`Failed to start frontend server:`, err);
      app.quit();
      return;
    }
    console.log(`🌐 Frontend running on http://localhost:${frontendPort}`);
  });

  // Return the frontend port for the app to use
  return frontendPort;
}

function setupWebDataHandlers() {
    // Event bridge handlers for web communication
    eventBridge.invoke = async (channel, data) => {
        try {
            console.log(`[EventBridge] Invoking ${channel} with data:`, data);
            
            // Handle different channel types
            if (channel.startsWith('research:') || channel.startsWith('activity:')) {
                // Delegate to the appropriate service via featureBridge
                return await handleServiceInvocation(channel, data);
            }
            
            console.warn(`[EventBridge] Unknown channel: ${channel}`);
            return { error: 'Unknown channel' };
        } catch (error) {
            console.error(`[EventBridge] Error invoking ${channel}:`, error);
            return { error: error.message };
        }
    };
}

async function handleServiceInvocation(channel, data) {
    // Map web API calls to IPC handlers
    try {
        const activityService = require('./features/activity/activityService');
        
        switch (channel) {
            case 'research:get-status':
            case 'activity:get-tracking-status':
                return await activityService.getTrackingStatus();
                
            case 'research:start-tracking':
            case 'activity:start-tracking':
                return await activityService.startActivityTracking();
                
            case 'research:stop-tracking':
            case 'activity:stop-tracking':
                return await activityService.stopActivityTracking();
                
            case 'research:manual-capture-analyze':
                const screenshot = await activityService.captureScreenshot();
                if (!screenshot.success) {
                    return { error: screenshot.error };
                }
                const analysis = await activityService.analyzeScreenshot(screenshot.base64);
                return {
                    success: true,
                    analysis,
                    timestamp: Date.now(),
                    type: 'manual'
                };
                
            case 'research:get-current-productivity-score':
                const status = await activityService.getTrackingStatus();
                if (status.lastAnalysis) {
                    return {
                        score: getProductivityScore(status.lastAnalysis),
                        timestamp: status.lastAnalysis.timestamp,
                        confidence: status.lastAnalysis.confidence || 85,
                        analysis: status.lastAnalysis.activity_title || status.lastAnalysis.category,
                        category: status.lastAnalysis.category
                    };
                }
                return { score: null, message: 'AI analysis not available' };
                
            case 'research:generate-insights':
                const insights = await activityService.generateInsights(data?.timeframe || 'week');
                if (!insights) {
                    return {
                        insights: [],
                        recommendations: [],
                        trends: { productivity: 'stable', focus: 'stable' }
                    };
                }
                return {
                    insights: insights.insights.map(insight => ({
                        type: 'productivity',
                        title: insight,
                        description: insight,
                        importance: 'medium'
                    })),
                    recommendations: insights.recommendations.map(rec => ({
                        title: rec,
                        description: rec,
                        category: 'general'
                    })),
                    trends: {
                        productivity: insights.productivity_ratio > 70 ? 'improving' : 
                                     insights.productivity_ratio < 40 ? 'declining' : 'stable',
                        focus: 'stable'
                    }
                };
                
            case 'research:get-ai-status':
                const modelInfo = await modelStateService.getCurrentModelInfo('llm');
                return {
                    available: modelInfo && modelInfo.provider === 'gemini' && modelInfo.apiKey,
                    provider: 'gemini',
                    status: modelInfo && modelInfo.apiKey ? 'ready' : 'not_configured',
                    capabilities: [
                        'screenshot_analysis',
                        'activity_categorization', 
                        'productivity_scoring',
                        'insights_generation'
                    ]
                };
                
            default:
                console.warn(`[ServiceInvocation] Unknown channel: ${channel}`);
                return { error: 'Unknown channel' };
        }
    } catch (error) {
        console.error(`[ServiceInvocation] Error handling ${channel}:`, error);
        return { error: error.message };
    }
}

// Helper function to convert activity analysis to productivity score
function getProductivityScore(analysis) {
    if (!analysis || !analysis.details) return 5;
    
    const productivity = analysis.details.productivity_indicator;
    const category = analysis.category?.toLowerCase();
    
    if (productivity === 'high' || ['focus', 'creative', 'research'].includes(category)) {
        return Math.floor(Math.random() * 3) + 8; // 8-10
    } else if (productivity === 'low' || category === 'break') {
        return Math.floor(Math.random() * 3) + 1; // 1-3
    } else {
        return Math.floor(Math.random() * 3) + 5; // 5-7
    }
}