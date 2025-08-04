# Enhanced Research Backend Services

This document describes the enhanced research backend services that provide comprehensive project management, Zotero integration, AI-powered analytics, and real-time tracking capabilities.

## Architecture Overview

The research backend follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Express Routes)               │
├─────────────────────────────────────────────────────────────┤
│                    IPC Bridge (Electron)                   │
├─────────────────────────────────────────────────────────────┤
│                 Research Service (Core Logic)              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   Project    │ │  Analytics   │ │   Zotero     │       │
│  │   Service    │ │   Service    │ │   Service    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    Cache Service                            │
├─────────────────────────────────────────────────────────────┤
│               Repository Layer (Data Access)               │
│  ┌──────────────┐           ┌──────────────┐              │
│  │   SQLite     │           │   Firebase   │              │
│  │  Repository  │           │  Repository  │              │
│  └──────────────┘           └──────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Research Service (`researchService.js`)

The main orchestrator that coordinates all research-related functionality:

- **Project Management**: CRUD operations for research projects
- **Session Tracking**: Automatic PDF detection and session management
- **AI Analysis**: Screenshot capture and productivity analysis
- **Real-time Updates**: Event emission for live UI updates
- **Caching**: Intelligent caching for performance optimization

### 2. Project Service (`services/projectService.js`)

Manages research projects with comprehensive features:

- **Project CRUD**: Create, read, update, delete projects
- **Goal Tracking**: Set and monitor project goals
- **Progress Analysis**: Calculate project health scores
- **Zotero Integration**: Link projects to academic papers
- **Statistics**: Detailed project analytics and insights

### 3. Analytics Service (`services/analyticsService.js`)

Provides comprehensive analytics and insights:

- **Session Analytics**: Detailed analysis of research sessions
- **Productivity Trends**: Track productivity over time
- **Focus Quality**: Analyze concentration patterns
- **Activity Patterns**: Identify optimal work times
- **Insights Generation**: AI-powered recommendations

### 4. Zotero Service (`services/zoteroService.js`)

Integrates with Zotero for academic paper management:

- **API Integration**: Secure connection to Zotero API
- **Paper Management**: Fetch and search academic papers
- **Collection Support**: Access Zotero collections
- **Citation Formatting**: Generate formatted citations
- **Smart Matching**: Find papers by title similarity

### 5. Cache Service (`services/cacheService.js`)

Provides intelligent caching for performance:

- **In-Memory Caching**: Fast access to frequently used data
- **TTL Support**: Automatic expiration of cached data
- **Pattern Matching**: Efficient cache invalidation
- **Statistics**: Cache hit/miss rate monitoring

## API Endpoints

### Project Management

```http
# Get all projects
GET /api/research/projects?status=active&limit=50

# Create new project
POST /api/research/projects
{
  "name": "Research Project",
  "description": "Project description",
  "tags": ["research", "ai"],
  "priority": "high",
  "goals": [...]
}

# Get specific project
GET /api/research/projects/:projectId

# Update project
PUT /api/research/projects/:projectId
{
  "description": "Updated description",
  "status": "active"
}

# Delete project
DELETE /api/research/projects/:projectId

# Set current project
POST /api/research/projects/:projectId/set-current

# Get project sessions
GET /api/research/projects/:projectId/sessions

# Get project analytics
GET /api/research/projects/:projectId/analytics?timeframe=7d

# Get project progress
GET /api/research/projects/:projectId/progress
```

### Zotero Integration

```http
# Sync project with Zotero
POST /api/research/projects/:projectId/sync-zotero

# Link project to Zotero paper
POST /api/research/projects/:projectId/link-zotero
{
  "zoteroKey": "ABCD1234"
}
```

### Analytics

```http
# Get comprehensive analytics
GET /api/research/analytics?timeframe=7d&projectId=optional

# Get productivity trends
GET /api/research/analytics/productivity-trends?timeframe=30d

# Get session analytics
GET /api/research/sessions/:sessionId/analytics
```

### Real-time Updates

```http
# Get recent updates (for polling)
GET /api/research/updates?since=1641234567890
```

## Database Schema

