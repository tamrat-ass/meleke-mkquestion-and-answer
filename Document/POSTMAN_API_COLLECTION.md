# Postman API Collection - Q&A Game Platform

This document contains all API endpoints with request/response examples for Postman testing.

---

## Authentication

### Login
**POST** `http://localhost:3000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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

---

### Sign Up
**POST** `http://localhost:3000/api/auth/signup`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "email": "newuser@example.com",
    "full_name": "New User",
    "role_name": "player"
  },
  "message": "User created successfully"
}
```

---

### Reset Password
**POST** `http://localhost:3000/api/auth/reset-password`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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

---

## Games

### Get All Games
**GET** `http://localhost:3000/api/games`

**Headers:**
```
Content-Type: application/json
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

---

### Create Game
**POST** `http://localhost:3000/api/games`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
```json
{
  "name": "New Quiz Game",
  "round_id": "round-1",
  "groups": [
    {
      "name": "Team A"
    },
    {
      "name": "Team B"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "game": {
    "id": "game-123",
    "name": "New Quiz Game",
    "round_id": "round-1",
    "status": "draft"
  },
  "message": "Game created successfully"
}
```

---

### Get Game by ID
**GET** `http://localhost:3000/api/games/{id}`

**Headers:**
```
Content-Type: application/json
```

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
    }
  ]
}
```

---

### Update Game
**PUT** `http://localhost:3000/api/games/{id}`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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

---

### Delete Game
**DELETE** `http://localhost:3000/api/games/{id}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "message": "Game deleted successfully"
}
```

---

## Rounds

### Get All Rounds
**GET** `http://localhost:3000/api/rounds`

**Headers:**
```
Content-Type: application/json
```

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
    }
  ]
}
```

---

### Create Round
**POST** `http://localhost:3000/api/rounds`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
```json
{
  "name": "Round 5",
  "description": "Fifth round of the competition"
}
```

**Response (201 Created):**
```json
{
  "round": {
    "id": "round-5",
    "name": "Round 5",
    "round_number": 5,
    "description": "Fifth round of the competition",
    "created_at": "2026-01-15T10:30:00Z"
  },
  "message": "Round created successfully"
}
```

---

### Get Round by ID
**GET** `http://localhost:3000/api/rounds/{id}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "round": {
    "id": "round-1",
    "name": "Round 1",
    "round_number": 1,
    "description": "First round",
    "created_at": "2026-01-15T10:30:00Z"
  }
}
```

---

### Update Round
**PUT** `http://localhost:3000/api/rounds/{id}`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
```json
{
  "name": "Updated Round Name",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "round": {
    "id": "round-1",
    "name": "Updated Round Name",
    "round_number": 1,
    "description": "Updated description",
    "created_at": "2026-01-15T10:30:00Z"
  },
  "message": "Round updated successfully"
}
```

---

### Delete Round
**DELETE** `http://localhost:3000/api/rounds/{id}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "message": "Round and associated questions deleted successfully"
}
```

---

## Questions

### Get All Questions
**GET** `http://localhost:3000/api/questions`

**Headers:**
```
Content-Type: application/json
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
      "option_a": "4",
      "option_b": "5",
      "option_c": "3",
      "option_d": "6",
      "options": [
        {"option_key": "A", "option_value": "4"},
        {"option_key": "B", "option_value": "5"},
        {"option_key": "C", "option_value": "3"},
        {"option_key": "D", "option_value": "6"}
      ]
    }
  ]
}
```

---

### Create Question
**POST** `http://localhost:3000/api/questions`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
```json
{
  "question_text": "What is the capital of France?",
  "round_id": "round-1",
  "question_type": "multiple_choice",
  "correct_answer": "A",
  "time_limit": 30,
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
    "round_id": "round-1"
  },
  "message": "Question created successfully"
}
```

---

### Get Question by ID
**GET** `http://localhost:3000/api/questions/{id}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
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
    "option_d": "6"
  }
}
```

---

### Update Question
**PUT** `http://localhost:3000/api/questions/{id}`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
```json
{
  "question_text": "Updated question text",
  "correct_answer": "B",
  "time_limit": 45
}
```

**Response (200 OK):**
```json
{
  "message": "Question updated successfully"
}
```

---

### Delete Question
**DELETE** `http://localhost:3000/api/questions/{id}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "message": "Question deleted successfully"
}
```

---

### Get Questions by Round
**GET** `http://localhost:3000/api/questions/by-round/{roundId}`

