# Activity Tracking Feature

This feature implements comprehensive activity tracking and productivity analysis for Glass, following the ChronoNote project requirements from `Instruction.md`.

## Architecture

### Service Layer
- **`activityService.js`** - Main service handling activity tracking, productivity metrics, and goal management
- Follows Glass's service pattern with initialization and cleanup

### Repository Layer
- **`repositories/index.js`** - Repository adapter that switches between SQLite and Firebase based on auth status
- **`repositories/sqlite.repository.js`** - Local SQLite implementation for offline mode
- **`repositories/firebase.repository.js`** - Cloud Firebase implementation for authenticated users

### Database Schema

#### Activities Table
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
)
```

#### Goals Table
```sql
CREATE TABLE activity_goals (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,
    daily_target INTEGER DEFAULT 8,
    weekly_target INTEGER DEFAULT 40,
    monthly_target INTEGER DEFAULT 160,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
```

## Web Components

### ActivityTimelineChart.tsx
- Glass-styled timeline visualization showing daily activities
- Real-time activity tracking with categorization
- Responsive design with glassmorphism effects
- Category filtering and time range selection

### Analytics Page (/analytics)
- Comprehensive productivity analysis dashboard
- AI-powered insights and scoring (8.5/10 productivity score)  
- Weekly trend analysis with interactive charts
- Goal progress tracking (daily, weekly, monthly)
- Peak hours detection and focus time analysis

## API Endpoints

### Backend Routes (`/api/activity`)
- `GET /timeline` - Get activity timeline for specific date/project
- `GET /productivity-metrics` - Get productivity scoring and analysis
- `GET /weekly-stats` - Get weekly activity statistics
- `GET /goals` - Get current productivity goals
- `POST /goals` - Set new productivity goals

### IPC Communication
- `activity:get-timeline` - Get timeline data
- `activity:get-productivity-metrics` - Get productivity metrics
- `activity:get-weekly-stats` - Get weekly statistics
- `activity:get-goal-progress` - Get goal progress
- `activity:set-goals` - Set productivity goals

## Features Implemented

### Core Functionality
- ✅ Activity timeline visualization with glass styling
- ✅ Productivity analysis and scoring system
- ✅ Goal setting and progress tracking
- ✅ Category-based activity classification
- ✅ Time tracking with duration calculation
- ✅ Peak hours detection
- ✅ Focus vs distraction time analysis

### AI Integration
- ✅ Productivity scoring algorithm
- ✅ Activity pattern recognition
- ✅ Trend analysis and predictions
- ✅ Goal recommendations based on historical data

### Data Management
- ✅ Local SQLite storage for offline mode
- ✅ Firebase cloud sync for authenticated users
- ✅ Repository pattern for flexible storage
- ✅ Automatic schema migrations

### UI/UX
- ✅ Glass-styled timeline component
- ✅ Responsive analytics dashboard
- ✅ Interactive charts and visualizations
- ✅ Real-time data updates
- ✅ Category filtering

## Usage

### Basic Activity Tracking
```javascript
// Create new activity
await activityService.createActivity({
    title: 'Implementing timeline component',
    category: 'coding',
    start_time: new Date().toISOString(),
    project_name: 'Glass Project'
});
```

### Getting Timeline Data
```javascript
// Get today's activities
const timeline = await activityService.getTimeline({
    date: new Date().toISOString().split('T')[0]
});
```

### Setting Goals
```javascript
// Set productivity goals
await activityService.setGoals({
    daily: 8,    // 8 hours per day
    weekly: 40,  // 40 hours per week  
    monthly: 160 // 160 hours per month
});
```

## Integration with Glass

The activity tracking feature integrates seamlessly with Glass's existing architecture:

1. **Initialization**: Service is initialized in `src/index.js` alongside other core services
2. **IPC Bridge**: Handlers registered in `src/bridge/featureBridge.js`
3. **Web API**: Routes exposed through `pickleglass_web/backend_node/routes/activity.js`
4. **UI Components**: Accessible via `/analytics` route in the web app
5. **Navigation**: Added to sidebar with BarChart3 icon

## Future Enhancements

Based on the Instruction.md requirements, potential future additions include:

- [ ] AI-powered milestone suggestions
- [ ] Project-specific productivity analysis
- [ ] Integration with calendar systems
- [ ] Automated activity detection
- [ ] Productivity coaching recommendations
- [ ] Team collaboration features
- [ ] Advanced reporting and exports