### Projects Table
```sql
CREATE TABLE research_projects (
  id TEXT PRIMARY KEY,
  uid TEXT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  tags TEXT DEFAULT '[]',
  zotero_key TEXT,
  metadata TEXT DEFAULT '{}',
  goals TEXT DEFAULT '[]',
  deadline DATETIME,
  priority TEXT DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Enhanced Sessions Table
```sql
-- Added project_id column
ALTER TABLE research_sessions ADD COLUMN project_id TEXT;
```

## Key Features Implemented

### ✅ Project Management
- Full CRUD operations for research projects
- Project goals and progress tracking
- Project health scoring with recommendations
- Project archiving and restoration

### ✅ Zotero Integration
- Secure API connection with credential management
- Paper search and retrieval
- Smart title matching for PDF detection
- Collection and attachment support
- Automatic project linking to papers

### ✅ Advanced Analytics
- Session-level analytics with AI insights
- Productivity trend analysis
- Focus quality assessment
- Peak performance hour identification
- Distraction pattern analysis

### ✅ Intelligent Caching
- Multi-level caching for performance
- TTL-based cache expiration
- Cache hit/miss statistics
- Pattern-based cache invalidation

### ✅ Real-time Updates
- Event-driven architecture
- Live productivity updates
- Project status changes
- Session lifecycle events

### ✅ Enhanced API
- RESTful API design
- Comprehensive error handling
- Input validation and sanitization
- Rate limiting ready

### ✅ Database Improvements
- Enhanced schema with project support
- Efficient queries with proper indexing
- Support for both SQLite and Firebase
- Automatic migrations

## Usage Examples

### Creating a Research Project

```javascript
// Via API
const project = await fetch('/api/research/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Machine Learning Research',
    description: 'Investigating neural network architectures',
    tags: ['ml', 'ai', 'research'],
    priority: 'high',
    goals: [{
      title: 'Complete 20 research sessions',
      target_value: 20,
      unit: 'sessions'
    }]
  })
});

// Via IPC (Electron)
const project = await ipcRenderer.invoke('research:create-project', {
  name: 'Machine Learning Research',
  description: 'Investigating neural network architectures',
  tags: ['ml', 'ai', 'research'],
  priority: 'high'
});
```

### Getting Analytics

```javascript
// Get comprehensive analytics
const analytics = await fetch('/api/research/analytics?timeframe=7d&projectId=abc123');
const data = await analytics.json();

console.log(data.data); // Analytics object with sessions, productivity, insights
```

### Linking to Zotero

```javascript
// Link project to Zotero paper
await fetch(`/api/research/projects/${projectId}/link-zotero`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    zoteroKey: 'ZOTERO_ITEM_KEY'
  })
});
```

## Performance Optimizations Implemented

### 1. Intelligent Caching
- Screenshot analysis results cached for 5 minutes
- Analytics cached for 10 minutes
- Project data cached in memory
- Automatic cache invalidation

### 2. Efficient Queries
- Indexed database queries
- Batched Firebase operations
- Lazy loading of large datasets
- Connection pooling

### 3. Memory Management
- Limited in-memory history (100 items max)
- Periodic cleanup of old data
- Efficient data structures
- Memory usage monitoring

## Security Features

### 1. Data Protection
- User ID validation on all operations
- Encrypted API key storage
- Secure Firebase rules
- Input validation and sanitization

### 2. API Security
- Authentication required for all endpoints
- Rate limiting implementation
- CORS configuration
- Error message sanitization

## Testing

A comprehensive test suite is included (`test-research-backend.js`) that validates:

- ✅ Project CRUD operations
- ✅ Analytics generation
- ✅ Caching functionality
- ✅ API endpoint responses
- ✅ Error handling
- ✅ Data validation

Run tests with:
```bash
node test-research-backend.js
```

## File Structure

```
src/features/research/
├── researchService.js           # Main service orchestrator
├── services/
│   ├── cacheService.js         # Intelligent caching
│   ├── projectService.js       # Project management
│   ├── analyticsService.js     # Analytics and insights
│   └── zoteroService.js        # Zotero integration
├── repositories/
│   ├── index.js                # Repository adapter
│   ├── sqlite.repository.js    # SQLite implementation
│   └── firebase.repository.js  # Firebase implementation
└── ai/
    ├── analysisService.js      # AI analysis (existing)
    └── ...                     # Other AI components

pickleglass_web/backend_node/routes/
└── research.js                 # Enhanced API routes

src/bridge/
└── featureBridge.js           # Enhanced IPC handlers
```

## Dependencies Added

```json
{
  "uuid": "^10.0.0",
  "node-cache": "^5.1.2"
}
```

## Next Steps for Production

1. **Install Dependencies**:
   ```bash
   npm install uuid node-cache
   ```

2. **Run Tests**:
   ```bash
   node test-research-backend.js
   ```

3. **Configure Settings**: Update Zotero credentials in settings

4. **Deploy**: The enhanced services are backward compatible

5. **Monitor**: Use built-in logging and cache statistics

## Migration Notes

- ✅ **Backward Compatible**: Existing functionality preserved
- ✅ **Automatic Migrations**: Database schema updates automatically
- ✅ **Graceful Fallbacks**: Services degrade gracefully if components fail
- ✅ **Zero Downtime**: Can be deployed without service interruption

The enhanced research backend provides a robust foundation for academic research management with modern software engineering practices, comprehensive testing, and production-ready features.