**Headers:**
```
Content-Type: application/json
```

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
      "options": []
    }
  ]
}
```

---

## Question Types

### Get All Question Types
**GET** `http://localhost:3000/api/question-types`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "question_types": [
    {
      "id": "type-1",
      "name": "multiple_choice",
      "time_limit": 30
    },
    {
      "id": "type-2",
      "name": "short_answer",
      "time_limit": 45
    }
  ],
  "types": [
    {
      "id": "type-1",
      "name": "multiple_choice",
      "time_limit": 30
    }
  ]
}
```

---

### Create Question Type
**POST** `http://localhost:3000/api/question-types`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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
    "id": "type-3",
    "name": "fill_in_blank",
    "time_limit": 60
  }
}
```

---

### Get Question Type by ID
**GET** `http://localhost:3000/api/question-types/{id}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "id": "type-1",
  "name": "multiple_choice",
  "time_limit": 30
}
```

---

### Update Question Type Time Limit
**PUT** `http://localhost:3000/api/question-types/{id}/update-time-limit`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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

---

### Delete Question Type
**DELETE** `http://localhost:3000/api/question-types/{id}`

**Headers:**
```
Content-Type: application/json
```

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

**Error Response (409 Conflict):**
```json
{
  "error": "Cannot delete question type",
  "message": "This question type is being used by 5 question(s). Please delete or reassign those questions first.",
  "questionsUsingType": 5
}
```

---

## Dashboard

### Get Dashboard Stats
**GET** `http://localhost:3000/api/dashboard/stats`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "totalGames": 10,
  "totalQuestions": 45,
  "totalRounds": 5,
  "totalActiveUsers": 25,
  "activeGames": 3
}
```

---

### Get Games & Questions by Round
**GET** `http://localhost:3000/api/dashboard/games-questions`

**Headers:**
```
Content-Type: application/json
```

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

### Get Question Distribution
**GET** `http://localhost:3000/api/dashboard/question-distribution`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "distribution": [
    {
      "name": "multiple_choice",
      "value": 25
    },
    {
      "name": "short_answer",
      "value": 15
    },
    {
      "name": "sign_screen",
      "value": 5
    }
  ]
}
```

---

## Users

### Get All Users
**GET** `http://localhost:3000/api/admin/users`

**Headers:**
```
Content-Type: application/json
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
      "status": "active"
    }
  ]
}
```

---

### Create User (Admin)
**POST** `http://localhost:3000/api/admin/users`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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
    "id": "user-2",
    "email": "teacher@example.com",
    "full_name": "Teacher User",
    "role_name": "teacher"
  },
  "message": "User created successfully"
}
```

---

### Get User by ID
**GET** `http://localhost:3000/api/admin/users/{id}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user-1",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role_name": "admin",
    "permissions": ["users.read", "users.create"]
  }
}
```

---

### Update User
**PUT** `http://localhost:3000/api/admin/users/{id}`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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

---

### Delete User
**DELETE** `http://localhost:3000/api/admin/users/{id}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

---

### Reset User Password (Admin)
**POST** `http://localhost:3000/api/admin/reset-user-password`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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

---

## Permissions

### Get All Permissions
**GET** `http://localhost:3000/api/admin/permissions`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "permissions": [
    {
      "id": "perm-1",
      "user_id": "user-1",
      "permission": "games.create",
      "granted_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

### Grant Permission
**POST** `http://localhost:3000/api/admin/permissions`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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
    }
  ]
}
```

---

### Update User Permissions
**PUT** `http://localhost:3000/api/admin/permissions/{id}`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
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

### Revoke Permission
**DELETE** `http://localhost:3000/api/admin/permissions/{id}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "message": "Permission revoked successfully"
}
```

---

## Activity Log

### Get Activity Log
**GET** `http://localhost:3000/api/admin/activity`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "activities": [
    {
      "id": "activity-1",
      "user_id": "user-1",
      "action": "QUESTION_CREATED",
      "entity_type": "question",
      "entity_id": "q-1",
      "details": {"question_text": "What is 2+2?"},
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

## Game Answers

### Submit Answer
**POST** `http://localhost:3000/api/game-answers`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw - JSON):**
```json
{
  "game_id": "game-1",
  "question_id": "q-1",
  "user_id": "user-1",
  "answer": "A",
  "is_correct": true,
  "time_taken": 15,
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
    "marks_obtained": 4
  },
  "message": "Answer submitted successfully"
}
```

---

## Notes for Postman

### Base URL
Set as environment variable:
```
{{BASE_URL}} = http://localhost:3000
```

### Authentication
Some endpoints require authentication. After login, save the auth token from response and add to headers:
```
Authorization: Bearer {token}
Cookie: sessionId={sessionId}
```

### Common Headers
All requests should include:
```
Content-Type: application/json
Accept: application/json
```

### Error Responses
All errors follow this format:
```json
{
  "error": "Error message",
  "details": "Additional details (optional)",
  "status": 400
}
```

### Pagination (where applicable)
Add to query parameters:
```
?page=1&limit=20
```

### Status Codes
- 200 OK: Successful GET/PUT
- 201 Created: Successful POST
- 204 No Content: Successful DELETE
- 400 Bad Request: Invalid input
- 404 Not Found: Resource not found
- 409 Conflict: Duplicate or constraint violation
- 500 Server Error: Internal error

