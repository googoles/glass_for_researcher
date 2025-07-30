// src/bridge/featureBridge.js
const { ipcMain, app, BrowserWindow } = require('electron');
const settingsService = require('../features/settings/settingsService');
const authService = require('../features/common/services/authService');
const whisperService = require('../features/common/services/whisperService');
const ollamaService = require('../features/common/services/ollamaService');
const modelStateService = require('../features/common/services/modelStateService');
const shortcutsService = require('../features/shortcuts/shortcutsService');
const presetRepository = require('../features/common/repositories/preset');
const localAIManager = require('../features/common/services/localAIManager');
const askService = require('../features/ask/askService');
const listenService = require('../features/listen/listenService');
const permissionService = require('../features/common/services/permissionService');
const encryptionService = require('../features/common/services/encryptionService');
const activityService = require('../features/activity/activityService');

module.exports = {
  // Renderer로부터의 요청을 수신하고 서비스로 전달
  initialize() {
    // Settings Service
    ipcMain.handle('settings:getPresets', async () => await settingsService.getPresets());
    ipcMain.handle('settings:get-auto-update', async () => await settingsService.getAutoUpdateSetting());
    ipcMain.handle('settings:set-auto-update', async (event, isEnabled) => await settingsService.setAutoUpdateSetting(isEnabled));  
    ipcMain.handle('settings:get-model-settings', async () => await settingsService.getModelSettings());
    ipcMain.handle('settings:clear-api-key', async (e, { provider }) => await settingsService.clearApiKey(provider));
    ipcMain.handle('settings:set-selected-model', async (e, { type, modelId }) => await settingsService.setSelectedModel(type, modelId));    

    ipcMain.handle('settings:get-ollama-status', async () => await settingsService.getOllamaStatus());
    ipcMain.handle('settings:ensure-ollama-ready', async () => await settingsService.ensureOllamaReady());
    ipcMain.handle('settings:shutdown-ollama', async () => await settingsService.shutdownOllama());

    // Shortcuts
    ipcMain.handle('settings:getCurrentShortcuts', async () => await shortcutsService.loadKeybinds());
    ipcMain.handle('shortcut:getDefaultShortcuts', async () => await shortcutsService.handleRestoreDefaults());
    ipcMain.handle('shortcut:closeShortcutSettingsWindow', async () => await shortcutsService.closeShortcutSettingsWindow());
    ipcMain.handle('shortcut:openShortcutSettingsWindow', async () => await shortcutsService.openShortcutSettingsWindow());
    ipcMain.handle('shortcut:saveShortcuts', async (event, newKeybinds) => await shortcutsService.handleSaveShortcuts(newKeybinds));
    ipcMain.handle('shortcut:toggleAllWindowsVisibility', async () => await shortcutsService.toggleAllWindowsVisibility());

    // Permissions
    ipcMain.handle('check-system-permissions', async () => await permissionService.checkSystemPermissions());
    ipcMain.handle('request-microphone-permission', async () => await permissionService.requestMicrophonePermission());
    ipcMain.handle('open-system-preferences', async (event, section) => await permissionService.openSystemPreferences(section));
    ipcMain.handle('mark-keychain-completed', async () => await permissionService.markKeychainCompleted());
    ipcMain.handle('check-keychain-completed', async () => await permissionService.checkKeychainCompleted());
    ipcMain.handle('initialize-encryption-key', async () => {
        const userId = authService.getCurrentUserId();
        await encryptionService.initializeKey(userId);
        return { success: true };
    });

    // User/Auth
    ipcMain.handle('get-current-user', () => authService.getCurrentUser());
    ipcMain.handle('start-firebase-auth', async () => await authService.startFirebaseAuthFlow());
    ipcMain.handle('firebase-logout', async () => await authService.signOut());

    // App
    ipcMain.handle('quit-application', () => app.quit());

    // Whisper
    ipcMain.handle('whisper:download-model', async (event, modelId) => await whisperService.handleDownloadModel(modelId));
    ipcMain.handle('whisper:get-installed-models', async () => await whisperService.handleGetInstalledModels());
       
    // General
    ipcMain.handle('get-preset-templates', () => presetRepository.getPresetTemplates());
    ipcMain.handle('get-web-url', () => process.env.pickleglass_WEB_URL || 'http://localhost:3000');

    // Ollama
    ipcMain.handle('ollama:get-status', async () => await ollamaService.handleGetStatus());
    ipcMain.handle('ollama:install', async () => await ollamaService.handleInstall());
    ipcMain.handle('ollama:start-service', async () => await ollamaService.handleStartService());
    ipcMain.handle('ollama:ensure-ready', async () => await ollamaService.handleEnsureReady());
    ipcMain.handle('ollama:get-models', async () => await ollamaService.handleGetModels());
    ipcMain.handle('ollama:get-model-suggestions', async () => await ollamaService.handleGetModelSuggestions());
    ipcMain.handle('ollama:pull-model', async (event, modelName) => await ollamaService.handlePullModel(modelName));
    ipcMain.handle('ollama:is-model-installed', async (event, modelName) => await ollamaService.handleIsModelInstalled(modelName));
    ipcMain.handle('ollama:warm-up-model', async (event, modelName) => await ollamaService.handleWarmUpModel(modelName));
    ipcMain.handle('ollama:auto-warm-up', async () => await ollamaService.handleAutoWarmUp());
    ipcMain.handle('ollama:get-warm-up-status', async () => await ollamaService.handleGetWarmUpStatus());
    ipcMain.handle('ollama:shutdown', async (event, force = false) => await ollamaService.handleShutdown(force));

    // Ask
    ipcMain.handle('ask:sendQuestionFromAsk', async (event, userPrompt) => await askService.sendMessage(userPrompt));
    ipcMain.handle('ask:sendQuestionFromSummary', async (event, userPrompt) => await askService.sendMessage(userPrompt));
    ipcMain.handle('ask:toggleAskButton', async () => await askService.toggleAskButton());
    ipcMain.handle('ask:closeAskWindow',  async () => await askService.closeAskWindow());
    
    // Listen
    ipcMain.handle('listen:sendMicAudio', async (event, { data, mimeType }) => await listenService.handleSendMicAudioContent(data, mimeType));
    ipcMain.handle('listen:sendSystemAudio', async (event, { data, mimeType }) => {
        const result = await listenService.sttService.sendSystemAudioContent(data, mimeType);
        if(result.success) {
            listenService.sendToRenderer('system-audio-data', { data });
        }
        return result;
    });
    ipcMain.handle('listen:startMacosSystemAudio', async () => await listenService.handleStartMacosAudio());
    ipcMain.handle('listen:stopMacosSystemAudio', async () => await listenService.handleStopMacosAudio());
    ipcMain.handle('update-google-search-setting', async (event, enabled) => await listenService.handleUpdateGoogleSearchSetting(enabled));
    ipcMain.handle('listen:isSessionActive', async () => await listenService.isSessionActive());
    ipcMain.handle('listen:changeSession', async (event, listenButtonText) => {
      console.log('[FeatureBridge] listen:changeSession from mainheader', listenButtonText);
      try {
        await listenService.handleListenRequest(listenButtonText);
        return { success: true };
      } catch (error) {
        console.error('[FeatureBridge] listen:changeSession failed', error.message);
        return { success: false, error: error.message };
      }
    });

    // ModelStateService
    ipcMain.handle('model:validate-key', async (e, { provider, key }) => await modelStateService.handleValidateKey(provider, key));
    ipcMain.handle('model:get-all-keys', async () => await modelStateService.getAllApiKeys());
    ipcMain.handle('model:set-api-key', async (e, { provider, key }) => await modelStateService.setApiKey(provider, key));
    ipcMain.handle('model:remove-api-key', async (e, provider) => await modelStateService.handleRemoveApiKey(provider));
    ipcMain.handle('model:get-selected-models', async () => await modelStateService.getSelectedModels());
    ipcMain.handle('model:set-selected-model', async (e, { type, modelId }) => await modelStateService.handleSetSelectedModel(type, modelId));
    ipcMain.handle('model:get-available-models', async (e, { type }) => await modelStateService.getAvailableModels(type));
    ipcMain.handle('model:are-providers-configured', async () => await modelStateService.areProvidersConfigured());
    ipcMain.handle('model:get-provider-config', () => modelStateService.getProviderConfig());
    ipcMain.handle('model:re-initialize-state', async () => await modelStateService.initialize());

    // LocalAIManager 이벤트를 모든 윈도우에 브로드캐스트
    localAIManager.on('install-progress', (service, data) => {
      const event = { service, ...data };
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('localai:install-progress', event);
        }
      });
    });
    localAIManager.on('installation-complete', (service) => {
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('localai:installation-complete', { service });
        }
      });
    });
    localAIManager.on('error', (error) => {
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('localai:error-occurred', error);
        }
      });
    });
    // Handle error-occurred events from LocalAIManager's error handling
    localAIManager.on('error-occurred', (error) => {
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('localai:error-occurred', error);
        }
      });
    });
    localAIManager.on('model-ready', (data) => {
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('localai:model-ready', data);
        }
      });
    });
    localAIManager.on('state-changed', (service, state) => {
      const event = { service, ...state };
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('localai:service-status-changed', event);
        }
      });
    });

    // 주기적 상태 동기화 시작
    localAIManager.startPeriodicSync();

    // ModelStateService 이벤트를 모든 윈도우에 브로드캐스트
    modelStateService.on('state-updated', (state) => {
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('model-state:updated', state);
        }
      });
    });
    modelStateService.on('settings-updated', () => {
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('settings-updated');
        }
      });
    });
    modelStateService.on('force-show-apikey-header', () => {
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('force-show-apikey-header');
        }
      });
    });

    // LocalAI 통합 핸들러 추가
    ipcMain.handle('localai:install', async (event, { service, options }) => {
      return await localAIManager.installService(service, options);
    });
    ipcMain.handle('localai:get-status', async (event, service) => {
      return await localAIManager.getServiceStatus(service);
    });
    ipcMain.handle('localai:start-service', async (event, service) => {
      return await localAIManager.startService(service);
    });
    ipcMain.handle('localai:stop-service', async (event, service) => {
      return await localAIManager.stopService(service);
    });
    ipcMain.handle('localai:install-model', async (event, { service, modelId, options }) => {
      return await localAIManager.installModel(service, modelId, options);
    });
    ipcMain.handle('localai:get-installed-models', async (event, service) => {
      return await localAIManager.getInstalledModels(service);
    });
    ipcMain.handle('localai:run-diagnostics', async (event, service) => {
      return await localAIManager.runDiagnostics(service);
    });
    ipcMain.handle('localai:repair-service', async (event, service) => {
      return await localAIManager.repairService(service);
    });
    
    // 에러 처리 핸들러
    ipcMain.handle('localai:handle-error', async (event, { service, errorType, details }) => {
      return await localAIManager.handleError(service, errorType, details);
    });
    
    // 전체 상태 조회
    ipcMain.handle('localai:get-all-states', async (event) => {
      return await localAIManager.getAllServiceStates();
    });

    // Research Tracking (Using Activity Service)
    ipcMain.handle('research:get-status', async () => {
      try {
        const trackingStatus = await activityService.getTrackingStatus();
        return {
          isTracking: trackingStatus.isTracking,
          currentActivity: trackingStatus.currentActivity,
          lastAnalysis: trackingStatus.lastAnalysis,
          captureInterval: trackingStatus.settings.captureInterval,
          nextCaptureIn: trackingStatus.nextCaptureIn,
          activityDetectionEnabled: trackingStatus.settings.enableAIAnalysis
        };
      } catch (error) {
        console.error('[FeatureBridge] research:get-status failed', error.message);
        return { isTracking: false, currentSession: null };
      }
    });

    ipcMain.handle('research:get-dashboard-data', async () => {
      try {
        const insights = await activityService.generateInsights('week');
        return {
          recentSessions: [],
          dailyStats: insights,
          currentSession: null
        };
      } catch (error) {
        console.error('[FeatureBridge] research:get-dashboard-data failed', error.message);
        return { recentSessions: [], dailyStats: null, currentSession: null };
      }
    });

    ipcMain.handle('research:start-tracking', async () => {
      try {
        return await activityService.startActivityTracking();
      } catch (error) {
        console.error('[FeatureBridge] research:start-tracking failed', error.message);
        throw error;
      }
    });

    ipcMain.handle('research:stop-tracking', async () => {
      try {
        return await activityService.stopActivityTracking();
      } catch (error) {
        console.error('[FeatureBridge] research:stop-tracking failed', error.message);
        throw error;
      }
    });

    ipcMain.handle('research:get-sessions', async (event, { limit, offset }) => {
      try {
        // Return empty for now - could be enhanced to get activities as sessions
        return [];
      } catch (error) {
        console.error('[FeatureBridge] research:get-sessions failed', error.message);
        return [];
      }
    });

    ipcMain.handle('research:get-session-details', async (event, { sessionId }) => {
      try {
        return null;
      } catch (error) {
        console.error('[FeatureBridge] research:get-session-details failed', error.message);
        return null;
      }
    });

    // AI Analysis handlers (Using Activity Service)
    ipcMain.handle('research:get-current-productivity-score', async () => {
      try {
        const status = await activityService.getTrackingStatus();
        if (status.lastAnalysis) {
          return {
            score: this._getProductivityScore(status.lastAnalysis),
            timestamp: status.lastAnalysis.timestamp,
            confidence: status.lastAnalysis.confidence || 85,
            analysis: status.lastAnalysis.activity_title || status.lastAnalysis.category,
            category: status.lastAnalysis.category
          };
        }
        return { score: null, message: 'AI analysis not available' };
      } catch (error) {
        console.error('[FeatureBridge] research:get-current-productivity-score failed', error.message);
        return { score: null, message: 'AI analysis not available' };
      }
    });

    ipcMain.handle('research:get-analysis-history', async (event, { limit }) => {
      try {
        const history = await activityService.getCaptureHistory(limit || 100);
        return history.map(capture => ({
          timestamp: capture.timestamp,
          analysis: capture.analysis,
          type: 'automatic_capture'
        }));
      } catch (error) {
        console.error('[FeatureBridge] research:get-analysis-history failed', error.message);
        return [];
      }
    });

    ipcMain.handle('research:generate-insights', async (event, { timeframe }) => {
      try {
        const insights = await activityService.generateInsights(timeframe);
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
      } catch (error) {
        console.error('[FeatureBridge] research:generate-insights failed', error.message);
        return { error: error.message, message: 'Failed to generate insights' };
      }
    });

    ipcMain.handle('research:get-productivity-stats', async (event, { timeframe }) => {
      try {
        const insights = await activityService.generateInsights(timeframe);
        return insights;
      } catch (error) {
        console.error('[FeatureBridge] research:get-productivity-stats failed', error.message);
        return null;
      }
    });

    ipcMain.handle('research:analyze-app-usage', async (event, { appName }) => {
      try {
        return { 
          error: `App usage analysis not yet implemented for: ${appName}`,
          usage: []
        };
      } catch (error) {
        console.error('[FeatureBridge] research:analyze-app-usage failed', error.message);
        return { error: error.message };
      }
    });

    ipcMain.handle('research:manual-capture-analyze', async () => {
      try {
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
      } catch (error) {
        console.error('[FeatureBridge] research:manual-capture-analyze failed', error.message);
        return { error: error.message };
      }
    });

    ipcMain.handle('research:get-ai-status', async () => {
      try {
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
      } catch (error) {
        console.error('[FeatureBridge] research:get-ai-status failed', error.message);
        return { available: false, error: error.message };
      }
    });

    ipcMain.handle('research:set-capture-interval', async (event, { intervalMinutes }) => {
      try {
        await activityService.updateSettings({
          captureInterval: intervalMinutes * 60 * 1000
        });
        return { success: true };
      } catch (error) {
        console.error('[FeatureBridge] research:set-capture-interval failed', error.message);
        throw error;
      }
    });

    // Activity Tracking (Glass-native)
    ipcMain.handle('activity:get-timeline', async (event, { date, projectId }) => {
      try {
        return await activityService.getTimeline({ date, projectId });
      } catch (error) {
        console.error('[FeatureBridge] activity:get-timeline failed', error.message);
        return { activities: [], totalTime: 0, activeTime: 0, categories: {} };
      }
    });

    ipcMain.handle('activity:get-productivity-metrics', async (event, { date, period }) => {
      try {
        return await activityService.getProductivityMetrics({ date, period });
      } catch (error) {
        console.error('[FeatureBridge] activity:get-productivity-metrics failed', error.message);
        return activityService.getDefaultMetrics();
      }
    });

    ipcMain.handle('activity:get-weekly-stats', async (event, { startDate, endDate }) => {
      try {
        return await activityService.getWeeklyStats({ startDate, endDate });
      } catch (error) {
        console.error('[FeatureBridge] activity:get-weekly-stats failed', error.message);
        return { totalHours: 0, productiveHours: 0, completedProjects: 0, averageScore: 0, dailyScores: [], categoryBreakdown: {} };
      }
    });

    ipcMain.handle('activity:get-goal-progress', async () => {
      try {
        return await activityService.getGoalProgress();
      } catch (error) {
        console.error('[FeatureBridge] activity:get-goal-progress failed', error.message);
        return { daily: { target: 8, actual: 0, percentage: 0 }, weekly: { target: 40, actual: 0, percentage: 0 }, monthly: { target: 160, actual: 0, percentage: 0 } };
      }
    });

    ipcMain.handle('activity:set-goals', async (event, { daily, weekly, monthly }) => {
      try {
        return await activityService.setGoals({ daily, weekly, monthly });
      } catch (error) {
        console.error('[FeatureBridge] activity:set-goals failed', error.message);
        throw error;
      }
    });

    // Enhanced Activity Tracking with AI
    ipcMain.handle('activity:start-tracking', async () => {
      try {
        return await activityService.startActivityTracking();
      } catch (error) {
        console.error('[FeatureBridge] activity:start-tracking failed', error.message);
        throw error;
      }
    });

    ipcMain.handle('activity:stop-tracking', async () => {
      try {
        return await activityService.stopActivityTracking();
      } catch (error) {
        console.error('[FeatureBridge] activity:stop-tracking failed', error.message);
        throw error;
      }
    });

    ipcMain.handle('activity:get-tracking-status', async () => {
      try {
        return await activityService.getTrackingStatus();
      } catch (error) {
        console.error('[FeatureBridge] activity:get-tracking-status failed', error.message);
        return { isTracking: false, currentActivity: null, lastAnalysis: null, settings: {}, captureHistory: [] };
      }
    });

    ipcMain.handle('activity:update-settings', async (event, settings) => {
      try {
        return await activityService.updateSettings(settings);
      } catch (error) {
        console.error('[FeatureBridge] activity:update-settings failed', error.message);
        throw error;
      }
    });

    ipcMain.handle('activity:capture-screenshot', async () => {
      try {
        return await activityService.captureScreenshot();
      } catch (error) {
        console.error('[FeatureBridge] activity:capture-screenshot failed', error.message);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('activity:generate-insights', async (event, { timeframe }) => {
      try {
        return await activityService.generateInsights(timeframe || 'week');
      } catch (error) {
        console.error('[FeatureBridge] activity:generate-insights failed', error.message);
        return null;
      }
    });

    ipcMain.handle('activity:get-capture-history', async (event, { limit }) => {
      try {
        return await activityService.getCaptureHistory(limit || 50);
      } catch (error) {
        console.error('[FeatureBridge] activity:get-capture-history failed', error.message);
        return [];
      }
    });

    console.log('[FeatureBridge] Initialized with comprehensive activity tracking and all feature handlers.');
  },

  // Helper method to convert activity analysis to productivity score
  _getProductivityScore(analysis) {
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
  },

  // Renderer로 상태를 전송
  sendAskProgress(win, progress) {
    win.webContents.send('feature:ask:progress', progress);
  },
};