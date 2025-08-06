# Capture and Summarize Functionality Guide

This guide explains how to use the automatic and manual capture/summarize features in the Glass application.

## 🎯 Overview

The Glass application now supports both automatic and manual capture of screen content with AI-powered analysis and summarization:

- **Automatic Capture**: Periodic screenshots and analysis while activity tracking is enabled
- **Manual Capture**: On-demand screenshot capture and analysis via keyboard shortcut

## ⚡ Quick Start

### Manual Capture
1. Press **Cmd+Shift+C** (Mac) or **Ctrl+Shift+C** (Windows/Linux)
2. A notification will appear showing the analysis result
3. The capture is stored in the activity history

### Automatic Capture
1. Start activity tracking from the UI
2. Automatic captures occur every 15 minutes by default
3. Can be configured or disabled as needed

## 🔧 Configuration Options

### Via IPC Handlers (for UI components)

```javascript
// Enable/disable automatic capture
await window.api.invoke('activity:set-auto-capture-enabled', { enabled: true });

// Set capture interval (in minutes)
await window.api.invoke('activity:set-capture-interval', { intervalMinutes: 10 });

// Enable/disable manual capture notifications
await window.api.invoke('activity:set-notifications-enabled', { enabled: true });

// Get current capture settings
const settings = await window.api.invoke('activity:get-capture-settings');
```

### Settings Object Structure

```javascript
{
  enableAutoCapture: true,           // Enable automatic captures
  captureInterval: 900000,           // Interval in milliseconds (15 min)
  captureIntervalMinutes: 15,        // Interval in minutes
  manualCaptureNotifications: true,  // Show notifications for manual captures
  enableSmartAnalysis: true          // Enable AI analysis
}
```

## 🎹 Keyboard Shortcuts

| Action | Mac | Windows/Linux | Customizable |
|--------|-----|---------------|--------------|
| Manual Capture | Cmd+Shift+C | Ctrl+Shift+C | ✅ Yes |

### Customizing Shortcuts

Shortcuts can be customized through the shortcuts settings UI or by modifying the shortcuts service defaults.

## 🧠 AI Analysis Features

When smart analysis is enabled, each capture includes:
- **Activity categorization** (Focus, Communication, Research, Break, Creative, Other)
- **Productivity scoring** (High/Medium/Low)
- **Content type detection** (Code, document, web, etc.)
- **Distraction level assessment**
- **Confidence scoring**

### Analysis Response Format

```javascript
{
  success: true,
  timestamp: 1640995200000,
  analysis: {
    category: "Focus",
    activity_title: "Code Development",
    confidence: 0.85,
    details: {
      primary_application: "VS Code",
      content_type: "code",
      productivity_indicator: "high",
      distraction_level: "low"
    },
    insights: "Deep coding session detected"
  },
  summary: "Code Development - Focus (high productivity, 85% confidence)"
}
```

## 🔔 Notification System

Manual captures trigger visual notifications showing:
- **Success**: Green notification with analysis summary
- **Warning**: Orange notification if analysis fails but screenshot succeeds
- **Error**: Red notification if capture fails

Notifications auto-hide after 3 seconds and can be disabled via settings.

## 🎮 Activity Service API

### Core Methods

```javascript
// Manual capture and analysis
const result = await activityService.performManualCapture();

// Start/stop activity tracking with auto-capture
await activityService.startActivityTracking();
await activityService.stopActivityTracking();

// Update capture settings
await activityService.updateSettings({
  enableAutoCapture: false,
  captureInterval: 5 * 60 * 1000, // 5 minutes
  manualCaptureNotifications: true
});

// Get current tracking status
const status = await activityService.getTrackingStatus();
```

### Response Handling

```javascript
const result = await activityService.performManualCapture();

if (result.success) {
  console.log('Capture successful:', result.summary);
  if (result.analysis) {
    console.log('Category:', result.analysis.category);
    console.log('Confidence:', result.analysis.confidence);
  }
} else {
  console.error('Capture failed:', result.error);
}
```

