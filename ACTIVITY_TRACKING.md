# Activity Tracking System - Glass

A comprehensive, AI-powered activity tracking system that integrates seamlessly with Glass's existing architecture. Features automated screenshot capture, Gemini AI analysis, and intelligent productivity insights.

## 🌟 Features

### Core Functionality
- **Automated Screenshot Capture**: Configurable intervals (5min, 15min, 30min, 1hr, custom)
- **AI-Powered Analysis**: Uses Gemini AI to categorize activities and assess productivity
- **Privacy-First Design**: Local processing with optional cloud sync
- **Smart Activity Detection**: Automatically detects activity changes and creates sessions
- **Real-time Insights**: Live productivity metrics and recommendations

### Activity Categories
- **Focus**: Deep work, coding, writing, design work
- **Communication**: Email, chat, meetings, calls  
- **Research**: Reading, browsing documentation, learning
- **Break**: Social media, entertainment, personal browsing
- **Creative**: Design, brainstorming, planning, ideation
- **Other**: System tasks, file management, unclear activities

### Data Storage
- **SQLite**: Local storage for offline mode
- **Firebase**: Cloud sync for authenticated users
- **Repository Pattern**: Seamless switching between storage backends

## 🏗️ Architecture

### Service Layer
```
src/features/activity/activityService.js
├── Screenshot capture (macOS + cross-platform)
├── AI analysis with Gemini
├── Activity session management
├── Settings and configuration
├── Insights generation
└── Privacy controls
```

### Repository Layer
```
src/features/activity/repositories/
├── index.js (adapter with auth injection)
├── sqlite.repository.js (local storage)
└── firebase.repository.js (cloud sync)
```

### API Layer
```
pickleglass_web/backend_node/routes/activity.js
├── REST endpoints for web interface
├── Real-time status updates
├── Settings management
└── Analytics and insights
```

### IPC Integration
```
src/bridge/featureBridge.js
├── activity:start-tracking
├── activity:stop-tracking
├── activity:get-tracking-status
├── activity:update-settings
├── activity:capture-screenshot
├── activity:generate-insights
└── activity:get-capture-history
```

## 🚀 Quick Start

### 1. Configuration

The system uses configurable settings stored per-user:

```javascript
const defaultSettings = {
  captureInterval: 15 * 60 * 1000, // 15 minutes
  enableAIAnalysis: true,
  privacyMode: false,
  activityCategories: ['Focus', 'Communication', 'Research', 'Break', 'Creative', 'Other']
};
```

### 2. Start Tracking

```javascript
// From Electron main process
const activityService = require('./src/features/activity/activityService');
await activityService.startActivityTracking();

// From renderer process
const result = await ipcRenderer.invoke('activity:start-tracking');
```

### 3. Web API Usage

```bash
# Start tracking
curl -X POST http://localhost:3000/api/activity/tracking/start

# Get current status
curl http://localhost:3000/api/activity/tracking/status

# Update settings
curl -X POST http://localhost:3000/api/activity/settings \
  -H "Content-Type: application/json" \
  -d '{"captureInterval": 600000, "enableAIAnalysis": true}'

# Get insights
curl http://localhost:3000/api/activity/insights?timeframe=week
```

## 🔧 API Reference

### Tracking Control

#### `POST /api/activity/tracking/start`
Start automated activity tracking.

**Response:**
```json
{
  "success": true,
  "message": "Activity tracking started"
}
```

#### `POST /api/activity/tracking/stop`
Stop activity tracking.

#### `GET /api/activity/tracking/status`
Get current tracking status.

**Response:**
```json
{
  "isTracking": true,
  "currentActivity": {
    "title": "Coding Activity",
    "category": "focus",
    "startTime": "2024-01-15T10:30:00Z",
    "duration": 1800000
  },
  "lastAnalysis": {
    "category": "Focus",
    "confidence": 0.92,
    "timestamp": 1642248600000,
    "productivity": "high"
  },
  "captureInterval": 900000,
  "nextCaptureIn": 450000
}
```

### Settings Management

#### `GET /api/activity/settings`
Get user's activity tracking settings.

#### `POST /api/activity/settings`
Update activity tracking settings.

**Request:**
```json
{
  "captureInterval": 900000,
  "enableAIAnalysis": true,
  "privacyMode": false,
  "activityCategories": ["Focus", "Communication", "Research", "Break", "Creative", "Other"]
}
```

### Analytics

#### `GET /api/activity/insights?timeframe=week`
Generate smart insights and recommendations.

**Parameters:**
- `timeframe`: `day`, `week`, or `month`

**Response:**
```json
{
  "timeframe": "week",
  "total_activities": 45,
  "productivity_ratio": 78,
  "category_breakdown": {
    "focus": {"count": 20, "duration": 7200000},
    "communication": {"count": 15, "duration": 3600000}
  },
  "peak_hours": ["9:00", "14:00", "16:00"],
  "insights": [
    "High productivity period with 78% focused work",
    "Most time spent on focus activities (120 minutes)"
  ],
  "recommendations": [
    "Schedule important work during peak hours: 9:00 - 14:00",
    "Consider reducing distractions during low-productivity periods"
  ]
}
```

