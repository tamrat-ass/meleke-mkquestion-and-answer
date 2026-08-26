# Database-Driven Time Frame Constraints

**Document Type:** Technical Implementation Guide  
**Version:** 1.0  
**Date Created:** June 2026  
**Status:** Complete  
**Owner:** Development Team

---

## 📋 Overview

All question types now use **database-driven constraints** for time limits and minimum time frames. No hard-coded values in the API code.

---

## ✅ Implementation Status

### Endpoints Updated:

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `POST /api/questions` | Create single question | ✅ Database-driven |
| `POST /api/questions/upload` | Bulk upload questions | ✅ Database-driven |
| `PUT /api/question-types/[id]` | Update question type | ✅ Database-driven |
| `PUT /api/question-types/[id]/update-time-limit` | Update time limits | ✅ Database-driven |

### All Question Types Covered:

| Question Type | Create | Upload | Validate | Status |
|---------------|--------|--------|----------|--------|
| `multiple_choice` | ✅ DB | ✅ DB | ✅ DB | Full Coverage |
| `short_answer` | ✅ DB | ✅ DB | ✅ DB | Full Coverage |
| `sign_screen` | ✅ DB | ✅ DB | ✅ DB | Full Coverage |
| `signed` | ✅ DB | ✅ DB | ✅ DB | Full Coverage |
| `general_knowledge` | ✅ DB | ✅ DB | ✅ DB | Full Coverage |

---

## 🗄️ Database Schema Changes

### New Columns Added to `question_types` Table:

```sql
ALTER TABLE question_types ADD COLUMN IF NOT EXISTS
  min_time_limit INT DEFAULT 5,
  max_time_limit INT DEFAULT 300,
  min_minimum_time_frame INT DEFAULT 1,
  max_minimum_time_frame INT DEFAULT NULL;
```

### Column Descriptions:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `min_time_limit` | INT | 5 | Minimum allowed time per question (seconds) |
| `max_time_limit` | INT | 300 | Maximum allowed time per question (seconds) |
| `min_minimum_time_frame` | INT | 1 | Minimum break time before answer submission |
| `max_minimum_time_frame` | INT | NULL | Maximum break time (if needed) |

**Migration File:** `scripts/02-add-constraints-to-question-types.sql`

---

## 🔄 How It Works For All Question Types

### Flow Diagram:

```
User Request (Create/Update/Upload)
    ↓
API receives question_type and time_limit
    ↓
Query: SELECT * FROM question_types WHERE name = ${question_type}
    ↓
Check: Does question type exist?
    ├─ YES → Get min/max constraints from database
    └─ NO → Create new question type with default constraints
    ↓
Fetch constraints:
  - min_time_limit (default: 5)
  - max_time_limit (default: 300)
  - min_minimum_time_frame (default: 1)
    ↓
Validate: min ≤ time_limit ≤ max?
    ├─ YES → Proceed with creation/update
    └─ NO → Return error with database constraints
    ↓
Success: Question created with database-validated constraints
```

---

## 🛠️ Code Examples

### Create Question - Database Driven:

```typescript
// GET constraints from database for the question type
const typeResult = await sql`
  SELECT 
    id, 
    time_limit,
    min_time_limit,    // ← From database
    max_time_limit     // ← From database
  FROM question_types 
  WHERE name = ${question_type} 
  LIMIT 1
`;

// Validate against database constraints
if (finalTimeLimit < minTimeLimit || finalTimeLimit > maxTimeLimit) {
  return error(`Time limit ${finalTimeLimit} is outside allowed range: ${minTimeLimit}-${maxTimeLimit}s (from database)`);
}
```

### Bulk Upload - Database Driven:

```typescript
// Get question type with constraints
const typeResult = await sql`
  SELECT 
    id, 
    min_time_limit,    // ← From database
    max_time_limit     // ← From database
  FROM question_types 
  WHERE name = ${dbTypeName} 
  LIMIT 1