## 🏗️ Implementation Architecture

### Service Layer
- **ActivityService**: Core capture and analysis logic
- **ShortcutsService**: Keyboard shortcut handling
- **ConfigService**: Configuration management

### IPC Bridge
- **FeatureBridge**: IPC handlers for UI communication
- **WindowBridge**: Window-specific events

### UI Components
- **MainHeader**: Visual feedback and notifications
- **Settings UI**: Configuration interface (to be implemented)

## 🔒 Privacy & Security

### Privacy Mode
When `privacyMode` is enabled:
- Only aggregated data is stored
- Full screenshot data is not retained
- Analysis summaries are stored without raw images

### Data Storage
- Screenshots are processed in memory
- Analysis results are stored in the activity database
- History is limited to prevent excessive storage usage

## 🛠️ Development Integration

### Adding Custom Analysis
```javascript
// Extend the activity service for custom analysis
class CustomActivityService extends ActivityService {
  async analyzeScreenshot(screenshotBase64) {
    // Custom analysis logic
    const customAnalysis = await this.performCustomAnalysis(screenshotBase64);
    
    // Call parent method for standard analysis
    const standardAnalysis = await super.analyzeScreenshot(screenshotBase64);
    
    // Combine results
    return { ...standardAnalysis, custom: customAnalysis };
  }
}
```

### Custom UI Integration
```javascript
// Listen for manual capture events in custom UI components
window.api.mainHeader.onManualCaptureCompleted((event, result) => {
  console.log('Manual capture completed:', result);
  // Handle result in custom UI
});
```

## 📊 Monitoring and Analytics

### Capture History
```javascript
// Get recent captures
const history = await window.api.invoke('activity:get-capture-history', { limit: 50 });

// Get activity analytics
const analytics = await window.api.invoke('activity:generate-insights', { timeframe: 'week' });
```

### Performance Metrics
- Automatic captures run in background without blocking UI
- Memory usage is managed through history size limits
- AI analysis is cached to prevent redundant processing

## 🐛 Troubleshooting

### Common Issues

**Manual capture shortcut not working:**
- Verify shortcuts are registered correctly
- Check for conflicting system shortcuts
- Ensure activity service is initialized

**AI analysis failing:**
- Verify AI provider configuration (API keys)
- Check network connectivity for cloud providers
- Review console logs for detailed error messages

**Automatic captures not occurring:**
- Ensure `enableAutoCapture` is set to true
- Verify activity tracking is started
- Check capture interval configuration

### Debug Mode
Enable debug logging in the config to see detailed capture information:

```javascript
{
  enableDebugLogging: true,
  logLevel: 'debug'
}
```

## 🚀 Future Enhancements

Planned improvements:
- Settings UI for easy configuration
- Multiple capture formats (PNG, JPEG quality settings)
- Custom analysis providers
- Batch processing for multiple captures
- Export functionality for capture data
- Integration with external tools (Zotero, etc.)

## 📝 Example Usage Scenarios

### Research Session Tracking
```javascript
// Start research session with 5-minute intervals
await window.api.invoke('activity:set-capture-interval', { intervalMinutes: 5 });
await window.api.invoke('activity:start-tracking');

// Manual capture for important moments
// User presses Cmd+Shift+C when finding key information
```

### Productivity Monitoring
```javascript
// Set up for productivity tracking
await window.api.invoke('activity:set-auto-capture-enabled', { enabled: true });
await window.api.invoke('activity:set-capture-interval', { intervalMinutes: 15 });

// Get daily productivity summary
const insights = await window.api.invoke('activity:generate-insights', { timeframe: 'day' });
```

### Privacy-Conscious Usage
```javascript
// Enable privacy mode
await activityService.updateSettings({ 
  privacyMode: true,
  enableAutoCapture: false // Only manual captures
});

// Manual captures still work but with limited data retention
```

---

For more detailed information, see the source code in `/src/features/activity/` and `/src/features/shortcuts/`.