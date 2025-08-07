# Glass Project - Simplified Development Phases

## Project Overview
Glass is a desktop AI assistant that captures screen content and audio, provides real-time AI queries, and offers meeting summaries. Built with Electron + React/Next.js.

## Phase 1: Core Foundation ✅
**Status: Complete**
- Electron application setup
- Basic window management
- IPC communication bridge
- SQLite/Firebase dual storage architecture
- Authentication system

## Phase 2: Capture & Listen Features ⚠️
**Status: Partially Working - Issues Detected**
### Completed:
- Audio capture with echo cancellation
- Speech-to-text service (Deepgram, Whisper)
- Screen capture API integration
- Basic UI controls

### Issues:
1. **Camera Button Not Working**
   - Handler exists: `activity:capture-screenshot` → `performManualCapture()`
   - Method implemented but capture may be failing
   - Error: Screenshot capture not persisting data

2. **Shortcut Not Triggering**
   - Shortcut service configured for `manualCapture`
   - Registration may be failing or shortcuts not bound

## Phase 3: AI Integration ✅
**Status: Complete**
- Multiple AI providers (OpenAI, Anthropic, Gemini, Ollama)
- Factory pattern for provider selection
- Prompt templates and builders
- AI analysis service for screenshots

## Phase 4: Activity Tracking & Research 🔄
**Status: In Progress**
### Completed:
- Activity service with capture/analysis
- Research service with project management
- Analytics and insights generation
- Zotero integration for academic papers

### Issues:
1. **Data Not Persisting**
   - Activities may not be saving to database
   - Repository layer might be failing silently
   - Need to check SQLite/Firebase connection

2. **Website Not Showing Data**
   - API endpoints exist but may return empty
   - Authentication/session issues possible
   - Frontend not receiving/displaying data

## Phase 5: Web Interface 🔄
**Status: Partially Working**
### Completed:
- Next.js web app setup
- Authentication flow
- API routes for data access
- UI components for activity display

### Issues:
- Data not loading from backend
- Session management problems
- API connectivity issues

## Critical Issues to Fix

### 1. Capture Functionality
```javascript
// Location: src/features/activity/activityService.js:309-340
// Issue: captureScreenshot() may be failing on non-macOS or permissions
// Fix: Add error handling, check platform-specific code
```

### 2. Data Persistence
```javascript
// Location: src/features/activity/repositories/
// Issue: Activities not saving to database
// Fix: Check repository implementations, add logging
```

### 3. Shortcut Registration
```javascript
// Location: src/features/shortcuts/shortcutsService.js:261-304
// Issue: Shortcuts not registering globally
// Fix: Verify globalShortcut registration, check accelerator strings
```

### 4. Web API Data Flow
```javascript
// Location: pickleglass_web/backend_node/routes/activity.js
// Issue: API returning empty data
// Fix: Check database queries, authentication middleware
```

## Next Steps

1. **Immediate Fixes Required:**
   - Fix screenshot capture mechanism
   - Ensure data persistence to SQLite/Firebase
   - Fix shortcut registration
   - Resolve web API data retrieval

2. **Testing Required:**
   - Manual capture via UI button
   - Shortcut trigger testing
   - Data persistence verification
   - Web interface data display

3. **Clean Up Tasks:**
   - Remove test files (test-*.js)
   - Clean up debug documentation
   - Remove backup files (.backup)
   - Consolidate duplicate configs

## Development Commands

```bash
# Development
npm run setup          # Initial setup
npm start             # Start app
npm run watch:renderer # Watch mode

# Web App
cd pickleglass_web
npm run dev           # Dev server
npm run build         # Production build

# Testing & Quality
npm run lint          # Run linter
```

## Architecture Summary

```
glass/
├── src/
│   ├── index.js           # Main process entry
│   ├── features/          # Domain features
│   │   ├── activity/      # Screen capture & tracking
│   │   ├── ask/          # AI queries
│   │   ├── listen/       # Audio & STT
│   │   └── research/     # Analytics & insights
│   └── ui/               # Renderer UI (Lit)
└── pickleglass_web/      # Web interface (Next.js)
    ├── app/              # Next.js app router
    └── backend_node/     # API routes
```