#### `GET /api/activity/captures?limit=50`
Get recent capture history (without screenshot data).

## 🧠 AI Analysis

### Gemini Integration

The system uses Google's Gemini AI for intelligent activity analysis:

```javascript
const analysisPrompt = `
Analyze this screenshot to categorize the user's current activity.

Provide your analysis in this exact JSON format:
{
  "category": "one of: Focus, Communication, Research, Break, Creative, Other",
  "activity_title": "brief descriptive title (max 50 chars)",
  "confidence": 0.85,
  "details": {
    "primary_application": "main app being used",
    "content_type": "type of content (code, document, web, etc.)",
    "productivity_indicator": "high/medium/low",
    "distraction_level": "low/medium/high"
  },
  "insights": "brief insight about the activity pattern"
}
`;
```

### Privacy Considerations

- **Privacy Mode**: When enabled, only aggregated data is stored
- **Local Processing**: Screenshots analyzed locally, not sent to cloud
- **Hash-based Deduplication**: Screenshots identified by hash, not content
- **User Control**: Complete control over data collection and retention

## 📊 Database Schema

### Activities Table
```sql
CREATE TABLE activities (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration_ms INTEGER DEFAULT 0,
    project_id TEXT,
    project_name TEXT,
    status TEXT DEFAULT 'active',
    metadata TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### Activity Captures Table
```sql
CREATE TABLE activity_captures (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    screenshot_hash TEXT,
    analysis_category TEXT,
    analysis_confidence REAL,
    productivity_indicator TEXT,
    distraction_level TEXT,
    primary_application TEXT,
    content_type TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL
);
```

### Settings Table
```sql
CREATE TABLE activity_settings (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,
    capture_interval INTEGER DEFAULT 900000,
    enable_ai_analysis BOOLEAN DEFAULT true,
    privacy_mode BOOLEAN DEFAULT false,
    activity_categories TEXT DEFAULT 'Focus,Communication,Research,Break,Creative,Other',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

## 🔒 Security & Performance

### Security Features
- **API Key Encryption**: Gemini API keys stored using Electron's safeStorage
- **User Isolation**: All data scoped to authenticated user ID
- **No Screenshot Storage**: Screenshots not persisted, only analyzed
- **Hash-based Tracking**: Content identified by cryptographic hash

### Performance Optimizations
- **Efficient Image Processing**: Uses Sharp for optimal screenshot compression
- **Lazy Loading**: AI analysis only when enabled
- **Memory Management**: Limited capture history (100 items max)
- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connections

## 🧪 Testing

Run the integration test:

```bash
node test-activity-integration.js
```

This will test:
- Service initialization
- Settings management  
- Screenshot capture
- AI analysis (if configured)
- Activity tracking workflow
- Insights generation
- Data persistence

## 🚀 Deployment

### Prerequisites
1. **Gemini API Key**: Configure for AI analysis
2. **System Permissions**: Screen capture permissions on macOS
3. **Sharp Module**: `npm install sharp` for optimal image processing

### Configuration Steps
1. Set up Gemini API key in Glass settings
2. Configure capture intervals in activity settings
3. Enable/disable privacy mode as needed
4. Start tracking from the web interface or API

## 🔄 Integration Points

### Existing Glass Features
- **Ask Service**: Creates activity entries from manual captures
- **Research Service**: PDF reading sessions tracked as research activities
- **Listen Service**: Meeting summaries integrated with communication tracking
- **Settings Service**: Activity settings managed through Glass settings system

### Extension Points
- **Custom Categories**: Add domain-specific activity types
- **Plugin System**: Custom analysis providers beyond Gemini
- **Webhook Integration**: Real-time activity notifications
- **Export System**: Activity data export for external analysis

## 📈 Roadmap

### Near Term
- [ ] Activity goal tracking and notifications
- [ ] Enhanced web dashboard with charts
- [ ] Activity pattern learning and suggestions
- [ ] Integration with calendar systems

### Future Enhancements
- [ ] Multi-monitor support for screenshot capture
- [ ] Advanced privacy controls and data encryption
- [ ] Machine learning for personalized insights
- [ ] Team productivity analytics (enterprise)
- [ ] Integration with time tracking tools

## 🤝 Contributing

The activity tracking system follows Glass's established patterns:

1. **Service Layer**: Business logic and orchestration
2. **Repository Pattern**: Data access abstraction
3. **IPC Bridge**: Secure main/renderer communication
4. **Web API**: RESTful endpoints for web interface

When extending the system:
- Follow the existing service patterns
- Add comprehensive error handling
- Include appropriate logging
- Write integration tests
- Update documentation

---

**🎯 The Activity Tracking System provides Glass with powerful, privacy-conscious productivity insights through intelligent automation and AI analysis.**