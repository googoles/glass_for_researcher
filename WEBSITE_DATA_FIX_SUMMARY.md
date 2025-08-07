# Glass Website Data Display - Issue Fixed

## Problem
Activities were being created and logged in the console:
```
[Activity SQLite Repository] Created activity: fe6897df-e1fd-401a-96e8-f027422a7141
```

But the data wasn't showing on the website activity page.

## Root Cause
The website activity page was calling the wrong API endpoint:
- **Expected:** `/api/activity/sessions` (for activities)
- **Actual:** `/api/conversations` (for chat sessions)

The page was using `getSessions()` instead of `getActivities()`, so it was fetching conversation data instead of activity data.

## Solution Applied

### 1. Added Activity API Function
**File:** `pickleglass_web/utils/api.ts`
- Added `Activity` interface
- Added `getActivities()` function that calls `/api/activity/sessions`

### 2. Updated Activity Page
**File:** `pickleglass_web/app/activity/page.tsx`
- Changed from `getSessions()` to `getActivities()`
- Updated state from `sessions` to `activities`
- Modified UI to display activity properties:
  - `activity.title` instead of `session.title`
  - `activity.category` instead of `session.session_type`
  - `activity.created_at` instead of `session.started_at`
  - `activity.status` for completion status
- Removed delete functionality (not implemented for activities)
- Updated loading and empty state messages

### 3. Fixed Data Flow
The complete data flow now works correctly:
1. **Create Activity:** Ask queries create activities via `_createAskActivity()`
2. **Store in DB:** Activities saved to SQLite with proper uid
3. **Web API:** `/api/activity/sessions` calls `activity:get-activities` IPC
4. **Backend:** IPC calls `activityService.getActivities()`
5. **Repository:** Queries SQLite with correct uid via adapter
6. **Frontend:** Displays activities with proper UI

## Activity Data Structure
```typescript
interface Activity {
  id: string;
  uid: string;
  title: string;
  category: string; // e.g., "research", "focus", etc.
  start_time: string;
  end_time?: string;
  duration_ms: number;
  status: string; // e.g., "completed", "active"
  metadata?: any;
  created_at: string;
  updated_at?: string;
}
```

## Testing the Fix

### 1. Create Activities
```bash
# In the Electron app
# Click camera button or use shortcut (Cmd+Shift+C)
# This creates activities via Ask service
```

### 2. Check Website
```bash
# Start web app
cd pickleglass_web
npm run dev

# Navigate to http://localhost:3000/activity
# Should now show activities instead of empty page
```

### 3. Verify in Browser DevTools
```javascript
// Check network tab for correct API calls
// Should see: GET /api/activity/sessions
// Should NOT see: GET /api/conversations
```

## Key Changes Summary

| Component | Before | After |
|-----------|--------|-------|
| API Function | `getSessions()` | `getActivities()` |
| Endpoint | `/api/conversations` | `/api/activity/sessions` |
| Data Type | Chat Sessions | Activity Records |
| UI Display | Session titles | Activity titles + categories |
| Empty State | "No sessions" | "No activities" |

## Result
✅ Activities created by the Electron app now properly display on the website activity page.

The issue was purely a frontend routing problem - the backend was working correctly, but the web UI was looking in the wrong place for data.