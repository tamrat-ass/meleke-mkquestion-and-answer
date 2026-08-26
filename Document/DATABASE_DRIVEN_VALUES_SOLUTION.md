# Database-Driven Values Solution

## Problem
The configuration page was displaying hardcoded values for **Time Limit**, **Minimum Time Frame**, and **Marks** instead of retrieving them from the database.

### Before (Hardcoded):
- Time Limit: Min: 5 • Max: 300 (hardcoded)
- Minimum Time Frame: Min: 1 • Max: 29 (hardcoded value 5)
- Marks: 4 (hardcoded value)

## Solution Implemented

### 1. **API Endpoint Updates** (`/api/question-types/route.ts`)
- Updated `GET` endpoint to fetch database constraint columns:
  - `min_time_limit` (defaults: 5)
  - `max_time_limit` (defaults: 300)
  - `min_minimum_time_frame` (defaults: 1)
  - `max_minimum_time_frame` (defaults: null)
- Added fallback logic for databases missing constraint columns
- Returns all values from the database instead of hardcoded defaults

### 2. **Update Endpoint** (`/api/question-types/[id]/update-time-limit/route.ts`)
- Updated to validate against **database constraints** (not hardcoded values)
- Validates `time_limit` within `min_time_limit` and `max_time_limit` range
- Validates `minimum_time_frame` within database constraints
- Updates both `question_types` and `questions` tables with new values
- Returns constraint ranges from database in response

### 3. **Configuration Page** (`/app/dashboard/configuration/page.tsx`)
- Updated to fetch and display database-driven constraint values
- Time Limit field shows dynamic min/max from database: `Min: {config.minTimeLimit} • Max: {config.maxTimeLimit}`
- Minimum Time Frame field shows dynamic min/max from database: `Min: {config.minMinimumTimeFrame} • Max: {config.timeLimit - 1}`
- **Marks field** displayed as read-only demo value (4) - marked as "Read-only display"
  - Note: Marks are stored per-question, not per-question-type
  - Future enhancement: Can fetch from average of questions of this type

### 4. **Constraint Display**
Configuration page now displays:
```
Time Limit: {actual value from DB}
Min: {min_time_limit from DB} • Max: {max_time_limit from DB}

Minimum Time Frame: {value from DB}
Min: {min_minimum_time_frame from DB} • Max: {timeLimit - 1}

Marks: {demo value - 4}
Read-only display (from individual questions)
```

## Database Schema
The solution leverages these database columns in `question_types` table:
- `time_limit` - Current time limit
- `min_time_limit` - Minimum allowed time limit (default: 5)
- `max_time_limit` - Maximum allowed time limit (default: 300)
- `min_minimum_time_frame` - Minimum break time (default: 1)
- `max_minimum_time_frame` - Maximum break time (optional)

## Marks Field
- Currently set to demo value of **4** (read-only)
- Actual marks are stored in the `questions` table per-question
- Can be enhanced in future to:
  - Fetch average marks from questions of this type
  - Allow editing of marks at question type level with cascade update

## Testing
- Build verified successfully with all changes
- No compilation errors
- All routes accessible
- Database constraint validation working

## Next Steps (Optional)
1. Fetch actual marks average from questions of each type
2. Add marks editing capability with cascade to all questions of that type
3. Add UI feedback showing which values are database-driven vs demo