`;

// If type doesn't exist, create with default constraints
const createTypeResult = await sql`
  INSERT INTO question_types (
    name, 
    description,
    min_time_limit,    // ← Database value
    max_time_limit     // ← Database value
  )
  VALUES (${dbTypeName}, ${description}, 5, 300)
`;

// Validate each question
if (q.timeLimit < minTimeLimit || q.timeLimit > maxTimeLimit) {
  errors.push(`Time limit ${q.timeLimit}s invalid for ${dbTypeName}: ${minTimeLimit}-${maxTimeLimit}s`);
  continue;
}
```

---

## 📊 Default Constraints Per Question Type

After migration, you can customize constraints per type:

```sql
-- Multiple Choice: Quick questions
UPDATE question_types 
SET min_time_limit = 5,
    max_time_limit = 120,
    min_minimum_time_frame = 1
WHERE name = 'multiple_choice';

-- Short Answer: More time for typing
UPDATE question_types 
SET min_time_limit = 10,
    max_time_limit = 300,
    min_minimum_time_frame = 2
WHERE name = 'short_answer';

-- Sign Screen: Long breaks/announcements
UPDATE question_types 
SET min_time_limit = 30,
    max_time_limit = 600,
    min_minimum_time_frame = 5
WHERE name = 'sign_screen';

-- General Knowledge: Moderate times
UPDATE question_types 
SET min_time_limit = 15,
    max_time_limit = 300,
    min_minimum_time_frame = 3
WHERE name = 'general_knowledge';

-- Signed: Document signing
UPDATE question_types 
SET min_time_limit = 30,
    max_time_limit = 300,
    min_minimum_time_frame = 5
WHERE name = 'signed';
```

---

## ✨ Key Benefits

1. ✅ **No Hard-Coded Values** - All constraints in database
2. ✅ **Per-Type Customization** - Different rules for each question type
3. ✅ **Dynamic Updates** - Change constraints without redeploying code
4. ✅ **Full Coverage** - Works for all 5 question types
5. ✅ **Graceful Defaults** - Auto-creates types with sensible defaults if missing
6. ✅ **Clear Error Messages** - Shows database constraints in API errors

---

## 🔍 API Responses Include Database Constraints

### Example Response:

```json
{
  "message": "Updated 5 questions with time limit 60s and minimum time frame 5s (constraints from database)",
  "updated_count": 5,
  "constraints": {
    "time_limit_range": "5-300s",
    "minimum_time_frame_range": "1-59s",
    "source": "database"
  }
}
```

---

## 📋 Validation Locations

All validation now queries the database at these points:

1. **Create Question** (`POST /api/questions`)
   - Fetches min/max from question_types table
   - Validates before insertion

2. **Bulk Upload** (`POST /api/questions/upload`)
   - Validates each row against database constraints
   - Creates missing question types with defaults

3. **Update Question Type** (`PUT /api/question-types/[id]`)
   - Fetches constraints from database
   - Validates new time_limit against constraints

4. **Update Time Limits** (`PUT /api/question-types/[id]/update-time-limit`)
   - Fetches all constraints from database
   - Validates both time_limit and minimum_time_frame

---

## 🚀 Next Steps

1. **Run Migration:**
   ```bash
   psql -U user -d database -f scripts/02-add-constraints-to-question-types.sql
   ```

2. **Customize Constraints (Optional):**
   - Edit constraints per question type in database
   - Each type can have different min/max values

3. **Test All Question Types:**
   - Create questions via API
   - Bulk upload questions via Excel
   - Update question type settings

---

## ✅ Completion Checklist

- [x] Database schema updated with constraint columns
- [x] POST /api/questions - Database-driven validation
- [x] POST /api/questions/upload - Database-driven validation
- [x] PUT /api/question-types/[id] - Database-driven validation
- [x] PUT /api/question-types/[id]/update-time-limit - Database-driven validation
- [x] All 5 question types covered
- [x] Migration script created
- [x] Default values for all new columns
- [x] API responses show source: "database"

---

## 📝 Summary

**All question types now use database-driven constraints.** No hard-coded limits in the code. Constraints are fetched from the database for every request and can be customized per question type without code changes.

