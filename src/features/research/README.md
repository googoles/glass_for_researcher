# Research Feature

The Research feature provides PDF reading session tracking for Glass, following Glass's established architectural patterns.

## Overview

This feature automatically detects when users are reading PDF documents and tracks reading sessions with timing and metadata. It's designed to integrate seamlessly with Glass's existing features while maintaining privacy and performance.

## Architecture

### Service Layer
- **`researchService.js`** - Main service handling session tracking and PDF detection
- Follows Glass's service pattern with initialization and cleanup

### Repository Layer
- **`repositories/index.js`** - Repository adapter following Glass's auth-aware pattern
- **`repositories/sqlite.repository.js`** - Local SQLite storage implementation
- **`repositories/firebase.repository.js`** - Firebase cloud storage implementation

### Database Schema

#### SQLite Tables
- `research_sessions` - Reading session records
- `research_events` - Detailed session events and activities

#### Firebase Collections
- `research_sessions` - Reading session records
- `research_events` - Detailed session events and activities

## Features

### PDF Detection
- Automatic detection of active PDF documents
- Window title-based detection (simple and reliable)
- Configurable polling interval (default: 3 seconds)

### Session Tracking
- Automatic session start/stop based on PDF activity
- Duration tracking with millisecond precision
- Session metadata and context preservation

### Data Storage
- Follows Glass's dual storage pattern (SQLite + Firebase)
- Automatic user context injection via repository adapter
- Consistent data schema across storage backends

## API

### IPC Handlers
- `research:get-status` - Get current tracking status
- `research:get-dashboard-data` - Get dashboard data with recent sessions
- `research:start-tracking` - Start PDF tracking
- `research:stop-tracking` - Stop PDF tracking
- `research:get-sessions` - Get paginated session list
- `research:get-session-details` - Get specific session details

### Web API Routes
- `GET /api/research/status` - Get tracking status
- `GET /api/research/dashboard` - Get dashboard data
- `POST /api/research/start` - Start tracking
- `POST /api/research/stop` - Stop tracking
- `GET /api/research/sessions` - Get sessions with pagination

## UI Components

### Web Interface
- **`pickleglass_web/app/research/page.tsx`** - Next.js research dashboard
- Real-time status updates and session history
- Daily statistics and productivity metrics

### Electron Interface
- **`src/ui/research/ResearchView.js`** - Lit-based research component
- Native Glass theming and styling
- Integrated with Glass's window management

## Integration

### Initialization
Research service is initialized in `src/index.js` alongside other Glass services:

```javascript
await researchService.initialize();
```

### Feature Bridge
IPC handlers are registered in `src/bridge/featureBridge.js` following Glass patterns.

### Preload API
Research APIs are exposed in `src/preload.js` for renderer processes.

## Privacy & Performance

- **Local-First**: All data stored locally by default
- **Optional Cloud Sync**: Firebase integration only when user is authenticated
- **Lightweight**: Minimal performance impact with efficient polling
- **No External Services**: No third-party tracking or analytics

## Development

### Adding New Features
1. Update service methods in `researchService.js`
2. Add repository methods in both SQLite and Firebase repositories
3. Register IPC handlers in `featureBridge.js`
4. Update preload API if needed
5. Update UI components as required

### Testing
- Service can be tested independently of Glass's main functionality
- Repository pattern allows easy mocking for unit tests
- IPC handlers can be tested via Electron's test utilities

## Future Enhancements

- Enhanced PDF metadata extraction
- Integration with Glass's AI features for content analysis
- Export functionality for research data
- Advanced session analytics and insights