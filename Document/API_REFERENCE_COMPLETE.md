# Complete API Reference Guide

**Platform:** Q&A Game Platform  
**Version:** 1.0  
**Base URL:** `http://localhost:3000`  
**Authentication:** Session-based (Cookie + localStorage)

---

## 📑 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Game Management APIs](#game-management-apis)
3. [Round Management APIs](#round-management-apis)
4. [Question Management APIs](#question-management-apis)
5. [Question Type Configuration APIs](#question-type-configuration-apis)
6. [Dashboard & Analytics APIs](#dashboard--analytics-apis)
7. [User Management APIs](#user-management-apis)
8. [Permissions APIs](#permissions-apis)
9. [Activity Log APIs](#activity-log-apis)
10. [Game Answer APIs](#game-answer-apis)

---

## 🔐 Authentication APIs

### 1. Login
**Endpoint:** `POST /api/auth/login`  
**Purpose:** Authenticate user and create session

**Use Cases:**
- User login with email & password
- Generate session token
- Store authentication state

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role_name": "admin"
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing email/password

**Business Logic:**
1. Validate email format
2. Check if user exists
3. Compare password hash (bcryptjs)
4. Create session token
5. Return user data

---

### 2. Sign Up
**Endpoint:** `POST /api/auth/signup`  
**Purpose:** Register new user account

**Use Cases:**
- New user registration
- Create player/teacher accounts
- Initialize user profile

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "New User"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "email": "newuser@example.com",
    "full_name": "New User",
    "role_name": "player"
  },
  "message": "User created successfully"
}
```

**Validation:**
- Email must be unique
- Password minimum 6 characters
- Full name required

**Default Behavior:**
- New users assigned "player" role
- Password hashed with bcryptjs (10 rounds)
- Account activated immediately

---

### 3. Reset Password
**Endpoint:** `POST /api/auth/reset-password`  
**Purpose:** Change user password

**Use Cases:**
- User-initiated password reset
- Forgot password functionality
- Security password change

**Request:**
```json
{
  "email": "user@example.com",
  "new_password": "newpassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Security Notes:**
- Validates email exists
- Hashes new password
- Invalidates old sessions
- No notification (can add email later)

---

## 🎮 Game Management APIs

### 4. Get All Games
**Endpoint:** `GET /api/games`  
**Purpose:** Retrieve list of all games

**Use Cases:**
- Display games on dashboard
- Game selection for playing
- Admin game management page
- List games by status filter

**Query Parameters:**
```
?status=active
?limit=20
?offset=0
```

**Response (200 OK):**
```json
{
  "games": [
    {
      "id": "game-1",
      "name": "Quiz Game 1",
      "round_id": "round-1",
      "round_name": "Round 1",
      "status": "active",
      "created_at": "2026-01-15T10:30:00Z",
      "teams": 2
    }
  ]
}
```

**Business Logic:**
- Fetch from database with pagination
- Join with rounds table for round_name
- Count teams for each game
- Filter by status if provided

---

### 5. Create Game
**Endpoint:** `POST /api/games`  
**Purpose:** Create new game instance

**Use Cases:**
- Teacher creates quiz game
- Set up new game session
- Assign round to game
- Add team groups

**Request:**
```json
{
  "name": "Science Quiz Game",
  "round_id": "round-1",
  "groups": [
    { "name": "Team A" },
    { "name": "Team B" },
    { "name": "Team C" }
  ]
}
```

**Response (201 Created):**
```json
{
  "game": {
    "id": "game-123",
    "name": "Science Quiz Game",
    "round_id": "round-1",
    "status": "draft"
  },
  "message": "Game created successfully"
}
```

**Validation:**
- Round must exist
- Game name required (min 3 chars)
- At least 1 team required

**Database Operations:**
1. Insert into games table
2. Create teams/groups
3. Set status to "draft"
4. Return game ID

---

### 6. Get Game by ID
**Endpoint:** `GET /api/games/:id`  
**Purpose:** Retrieve specific game details

**Use Cases:**
- View game configuration
- Edit game settings
- Display game with teams
- Pre-game setup screen

**Parameters:**
- `id` - Game UUID

**Response (200 OK):**
```json
{
  "game": {
    "id": "game-1",
    "title": "Quiz Game 1",
    "status": "active",
    "created_at": "2026-01-15T10:30:00Z",
    "round_id": "round-1",
    "round_name": "Round 1"
  },
  "groups": [
    {
      "id": "group-1",
      "name": "Team A"
    },
    {
      "id": "group-2",
      "name": "Team B"
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Game not found"
}
```

---

### 7. Update Game
**Endpoint:** `PUT /api/games/:id`  
**Purpose:** Modify game configuration

**Use Cases:**
- Change game title
- Update game status (draft → active → completed)
- Reassign round
- Update teams

**Request:**
```json
{
  "title": "Updated Game Name",
  "round_id": "round-2",
  "status": "active"
}
```

**Response (200 OK):**
```json
{
  "game": {
    "id": "game-1",
    "title": "Updated Game Name",
    "status": "active",
    "created_at": "2026-01-15T10:30:00Z"
  },
  "message": "Game updated successfully"
}
```

**Authorization:**
- Admin can update any game
- Teacher can update own games

---

### 8. Delete Game
**Endpoint:** `DELETE /api/games/:id`  
**Purpose:** Remove game from system

**Use Cases:**
- Delete test games
- Clean up old games
- Admin game cleanup

**Response (200 OK):**
```json
{
  "message": "Game deleted successfully"
}
```

**Cascade Behavior:**
- Deletes associated teams
- Deletes game answers
- Does NOT delete round or questions

---

### 9. Get Game Teams
**Endpoint:** `GET /api/games/:id/teams`  
**Purpose:** Retrieve all teams in a game

**Use Cases:**
- Display team leaderboard
- Show team scores
- Team management

**Response:**
```json
{
  "teams": [
    {
      "id": "team-1",
      "name": "Team A",
      "game_id": "game-1",
      "score": 45,
      "members": 3
    }
  ]
}
```

---

## 📊 Round Management APIs

### 10. Get All Rounds
**Endpoint:** `GET /api/rounds`  
**Purpose:** List all quiz rounds

**Use Cases:**
- Show available rounds for game creation
- Admin round management
- Dashboard round statistics

**Response (200 OK):**
```json
{
  "rounds": [
    {
      "id": "round-1",
      "name": "Round 1",
      "round_number": 1,
      "description": "First round",
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "round-2",
      "name": "Round 2",
      "round_number": 2,
      "description": "Second round",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

**Business Logic:**
- Ordered by round_number
- Includes question count (optional)
- All rounds even if no questions

---

### 11. Create Round
**Endpoint:** `POST /api/rounds`  
**Purpose:** Create new quiz round

**Use Cases:**
- Create preliminary round
- Create final round
- Organize competition into phases

**Request:**
```json
{
  "name": "Quarter Finals",
  "round_number": 3,
  "description": "Third round of the competition"
}
```

**Response (201 Created):**
```json
{
  "round": {
    "id": "round-3",
    "name": "Quarter Finals",
    "round_number": 3,
    "description": "Third round of the competition",
    "created_at": "2026-01-15T10:30:00Z"
  },
  "message": "Round created successfully"
}
```

**Validation:**
- Round name required
- Round number must be unique
- Description optional

---

### 12. Get Round by ID
**Endpoint:** `GET /api/rounds/:id`  
**Purpose:** Get specific round details

**Response:**
```json
{
  "round": {
    "id": "round-1",
    "name": "Round 1",
    "round_number": 1,
    "description": "First round",
    "created_at": "2026-01-15T10:30:00Z",
    "question_count": 12,
    "games_count": 3
  }
}
```

---

### 13. Update Round
**Endpoint:** `PUT /api/rounds/:id`  
**Purpose:** Modify round details

**Request:**
```json
{
  "name": "Updated Round Name",
  "description": "Updated description",
  "round_number": 2
}
```

**Response (200 OK):**
```json
{
  "round": {
    "id": "round-1",
    "name": "Updated Round Name",
    "round_number": 2,
    "description": "Updated description",
    "created_at": "2026-01-15T10:30:00Z"
  },
  "message": "Round updated successfully"
}
```

---

### 14. Delete Round
**Endpoint:** `DELETE /api/rounds/:id`  
**Purpose:** Remove round from system

**Use Cases:**
- Delete unused rounds
- Clean up test rounds
- Reorganize competition structure

**Safety Check:**
- If questions exist: Return error with count
- If no questions: Delete successfully

**Response (200 OK):**
```json
{
  "message": "Round deleted successfully"
}
```

**Error (409 Conflict):**
```json
{
  "error": "Cannot delete round",
  "message": "This round contains 12 question(s). Please delete or move questions first.",
  "questionsCount": 12
}
```

---

## ❓ Question Management APIs

### 15. Get All Questions
**Endpoint:** `GET /api/questions`  
**Purpose:** List all questions in system

**Use Cases:**
- Question bank view
- Search & filter questions
- Admin question management
- Question review

**Query Parameters:**
```
?round_id=round-1
?question_type=multiple_choice
?search=capital
?limit=20
?offset=0
```

**Response (200 OK):**
```json
{
  "questions": [
    {
      "id": "q-1",
      "title": "What is 2+2?",
      "question_type": "multiple_choice",
      "difficulty": "easy",
      "created_at": "2026-01-15T10:30:00Z",
      "round_id": "round-1",
      "round_name": "Round 1",
      "correct_answer": "A",
      "time_limit": 30,
      "marks": 4,
      "option_a": "4",
      "option_b": "5",
      "option_c": "3",
      "option_d": "6"
    }
  ]
}
```

---

### 16. Create Question
**Endpoint:** `POST /api/questions`  
**Purpose:** Add new question to database

**Use Cases:**
- Manual question creation
- Add question to round
- Create from template
- Build question bank

**Request:**
```json
{
  "question_text": "What is the capital of France?",
  "round_id": "round-1",
  "question_type": "multiple_choice",
  "correct_answer": "A",
  "marks": 4,
  "optionA": "Paris",
  "optionB": "London",
  "optionC": "Berlin",
  "optionD": "Madrid"
}
```

**Response (201 Created):**
```json
{
  "question": {
    "id": "q-123",
    "question_text": "What is the capital of France?",
    "question_type": "multiple_choice",
    "round_id": "round-1",
    "time_limit": 30
  },
  "message": "Question created successfully"
}
```

**Auto-Population:**
- `time_limit` - Inherited from question_type default
- `marks` - Set to 4 (default)
- `created_at` - Current timestamp

**Validation:**
- Question text required (min 10 chars)
- Round must exist
- Question type must exist
- All options required for multiple_choice

---

### 17. Get Question by ID
**Endpoint:** `GET /api/questions/:id`  
**Purpose:** Retrieve specific question details

**Response:**
```json
{
  "question": {
    "id": "q-1",
    "title": "What is 2+2?",
    "question_type": "multiple_choice",
    "correct_answer": "A",
    "time_limit": 30,
    "option_a": "4",
    "option_b": "5",
    "option_c": "3",
    "option_d": "6",
    "round_id": "round-1",
    "marks": 4
  }
}
```

---

### 18. Update Question
**Endpoint:** `PUT /api/questions/:id`  
**Purpose:** Modify question content

**Use Cases:**
- Fix question typo
- Update time limit
- Change correct answer
- Modify options

**Request:**
```json
{
  "question_text": "Updated question text",
  "correct_answer": "B",
  "time_limit": 45,
  "marks": 5,
  "optionA": "Option 1",
  "optionB": "Option 2",
  "optionC": "Option 3",
  "optionD": "Option 4"
}
```

**Response (200 OK):**
```json
{
  "message": "Question updated successfully"
}
```

**Business Logic:**
- Only allows updating certain fields
- Does NOT allow changing question_type
- Preserves creation timestamp

---

### 19. Delete Question
**Endpoint:** `DELETE /api/questions/:id`  
**Purpose:** Remove question from system

**Use Cases:**
- Delete incorrect questions
- Remove duplicates
- Clean up test questions

**Response (200 OK):**
```json
{
  "message": "Question deleted successfully"
}
```

**Cascade Behavior:**
- Deletes associated game answers
- Does NOT delete round
- Recalculates game scores

---

### 20. Get Questions by Round
**Endpoint:** `GET /api/questions/by-round/:roundId`  
**Purpose:** Get all questions for specific round

**Use Cases:**
- Display round questions
- Pre-load round before game
- Question list by round
- Download round questions

**Response (200 OK):**
```json
{
  "questions": [
    {
      "id": "q-1",
      "title": "Question 1",
      "question_type": "multiple_choice",
      "correct_answer": "A",
      "time_limit": 30,
      "options": [
        { "option_key": "A", "option_value": "Option A" },
        { "option_key": "B", "option_value": "Option B" },
        { "option_key": "C", "option_value": "Option C" },
        { "option_key": "D", "option_value": "Option D" }
      ]
    }
  ]
}
```

---

### 21. Bulk Upload Questions
**Endpoint:** `POST /api/questions/upload`  
**Purpose:** Upload multiple questions via Excel file

**Use Cases:**
- Bulk import from Excel
- Add 100+ questions at once
- Quick database population
- Import from external source

**Request:**
```
Content-Type: multipart/form-data

file: <Excel workbook>
round_id: "round-1"
```

**Response (200 OK):**
```json
{
  "message": "12 questions uploaded successfully",
  "uploaded": 12,
  "failed": 0,
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Upload failed",
  "uploaded": 8,
  "failed": 4,
  "errors": [
    "Row 5: Question text is required",
    "Row 7: Invalid question type",
    "Row 12: Options must be 4 for multiple choice"
  ]
}
```

**Excel Format Expected:**
```
| Question Text | Type | Answer | Option A | Option B | Option C | Option D | Marks |
|---|---|---|---|---|---|---|---|
| Capital of France? | multiple_choice | A | Paris | London | Berlin | Madrid | 4 |
```

**Features:**
- Validates each row
- Inherits time_limit from question_type
- Batch insert for performance
- Returns detailed error report

---

### 22. Download Question Template
**Endpoint:** `GET /api/questions/template`  
**Purpose:** Get Excel template for question upload

**Use Cases:**
- User downloads blank template
- Understand Excel format
- Prepare questions offline
- Bulk import workflow

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="questions-template.xlsx"

[Binary Excel File]
```

**Template Contains:**
- Header row with column names
- Sample data row (1 example)
- Instructions sheet
- Data validation for dropdowns

---

### 23. Verify Question
**Endpoint:** `POST /api/questions/verify`  
**Purpose:** Validate question before upload

**Use Cases:**
- Pre-validate questions
- Check for errors before bulk upload
- Verify question format
- Dry-run upload

**Request:**
```json
{
  "question_text": "What is 2+2?",
  "question_type": "multiple_choice",
  "correct_answer": "A",
  "optionA": "4",
  "optionB": "5",
  "optionC": "3",
  "optionD": "6"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "message": "Question is valid",
  "data": {
    "question_text": "What is 2+2?",
    "question_type": "multiple_choice",
    "correct_answer": "A"
  }
}
```

**Error Response:**
```json
{
  "valid": false,
  "errors": [
    "Question text is required",
    "Option D is missing for multiple_choice"
  ]
}
```

---

## 🏷️ Question Type Configuration APIs

### 24. Get All Question Types
**Endpoint:** `GET /api/question-types`  
**Purpose:** List all question types in system

**Use Cases:**
- Display question type options
- Dashboard question type list
- Configuration page
- Game setup

**Response (200 OK):**
```json
{
  "question_types": [
    {
      "id": "type-1",
      "name": "multiple_choice",
      "time_limit": 30,
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "type-2",
      "name": "short_answer",
      "time_limit": 45,
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "type-3",
      "name": "true_or_false",
      "time_limit": 20,
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "type-6",
      "name": "sign_screen",
      "time_limit": 60,
      "created_at": "2026-01-15T10:30:00Z",
      "description": "Full-screen information display - no user input, no scoring"
    }
  ]
}
```

**Supported Question Types:**
- `multiple_choice` - User selects from 4 options (30 sec default)
- `true_or_false` - User selects True/False (20 sec default)
- `short_answer` - User types response (45 sec default)
- `essay` - User types long response (60 sec default)
- `matching` - User matches items (90 sec default)
- `sign_screen` - **NEW** Information display, no input, no scoring (60 sec default)

**Special Note on sign_screen:**
- Informational display only (breaks, transitions, announcements)
- No user input required
- No marks awarded (always 0)
- No game_answers record created
- Time limit typically 30-600 seconds
- Use cases: "Break Time - 2 Minutes", "Section 1 Complete", etc.

**Features:**
- Shows only existing types
- Displays default time limits
- Dynamically loaded (not hardcoded)
- Ordered alphabetically

---

### 25. Create Question Type
**Endpoint:** `POST /api/question-types`  
**Purpose:** Add new question type to system

**Use Cases:**
- Admin creates custom question type
- Add new question format
- Extend question capabilities
- Configure new assessment type

**Request:**
```json
{
  "name": "fill_in_blank",
  "time_limit": 60
}
```

**Response (201 Created):**
```json
{
  "message": "Question type created successfully",
  "question_type": {
    "id": "type-4",
    "name": "fill_in_blank",
    "time_limit": 60,
    "created_at": "2026-01-15T10:30:00Z"
  }
}
```

**Validation:**
- Name must be unique
- Minimum 3 characters
- Time limit required (min 5 seconds)
- Can only contain alphanumeric + underscore

**Business Logic:**
- Auto-generates UUID
- Stores in database
- Immediately available for questions
- Returns created type

---

### 26. Get Question Type by ID
**Endpoint:** `GET /api/question-types/:id`  
**Purpose:** Retrieve specific question type details

**Response:**
```json
{
  "id": "type-1",
  "name": "multiple_choice",
  "time_limit": 30,
  "question_count": 45,
  "created_at": "2026-01-15T10:30:00Z"
}
```

---

### 27. Update Question Type Time Limit
**Endpoint:** `PUT /api/question-types/:id/update-time-limit`  
**Purpose:** Change default time limit for question type

**Use Cases:**
- Adjust difficulty timing
- Speed up/slow down questions
- Optimize game flow
- Accessibility adjustments

**Request:**
```json
{
  "time_limit": 45,
  "minimum_time_frame": 10,
  "marks": 5
}
```

**Response (200 OK):**
```json
{
  "question_type": {
    "id": "type-1",
    "name": "multiple_choice",
    "time_limit": 45
  },
  "message": "Question type updated successfully"
}
```

**Impact:**
- Only affects NEW questions of this type
- Existing questions keep their time_limit
- Does NOT retroactively update questions

**Validation:**
- Time limit must be reasonable (5-600 seconds)
- Minimum time frame prevents too-fast questions
- Affects question creation from now on

---

### 28. Delete Question Type
**Endpoint:** `DELETE /api/question-types/:id`  
**Purpose:** Remove question type from system

**Use Cases:**
- Delete unused question types
- Clean up obsolete types
- Remove duplicate types
- Reorganize question types

**Safety Checks:**
- Prevent deletion if questions use it
- Return error with question count
- Admin confirmation required

**Response (200 OK):**
```json
{
  "message": "Question type deleted successfully",
  "question_type": {
    "id": "type-3",
    "name": "fill_in_blank"
  }
}
```

**Error (409 Conflict):**
```json
{
  "error": "Cannot delete question type",
  "message": "This question type is being used by 12 question(s). Please delete or reassign those questions first.",
  "questionsUsingType": 12
}
```

**Business Logic:**
- Count questions with this type
- If count > 0: Reject deletion
- If count = 0: Delete from database
- Verify in transaction

---

### 29. Check Question Type Options
**Endpoint:** `GET /api/question-types/:id/check-options`  
**Purpose:** Validate if question type supports certain options

**Use Cases:**
- Verify question format compatibility
- Check if type allows custom options
- Validate during question upload
- Format verification

**Response:**
```json
{
  "id": "type-1",
  "name": "multiple_choice",
  "supports": {
    "options": true,
    "partial_credit": false,
    "image_attachment": true,
    "timer": true
  }
}
```

---

## 📊 Dashboard & Analytics APIs

### 30. Get Dashboard Stats
**Endpoint:** `GET /api/dashboard/stats`  
**Purpose:** Overall system statistics

**Use Cases:**
- Dashboard summary cards
- System health overview
- Admin statistics
- Performance metrics

**Response (200 OK):**
```json
{
  "totalGames": 25,
  "totalQuestions": 187,
  "totalRounds": 8,
  "totalActiveUsers": 45,
  "activeGames": 3
}
```

**Calculations:**
- Count all games (regardless of status)
- Sum all questions across all rounds
- Count all created rounds
- Active users (logged in last 24 hours)
- Games with status = "active"

**Performance:**
- Uses cached values (5-minute refresh)
- Single aggregation query
- Returns instantly

---

### 31. Get Games & Questions by Round
**Endpoint:** `GET /api/dashboard/games-questions`  
**Purpose:** Distribution of games and questions across rounds

**Use Cases:**
- Round-by-round analysis
- Dashboard table display
- Compare round difficulty
- Identify empty rounds

**Response (200 OK):**
```json
{
  "data": [
    {
      "round": "Round 1",
      "roundNumber": 1,
      "games": 2,
      "questions": 10,
      "questionTypes": [
        {
          "type": "multiple_choice",
          "count": 6,
          "percentage": 60
        },
        {
          "type": "short_answer",
          "count": 4,
          "percentage": 40
        }
      ]
    },
    {
      "round": "Round 2",
      "roundNumber": 2,
      "games": 3,
      "questions": 15,
      "questionTypes": [
        {
          "type": "multiple_choice",
          "count": 9,
          "percentage": 60
        },
        {
          "type": "true_or_false",
          "count": 6,
          "percentage": 40
        }
      ]
    }
  ]
}
```

**Features:**
- Shows ALL rounds (even empty ones)
- Breaks down by question type
- Calculates percentages
- Ordered by round_number

**Key Insights:**
- Identifies round imbalances
- Shows question type distribution
- Helps with game planning

---

### 32. Get Question Distribution
**Endpoint:** `GET /api/dashboard/question-distribution`  
**Purpose:** Question type distribution across all questions

**Use Cases:**
- Question type breakdown pie chart
- System composition analysis
- Identify underutilized types
- Content analysis

**Response (200 OK):**
```json
{
  "distribution": [
    {
      "name": "multiple_choice",
      "value": 95,
      "percentage": 50.8
    },
    {
      "name": "short_answer",
      "value": 52,
      "percentage": 27.8
    },
    {
      "name": "true_or_false",
      "value": 35,
      "percentage": 18.7
    },
    {
      "name": "essay",
      "value": 5,
      "percentage": 2.7
    }
  ]
}
```

**Calculation:**
- Count questions per type
- Calculate percentage
- Order by count (descending)
- Include value and percentage

**Visualization:**
- Pie chart data
- Bar chart compatible
- Dashboard ready

---

### 33. Get Question Types by Round
**Endpoint:** `GET /api/dashboard/question-types-by-round`  
**Purpose:** Question type breakdown for each round

**Response:**
```json
{
  "roundsData": [
    {
      "roundId": "round-1",
      "roundName": "Round 1",
      "types": [
        {
          "type": "multiple_choice",
          "count": 6
        },
        {
          "type": "short_answer",
          "count": 4
        }
      ]
    }
  ]
}
```

---

## 👥 User Management APIs

### 34. Get All Users
**Endpoint:** `GET /api/admin/users`  
**Purpose:** List all users in system

**Use Cases:**
- Admin user management page
- User directory
- Permission assignment
- User statistics

**Query Parameters:**
```
?role=teacher
?status=active
?search=john
?limit=20
?offset=0
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "user-1",
      "email": "admin@example.com",
      "full_name": "Admin User",
      "role_name": "admin",
      "status": "active",
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "user-2",
      "email": "teacher@example.com",
      "full_name": "Teacher User",
      "role_name": "teacher",
      "status": "active",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

**Features:**
- Filter by role
- Search by name/email
- Pagination support
- Status indicator

---

### 35. Create User (Admin)
**Endpoint:** `POST /api/admin/users`  
**Purpose:** Create new user account (admin only)

**Use Cases:**
- Admin creates user
- Bulk user creation
- Set specific role on creation
- Initialize user account

**Request:**
```json
{
  "email": "teacher@example.com",
  "password": "password123",
  "full_name": "Teacher User",
  "role_name": "teacher"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "user-3",
    "email": "teacher@example.com",
    "full_name": "Teacher User",
    "role_name": "teacher"
  },
  "message": "User created successfully"
}
```

**Authorization:**
- Admin only
- Cannot create another admin (unless super-admin)

**Validation:**
- Email must be unique
- Password minimum 6 characters
- Role must exist
- Full name required

---

### 36. Get User by ID
**Endpoint:** `GET /api/admin/users/:id`  
**Purpose:** Retrieve specific user details

**Response:**
```json
{
  "user": {
    "id": "user-1",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role_name": "admin",
    "permissions": ["games.create", "games.read", "users.manage"],
    "created_at": "2026-01-15T10:30:00Z",
    "last_login": "2026-01-15T15:45:00Z"
  }
}
```

---

### 37. Update User
**Endpoint:** `PUT /api/admin/users/:id`  
**Purpose:** Modify user information

**Use Cases:**
- Update full name
- Change email
- Modify profile
- Admin account management

**Request:**
```json
{
  "full_name": "Updated Name",
  "email": "newemail@example.com"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user-1",
    "email": "newemail@example.com",
    "full_name": "Updated Name",
    "role_name": "admin"
  },
  "message": "User updated successfully"
}
```

**Constraints:**
- Email must remain unique
- Cannot change role via this endpoint
- Requires authentication

---

### 38. Delete User
**Endpoint:** `DELETE /api/admin/users/:id`  
**Purpose:** Remove user from system

**Use Cases:**
- Delete inactive users
- Remove test accounts
- Account cleanup

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Cascade Behavior:**
- Removes user permissions
- Keeps activity log (for audit)
- Does NOT delete user's created content

---

### 39. Reset User Password (Admin)
**Endpoint:** `POST /api/admin/reset-user-password`  
**Purpose:** Admin reset user password

**Use Cases:**
- Admin resets forgotten password
- Force password change
- Account recovery
- Security reset

**Request:**
```json
{
  "user_id": "user-1",
  "new_password": "newpassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Features:**
- Hashes new password
- Invalidates old sessions
- No email notification (can add)
- User must login again

---

## 🔒 Permissions APIs

### 40. Get All Permissions
**Endpoint:** `GET /api/admin/permissions`  
**Purpose:** List all user permissions

**Use Cases:**
- Permission management page
- Audit permissions
- Permission overview

**Response (200 OK):**
```json
{
  "permissions": [
    {
      "id": "perm-1",
      "user_id": "user-1",
      "permission": "games.create",
      "granted_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "perm-2",
      "user_id": "user-1",
      "permission": "games.edit",
      "granted_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

### 41. Grant Permission
**Endpoint:** `POST /api/admin/permissions`  
**Purpose:** Assign permissions to user

**Use Cases:**
- Give user access to feature
- Role-based permission assignment
- Granular access control

**Request:**
```json
{
  "user_id": "user-1",
  "permissions": ["games.create", "games.read", "questions.create"]
}
```

**Response (200 OK):**
```json
{
  "message": "Permissions granted successfully",
  "permissions": [
    {
      "id": "perm-1",
      "user_id": "user-1",
      "permission": "games.create"
    },
    {
      "id": "perm-2",
      "user_id": "user-1",
      "permission": "games.read"
    }
  ]
}
```

**Features:**
- Bulk permission assignment
- Replaces existing permissions
- Validates permission names
- Stores in database

---

### 42. Update User Permissions
**Endpoint:** `PUT /api/admin/permissions/:id`  
**Purpose:** Modify specific permission

**Request:**
```json
{
  "permissions": ["games.read", "games.update", "rounds.read"]
}
```

**Response (200 OK):**
```json
{
  "message": "Permissions updated successfully"
}
```

---

### 43. Revoke Permission
**Endpoint:** `DELETE /api/admin/permissions/:id`  
**Purpose:** Remove permission from user

**Use Cases:**
- Disable user access
- Remove expired permissions
- Revoke specific feature access

**Response (200 OK):**
```json
{
  "message": "Permission revoked successfully"
}
```

---

## 📝 Activity Log APIs

### 44. Get Activity Log
**Endpoint:** `GET /api/admin/activity`  
**Purpose:** Retrieve system activity audit trail

**Use Cases:**
- Audit trail viewing
- User activity tracking
- Security monitoring
- Compliance reporting

**Query Parameters:**
```
?user_id=user-1
?action=QUESTION_CREATED
?start_date=2026-01-01
?end_date=2026-01-31
?limit=50
```

**Response (200 OK):**
```json
{
  "activities": [
    {
      "id": "activity-1",
      "user_id": "user-1",
      "user_name": "Admin User",
      "action": "QUESTION_CREATED",
      "entity_type": "question",
      "entity_id": "q-123",
      "details": {
        "question_text": "What is 2+2?",
        "round_id": "round-1"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "activity-2",
      "user_id": "user-2",
      "user_name": "Teacher User",
      "action": "GAME_CREATED",
      "entity_type": "game",
      "entity_id": "game-45",
      "details": {
        "game_name": "Quiz Game",
        "round_id": "round-1"
      },
      "ip_address": "192.168.1.101",
      "created_at": "2026-01-15T11:45:00Z"
    }
  ]
}
```

**Logged Actions:**
- USER_LOGIN
- QUESTION_CREATED
- QUESTION_UPDATED
- QUESTION_DELETED
- GAME_CREATED
- GAME_DELETED
- ANSWER_SUBMITTED
- PERMISSION_CHANGED

**Features:**
- Complete audit trail
- Filters by user, action, date
- Includes IP address
- Pagination support

---

## 🎯 Game Answer APIs

### 45. Submit Answer
**Endpoint:** `POST /api/game-answers`  
**Purpose:** Record player's answer to question

**Use Cases:**
- Player submits quiz answer
- Record during game play
- Calculate score
- Track answer history

**Request:**
```json
{
  "game_id": "game-1",
  "question_id": "q-1",
  "user_id": "user-3",
  "answer": "A",
  "is_correct": true,
  "time_taken": 15000,
  "marks_obtained": 4
}
```

**Response (201 Created):**
```json
{
  "answer": {
    "id": "answer-1",
    "game_id": "game-1",
    "question_id": "q-1",
    "is_correct": true,
    "marks_obtained": 4,
    "time_taken": 15000
  },
  "message": "Answer submitted successfully"
}
```

**Features:**
- Records answer with timestamp
- Calculates if correct
- Awards marks
- Tracks time spent

**Validation:**
- Game must exist
- Question must exist
- User must exist
- Answer format must match question type

**Calculations:**
- `is_correct` - Compare with question.correct_answer
- `marks_obtained` - Based on correctness
- Time bonus/penalty (if configured)

**Storage:**
- Stores in game_answers table
- Keeps full history
- Enables replay functionality

---

## 🔐 Authentication Headers

**All Protected Endpoints Require:**
```
Cookie: sessionId=<session_token>
OR
Authorization: Bearer <jwt_token>
```

---

## ✅ Common Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK - Request successful | GET, PUT successful |
| 201 | Created - Resource created | POST successful |
| 204 | No Content | DELETE successful |
| 400 | Bad Request - Invalid input | Missing required field |
| 401 | Unauthorized - Not authenticated | Missing session |
| 403 | Forbidden - No permission | Not allowed for user role |
| 404 | Not Found - Resource doesn't exist | Game ID not found |
| 409 | Conflict - Duplicate/constraint violation | Delete type with questions |
| 500 | Server Error - Internal issue | Database connection error |

---

## 🚀 API Usage Summary

### By Use Case

#### For Quiz Players
- Login
- Get Games
- Get Questions by Round
- Submit Answer

#### For Teachers/Content Creators
- Create Game
- Create Round
- Create Questions (manual)
- Bulk Upload Questions
- Get Question Types
- Download Template
- Dashboard Stats

#### For Administrators
- Create User
- Manage Users
- Grant Permissions
- Configure Question Types
- View Activity Log
- Manage All Resources

---

## 📊 Rate Limiting (Future)

**Recommended Limits:**
```
Login: 5 requests per minute
Question Upload: 3 per 10 minutes
Dashboard Refresh: 6 per minute
API General: 100 per minute
```

---

## 🔗 API Integration Example

```typescript
// Example: Create a game with fetch API
async function createGame(gameName: string, roundId: string) {
  const response = await fetch('/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: gameName,
      round_id: roundId,
      groups: [
        { name: 'Team A' },
        { name: 'Team B' }
      ]
    }),
    credentials: 'include' // For cookies
  })
  
  if (response.ok) {
    const data = await response.json()
    console.log('Game created:', data.game)
    return data.game
  } else {
    throw new Error('Failed to create game')
  }
}
```

---

**Document Generated:** June 2026  
**Total APIs Documented:** 45  
**Categories:** 10  
**Version:** 1.0
