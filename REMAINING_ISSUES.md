# Glass Project - Remaining Issues & Solutions

## Fixed Issues ✅

### 1. Manual Capture Not Saving Data
**Problem:** Manual captures via camera button weren't persisting to database
**Solution:** Modified `performManualCapture()` in activityService.js to always save activities regardless of tracking status
**File:** src/features/activity/activityService.js:1135-1136

## Remaining Issues to Investigate

### 1. Screenshot Capture Platform Support ⚠️
**Issue:** Screenshot capture only works on macOS via screencapture command
**Location:** src/features/activity/activityService.js:310-352
**Problem:** 
- Windows/Linux fall back to Electron's desktopCapturer
- desktopCapturer may require additional permissions or fail silently
**Recommended Fix:**
```javascript
// Add better error handling and logging
// Check for screen recording permissions on macOS
// Use platform-specific capture methods
```

### 2. Shortcut Registration Timing 🔧
**Issue:** Shortcuts may not register if called too early in app lifecycle
**Location:** src/features/shortcuts/shortcutsService.js:263-304
**Problem:**
- globalShortcut.register may fail silently
- No error handling for failed registrations
**Recommended Fix:**
```javascript
// Add registration verification
const registered = globalShortcut.register(accelerator, callback);
if (!registered) {
    console.error(`Failed to register shortcut: ${accelerator}`);
}
```

### 3. Database Initialization ⚠️
**Issue:** SQLite database may not be initialized properly
**Location:** src/features/activity/repositories/sqlite.repository.js
**Problem:**
- Database file location not verified
- Tables may not be created on first run
**Check:**
```bash
# Verify database exists
ls ~/Library/Application\ Support/pickle-glass/glass.db
# Or on Windows:
ls %APPDATA%/pickle-glass/glass.db
```

### 4. Web API Authentication 🔐
**Issue:** Web interface may not authenticate properly with Electron backend
**Location:** pickleglass_web/backend_node/routes/activity.js
**Problem:**
- Bridge connection may not be established
- Authentication middleware may block requests
**Recommended Fix:**
- Verify bridge initialization in backend_node/index.js
- Check authentication flow in web app

### 5. AI Provider Configuration ⚠️
**Issue:** Gemini AI analysis requires API key configuration
**Location:** src/features/activity/activityService.js:384-431
**Problem:**
- AI analysis fails without proper API key
- Falls back to no analysis mode
**Solution:**
- Configure Gemini API key in settings
- Or disable enableSmartAnalysis in settings

## Testing Checklist

### 1. Test Manual Capture
```bash
# Start the app
npm start

# Click camera button
# Check console for: "[Activity Service] Manual capture completed"
# Verify data saved to database
```

### 2. Test Shortcuts
```bash
# Configure shortcut in settings
# Default: Cmd+Shift+C (Mac) or Ctrl+Shift+C (Windows)
# Press shortcut
# Check console for: "[ShortcutsService] Manual capture and analyze triggered"
```

### 3. Test Web Interface
```bash
# Start web app
cd pickleglass_web
npm run dev

# Navigate to http://localhost:3000
# Login and check activity page
# Verify data loads from backend
```

### 4. Verify Database
```javascript
// In Electron console or test script
const db = await sqliteClient.getDb();
const activities = await db.all('SELECT * FROM activities LIMIT 10');
console.log('Activities:', activities);
```

## Quick Fixes Applied

1. ✅ Removed test files and documentation clutter
2. ✅ Restored package.json to original state
3. ✅ Fixed manual capture to always save activities
4. ✅ Cleaned up unnecessary changes from development

## Next Steps

1. **Test capture functionality** with the fix applied
2. **Verify database initialization** on fresh install
3. **Check platform-specific issues** (Windows/Linux)
4. **Configure AI provider** for smart analysis
5. **Test web interface** data flow

## Development Commands

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Setup and run
npm run setup
npm start

# Development mode
npm run watch:renderer

# Web interface
cd pickleglass_web
npm run dev
```

## Architecture Notes

- **Data Flow:** UI → IPC → Service → Repository → Database
- **Auth Flow:** Local mode (SQLite) vs Firebase mode
- **Activity Tracking:** Automatic (interval) vs Manual (button/shortcut)
- **Storage:** Dual support for SQLite (offline) and Firebase (cloud sync)