# Entity-Relationship Diagram (EDA) Documentation

**Q&A Game Platform**  
**Database:** PostgreSQL  
**Version:** 1.0  
**Generated:** June 2026

---

## 📊 Visual EDA (ASCII Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Q&A GAME PLATFORM DATABASE                           │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │    USERS     │
                                    ├──────────────┤
                                    │ id (PK)      │
                                    │ email        │
                                    │ password_hash│
                                    │ full_name    │
                                    │ role_name(FK)│
                                    │ created_at   │
                                    └──────┬───────┘
                                           │
                         ┌─────────────────┼─────────────────┐
                         │                 │                 │
                         ▼                 ▼                 ▼
                ┌─────────────────┐ ┌────────────────┐ ┌───────────────────┐
                │  PERMISSIONS    │ │ GAME_ANSWERS   │ │  ACTIVITY_LOG     │
                ├─────────────────┤ ├────────────────┤ ├───────────────────┤
                │ id (PK)         │ │ id (PK)        │ │ id (PK)           │
                │ user_id (FK)    │ │ user_id (FK)   │ │ user_id (FK)      │
                │ permission      │ │ game_id (FK)   │ │ action            │
                │ granted_at      │ │ question_id(FK)│ │ entity_type       │
                └─────────────────┘ │ answer         │ │ entity_id         │
                                    │ is_correct     │ │ details (JSON)    │
                                    │ marks_obtained │ │ ip_address        │
                                    │ time_taken     │ │ user_agent        │
                                    │ created_at     │ │ created_at        │
                                    └────────┬───────┘ └───────────────────┘
                                             │
                                    ┌────────┴────────┐
                                    │                 │
                                    ▼                 ▼
                           ┌──────────────┐  ┌──────────────┐
                           │    GAMES     │  │  QUESTIONS   │
                           ├──────────────┤  ├──────────────┤
                           │ id (PK)      │  │ id (PK)      │
                           │ name         │  │ round_id(FK) │
                           │ round_id(FK) │  │ question_type│
                           │ status       │  │ question_text│
                           │ created_at   │  │ correct_ans. │
                           │ updated_at   │  │ time_limit   │
                           └────────┬─────┘  │ marks        │
                                    │        │ created_at   │
                                    │        └──────┬───────┘
                                    │               │
                           ┌────────┴───────┐      │
                           │                │      │
                           ▼                ▼      ▼
                    ┌────────────────┐ ┌──────────────────┐
                    │ QUESTION_TYPES │ │ QUESTION_OPTIONS │
                    ├────────────────┤ ├──────────────────┤
                    │ id (PK)        │ │ id (PK)          │
                    │ name           │ │ question_id (FK) │
                    │ time_limit     │ │ option_key       │
                    │ created_at     │ │ option_value     │
                    └────────────────┘ └──────────────────┘
                           ▲
                           │
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │  ROUNDS  │  │  GAMES   │
              ├──────────┤  ├──────────┤
              │ id (PK)  │  │ id (PK)  │
              │ name     │  │ name     │
              │ round_no │  │ round_id │
              │ desc.    │  │ status   │
              │ created  │  │ created  │
              └──────────┘  └──────────┘


              ┌─────────────────────────────────────────────────────┐
              │                   SUPPORTING TABLES                 │
              ├─────────────────────────────────────────────────────┤
              │  ┌──────────────┐      ┌────────────────┐          │
              │  │ ROLES        │      │ GAME_GROUPS    │          │
              │  ├──────────────┤      ├────────────────┤          │
              │  │ id (PK)      │      │ id (PK)        │          │
              │  │ name (Unique)│      │ game_id (FK)   │          │
              │  │ description  │      │ name           │          │
              │  └──────────────┘      │ score          │          │
              │                        │ created_at     │          │
              │  ┌──────────────────┐  └────────────────┘          │
              │  │ ROLE_TEMPLATES   │                              │
              │  ├──────────────────┤  ┌────────────────┐          │
              │  │ id (PK)          │  │ USER_PERMISSIONS
              │  │ role_id (FK)     │  ├────────────────┤          │
              │  │ permission_name  │  │ id (PK)        │          │
              │  │ created_at       │  │ user_id (FK)   │          │
              │  └──────────────────┘  │ role_based     │          │
              │                        │ created_at     │          │
              │                        └────────────────┘          │
              └─────────────────────────────────────────────────────┘
```

---

## 📋 Table Specifications

### 1. USERS Table
**Purpose:** Store user account information and authentication data

```
Table: users
├── Primary Key: id (UUID)
├── Unique Constraint: email
└── Foreign Key: role_name → roles.name

Columns:
┌─────────────────┬─────────────────┬──────────┬─────────────────┐
│ Column Name     │ Data Type       │ Nullable │ Default / Notes │
├─────────────────┼─────────────────┼──────────┼─────────────────┤
│ id              │ UUID            │ NO       │ Primary Key     │
│ email           │ VARCHAR(255)    │ NO       │ Unique, Index   │
│ password_hash   │ VARCHAR(255)    │ NO       │ bcryptjs hashed │
│ full_name       │ VARCHAR(255)    │ NO       │                 │
│ role_name       │ VARCHAR(50)     │ NO       │ FK to roles     │
│ status          │ VARCHAR(20)     │ YES      │ active/inactive │
│ created_at      │ TIMESTAMP       │ NO       │ NOW()           │
│ updated_at      │ TIMESTAMP       │ YES      │ ON UPDATE       │
│ last_login      │ TIMESTAMP       │ YES      │ NULL initially  │
└─────────────────┴─────────────────┴──────────┴─────────────────┘

Sample Data:
id: 550e8400-e29b-41d4-a716-446655440000
email: admin@example.com
full_name: Admin User
role_name: admin
status: active
```

---

### 2. ROLES Table
**Purpose:** Define user roles and their hierarchy

```
Table: roles
├── Primary Key: id (UUID)
├── Unique Constraint: name
└── No Foreign Keys

Columns:
┌──────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name  │ Data Type    │ Nullable │ Default / Notes  │
├──────────────┼──────────────┼──────────┼──────────────────┤
│ id           │ UUID         │ NO       │ Primary Key      │
│ name         │ VARCHAR(50)  │ NO       │ Unique (admin)   │
│ description  │ TEXT         │ YES      │                  │
│ created_at   │ TIMESTAMP    │ NO       │ NOW()            │
└──────────────┴──────────────┴──────────┴──────────────────┘

Pre-defined Roles:
├── admin      - Full system access, user management
├── teacher    - Create games, manage questions, view stats
└── player     - Play games, submit answers

Sample Data:
id: 550e8400-e29b-41d4-a716-446655440001
name: admin
description: Administrator with full access
```

---

### 3. PERMISSIONS Table
**Purpose:** Store granular permission assignments to users

```
Table: permissions
├── Primary Key: id (UUID)
├── Foreign Key: user_id → users.id
└── Index: (user_id, permission)

Columns:
┌──────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name  │ Data Type    │ Nullable │ Default / Notes  │
├──────────────┼──────────────┼──────────┼──────────────────┤
│ id           │ UUID         │ NO       │ Primary Key      │
│ user_id      │ UUID         │ NO       │ FK to users      │
│ permission   │ VARCHAR(100) │ NO       │ e.g., games.edit │
│ granted_at   │ TIMESTAMP    │ NO       │ NOW()            │
│ granted_by   │ UUID         │ YES      │ Admin user ID    │
└──────────────┴──────────────┴──────────┴──────────────────┘

Sample Permissions:
├── games.create
├── games.read
├── games.update
├── games.delete
├── questions.create
├── questions.read
├── questions.update
├── questions.delete
├── rounds.create
├── users.manage
└── permissions.manage

Sample Data:
id: 550e8400-e29b-41d4-a716-446655440002
user_id: 550e8400-e29b-41d4-a716-446655440000 (admin)
permission: games.create
granted_at: 2026-01-15 10:30:00
```

---

### 4. ROUNDS Table
**Purpose:** Define quiz competition rounds

```
Table: rounds
├── Primary Key: id (UUID)
├── Unique Constraint: round_number
└── No Foreign Keys

Columns:
┌──────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name  │ Data Type    │ Nullable │ Default / Notes  │
├──────────────┼──────────────┼──────────┼──────────────────┤
│ id           │ UUID         │ NO       │ Primary Key      │
│ name         │ VARCHAR(100) │ NO       │ e.g., Round 1    │
│ round_number │ INTEGER      │ NO       │ Unique, Index    │
│ description  │ TEXT         │ YES      │                  │
│ created_at   │ TIMESTAMP    │ NO       │ NOW()            │
│ updated_at   │ TIMESTAMP    │ YES      │ ON UPDATE        │
└──────────────┴──────────────┴──────────┴──────────────────┘

Sample Data:
id: 650e8400-e29b-41d4-a716-446655440000
name: Round 1
round_number: 1
description: First round of competition
created_at: 2026-01-10 14:00:00

Relationships:
One Round → Many Questions
One Round → Many Games
```

---

### 5. QUESTION_TYPES Table
**Purpose:** Define configurable question type templates

```
Table: question_types
├── Primary Key: id (UUID)
├── Unique Constraint: name
└── No Foreign Keys

Columns:
┌──────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name  │ Data Type    │ Nullable │ Default / Notes  │
├──────────────┼──────────────┼──────────┼──────────────────┤
│ id           │ UUID         │ NO       │ Primary Key      │
│ name         │ VARCHAR(100) │ NO       │ Unique (admin)   │
│ time_limit   │ INTEGER      │ NO       │ Seconds (30-600) │
│ description  │ TEXT         │ YES      │                  │
│ created_at   │ TIMESTAMP    │ NO       │ NOW()            │
│ updated_at   │ TIMESTAMP    │ YES      │ ON UPDATE        │
└──────────────┴──────────────┴──────────┴──────────────────┘

Supported Types:
├── multiple_choice   - Default: 30 seconds, User selects from 4 options
├── true_or_false     - Default: 20 seconds, User selects True/False
├── short_answer      - Default: 45 seconds, User types text response
├── essay             - Default: 60 seconds, User types longer response
├── matching          - Default: 90 seconds, User matches two lists
└── sign_screen       - Default: 60 seconds, Full-screen info/announcement (no input, 0 marks)

Sample Data (Multiple Choice):
id: 750e8400-e29b-41d4-a716-446655440000
name: multiple_choice
time_limit: 30
description: Multiple choice question with 4 options

Sample Data (Sign Screen):
id: 750e8400-e29b-41d4-a716-446655440999
name: sign_screen
time_limit: 60
description: Full-screen information display - no user input, no scoring

Key Differences for sign_screen:
- No correct_answer required (stored as empty string)
- No marks (always 0)
- No game_answers record created
- Time limit typically 30-600 seconds
- Purpose: Information, breaks, instructions, transitions
- User interaction: Click to start timer, cannot skip

Relationships:
One Question Type → Many Questions
```

---

### 6. QUESTIONS Table
**Purpose:** Store quiz questions and answer information

```
Table: questions
├── Primary Key: id (UUID)
├── Foreign Keys: round_id → rounds.id, question_type → question_types.name
├── Indexes: (round_id), (question_type), (created_at)
└── No Unique Constraints

Columns:
┌──────────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name      │ Data Type    │ Nullable │ Default / Notes  │
├──────────────────┼──────────────┼──────────┼──────────────────┤
│ id               │ UUID         │ NO       │ Primary Key      │
│ round_id         │ UUID         │ NO       │ FK to rounds     │
│ question_type    │ VARCHAR(50)  │ NO       │ FK to q_types    │
│ question_text    │ TEXT         │ NO       │ Question content │
│ correct_answer   │ VARCHAR(255) │ YES      │ Answer key/Empty │
│ time_limit       │ INTEGER      │ NO       │ Seconds          │
│ marks            │ INTEGER      │ YES      │ Default: 4, or 0 │
│ difficulty       │ VARCHAR(20)  │ YES      │ easy/med/hard    │
│ created_at       │ TIMESTAMP    │ NO       │ NOW()            │
│ updated_at       │ TIMESTAMP    │ YES      │ ON UPDATE        │
└──────────────────┴──────────────┴──────────┴──────────────────┘

Sample Data (Multiple Choice):
id: 850e8400-e29b-41d4-a716-446655440000
round_id: 650e8400-e29b-41d4-a716-446655440000
question_type: multiple_choice
question_text: What is the capital of France?
correct_answer: A
time_limit: 30
marks: 4
difficulty: easy

Sample Data (Sign Screen):
id: 850e8400-e29b-41d4-a716-446655440999
round_id: 650e8400-e29b-41d4-a716-446655440000
question_type: sign_screen
question_text: Break Time - 2 Minutes
correct_answer: (empty string)
time_limit: 120
marks: 0
difficulty: (null)

Relationships:
One Round → Many Questions
One Question Type → Many Questions
One Question → Many Game Answers (except sign_screen: 0 answers)
One Question → Many Question Options (only multiple_choice/matching)
```

---

### 7. QUESTION_OPTIONS Table
**Purpose:** Store multiple choice options for questions

```
Table: question_options
├── Primary Key: id (UUID)
├── Foreign Key: question_id → questions.id
├── Index: (question_id)
└── No Unique Constraints

Columns:
┌──────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name  │ Data Type    │ Nullable │ Default / Notes  │
├──────────────┼──────────────┼──────────┼──────────────────┤
│ id           │ UUID         │ NO       │ Primary Key      │
│ question_id  │ UUID         │ NO       │ FK to questions  │
│ option_key   │ VARCHAR(10)  │ NO       │ A, B, C, D etc.  │
│ option_value │ TEXT         │ NO       │ Option text      │
│ created_at   │ TIMESTAMP    │ NO       │ NOW()            │
└──────────────┴──────────────┴──────────┴──────────────────┘

Sample Data:
question_id: 850e8400-e29b-41d4-a716-446655440000
option_key: A
option_value: Paris

option_key: B
option_value: London

Relationships:
One Question → Many Options (typically 4)
```

---

### 8. GAMES Table
**Purpose:** Store game instances and their configuration

```
Table: games
├── Primary Key: id (UUID)
├── Foreign Key: round_id → rounds.id
├── Indexes: (round_id), (status), (created_at)
└── No Unique Constraints

Columns:
┌──────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name  │ Data Type    │ Nullable │ Default / Notes  │
├──────────────┼──────────────┼──────────┼──────────────────┤
│ id           │ UUID         │ NO       │ Primary Key      │
│ name         │ VARCHAR(255) │ NO       │ Game title       │
│ round_id     │ UUID         │ NO       │ FK to rounds     │
│ status       │ VARCHAR(20)  │ NO       │ draft/active/end │
│ created_by   │ UUID         │ YES      │ Creator user ID  │
│ created_at   │ TIMESTAMP    │ NO       │ NOW()            │
│ updated_at   │ TIMESTAMP    │ YES      │ ON UPDATE        │
│ started_at   │ TIMESTAMP    │ YES      │ Game start time  │
│ ended_at     │ TIMESTAMP    │ YES      │ Game end time    │
└──────────────┴──────────────┴──────────┴──────────────────┘

Status Values:
├── draft    - Game created, not started
├── active   - Game currently running
├── paused   - Game temporarily stopped
└── completed - Game finished

Sample Data:
id: 950e8400-e29b-41d4-a716-446655440000
name: Science Quiz Game
round_id: 650e8400-e29b-41d4-a716-446655440000
status: active
created_by: 550e8400-e29b-41d4-a716-446655440000

Relationships:
One Round → Many Games
One Game → Many Game Groups/Teams
One Game → Many Game Answers
```

---

### 9. GAME_GROUPS Table
**Purpose:** Store teams/groups participating in games

```
Table: game_groups
├── Primary Key: id (UUID)
├── Foreign Key: game_id → games.id
├── Index: (game_id)
└── No Unique Constraints

Columns:
┌──────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name  │ Data Type    │ Nullable │ Default / Notes  │
├──────────────┼──────────────┼──────────┼──────────────────┤
│ id           │ UUID         │ NO       │ Primary Key      │
│ game_id      │ UUID         │ NO       │ FK to games      │
│ name         │ VARCHAR(100) │ NO       │ Team/Group name  │
│ score        │ INTEGER      │ NO       │ Current score    │
│ created_at   │ TIMESTAMP    │ NO       │ NOW()            │
└──────────────┴──────────────┴──────────┴──────────────────┘

Sample Data:
game_id: 950e8400-e29b-41d4-a716-446655440000
name: Team A
score: 45

game_id: 950e8400-e29b-41d4-a716-446655440000
name: Team B
score: 38

Relationships:
One Game → Many Game Groups
One Game Group → Many Game Answers
```

---

### 10. GAME_ANSWERS Table
**Purpose:** Record player answers and scoring

```
Table: game_answers
├── Primary Key: id (UUID)
├── Foreign Keys: game_id, question_id, user_id, group_id
├── Indexes: (game_id), (question_id), (user_id), (created_at)
└── No Unique Constraints

Columns:
┌──────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name  │ Data Type    │ Nullable │ Default / Notes  │
├──────────────┼──────────────┼──────────┼──────────────────┤
│ id           │ UUID         │ NO       │ Primary Key      │
│ game_id      │ UUID         │ NO       │ FK to games      │
│ question_id  │ UUID         │ NO       │ FK to questions  │
│ user_id      │ UUID         │ NO       │ FK to users      │
│ group_id     │ UUID         │ YES      │ FK to g_groups   │
│ answer       │ VARCHAR(255) │ NO       │ Player's answer  │
│ is_correct   │ BOOLEAN      │ NO       │ Correct or not   │
│ marks_obtn.  │ INTEGER      │ NO       │ Marks earned     │
│ time_taken   │ INTEGER      │ NO       │ Milliseconds     │
│ created_at   │ TIMESTAMP    │ NO       │ NOW()            │
└──────────────┴──────────────┴──────────┴──────────────────┘

Sample Data:
id: a50e8400-e29b-41d4-a716-446655440000
game_id: 950e8400-e29b-41d4-a716-446655440000
question_id: 850e8400-e29b-41d4-a716-446655440000
user_id: 550e8400-e29b-41d4-a716-446655440003
group_id: g50e8400-e29b-41d4-a716-446655440000
answer: A
is_correct: true
marks_obtained: 4
time_taken: 15000

Relationships:
One Game → Many Game Answers
One Question → Many Game Answers
One User → Many Game Answers
One Game Group → Many Game Answers
```

---

### 11. ACTIVITY_LOG Table
**Purpose:** Audit trail for all system activities

```
Table: activity_log
├── Primary Key: id (UUID)
├── Foreign Key: user_id → users.id
├── Indexes: (user_id), (created_at), (action)
└── No Unique Constraints

Columns:
┌──────────────┬──────────────┬──────────┬──────────────────┐
│ Column Name  │ Data Type    │ Nullable │ Default / Notes  │
├──────────────┼──────────────┼──────────┼──────────────────┤
│ id           │ UUID         │ NO       │ Primary Key      │
│ user_id      │ UUID         │ NO       │ FK to users      │
│ action       │ VARCHAR(100) │ NO       │ Action type      │
│ entity_type  │ VARCHAR(50)  │ NO       │ question, game   │
│ entity_id    │ VARCHAR(100) │ NO       │ Resource ID      │
│ details      │ JSONB        │ YES      │ Extra metadata   │
│ ip_address   │ VARCHAR(45)  │ YES      │ IPv4 or IPv6     │
│ user_agent   │ TEXT         │ YES      │ Browser info     │
│ created_at   │ TIMESTAMP    │ NO       │ NOW()            │
└──────────────┴──────────────┴──────────┴──────────────────┘

Logged Actions:
├── USER_LOGIN
├── USER_LOGOUT
├── QUESTION_CREATED
├── QUESTION_UPDATED
├── QUESTION_DELETED
├── GAME_CREATED
├── GAME_STARTED
├── GAME_ENDED
├── ANSWER_SUBMITTED
├── USER_CREATED
├── PERMISSION_GRANTED
└── PERMISSION_REVOKED

Sample Data:
id: b50e8400-e29b-41d4-a716-446655440000
user_id: 550e8400-e29b-41d4-a716-446655440000
action: QUESTION_CREATED
entity_type: question
entity_id: 850e8400-e29b-41d4-a716-446655440000
details: {"question_text": "What is...?", "round": "Round 1"}
ip_address: 192.168.1.100
created_at: 2026-01-15 10:30:00

Relationships:
One User → Many Activity Logs
```

---

## 🔗 Relationship Specifications

### One-to-Many Relationships

```
1. ROUNDS (1) ──────>> (M) QUESTIONS
   - One round contains multiple questions
   - Foreign Key: questions.round_id → rounds.id
   - Cascade Delete: Yes (delete round → delete questions)

2. ROUNDS (1) ──────>> (M) GAMES
   - One round can have multiple games
   - Foreign Key: games.round_id → rounds.id
   - Cascade Delete: Yes (delete round → delete games)

3. QUESTION_TYPES (1) ──────>> (M) QUESTIONS
   - One question type has many questions
   - Foreign Key: questions.question_type → question_types.name
   - Cascade Delete: Prevent (with error message)

4. QUESTIONS (1) ──────>> (M) QUESTION_OPTIONS
   - One question has multiple options
   - Foreign Key: question_options.question_id → questions.id
   - Cascade Delete: Yes (delete question → delete options)

5. QUESTIONS (1) ──────>> (M) GAME_ANSWERS
   - One question has many answers (from different players)
   - Foreign Key: game_answers.question_id → questions.id
   - Cascade Delete: Yes (delete question → delete answers)

6. GAMES (1) ──────>> (M) GAME_GROUPS
   - One game has multiple teams
   - Foreign Key: game_groups.game_id → games.id
   - Cascade Delete: Yes (delete game → delete teams)

7. GAMES (1) ──────>> (M) GAME_ANSWERS
   - One game has many answers (all player submissions)
   - Foreign Key: game_answers.game_id → games.id
   - Cascade Delete: Yes (delete game → delete answers)

8. USERS (1) ──────>> (M) PERMISSIONS
   - One user has many permissions
   - Foreign Key: permissions.user_id → users.id
   - Cascade Delete: Yes (delete user → delete permissions)

9. USERS (1) ──────>> (M) ACTIVITY_LOG
   - One user has many activity records
   - Foreign Key: activity_log.user_id → users.id
   - Cascade Delete: No (preserve audit trail)

10. GAME_GROUPS (1) ──────>> (M) GAME_ANSWERS
    - One team has many answers
    - Foreign Key: game_answers.group_id → game_groups.id
    - Cascade Delete: Yes (delete group → delete answers)
```

### Many-to-One Relationships

```
QUESTIONS many-to-one ROUNDS
├── Each question belongs to one round
├── Foreign Key: questions.round_id
└── Index: (round_id) for performance

QUESTIONS many-to-one QUESTION_TYPES
├── Each question has one type
├── Foreign Key: questions.question_type
└── Index: (question_type) for performance

GAMES many-to-one ROUNDS
├── Each game uses one round
├── Foreign Key: games.round_id
└── Index: (round_id) for performance

GAME_GROUPS many-to-one GAMES
├── Each team belongs to one game
├── Foreign Key: game_groups.game_id
└── Index: (game_id) for performance

GAME_ANSWERS many-to-one GAMES
├── Each answer is part of one game
├── Foreign Key: game_answers.game_id
└── Index: (game_id) for fast queries

GAME_ANSWERS many-to-one QUESTIONS
├── Each answer is for one question
├── Foreign Key: game_answers.question_id
└── Index: (question_id) for performance

GAME_ANSWERS many-to-one USERS
├── Each answer is submitted by one user
├── Foreign Key: game_answers.user_id
└── Index: (user_id) for user stats

PERMISSIONS many-to-one USERS
├── Each permission belongs to one user
├── Foreign Key: permissions.user_id
└── Index: (user_id) for fast lookup

ACTIVITY_LOG many-to-one USERS
├── Each activity record is by one user
├── Foreign Key: activity_log.user_id
└── Index: (user_id) for user audit trail
```

---

## 📊 Cardinality Summary

| From | To | Relationship | Notes |
|------|-----|--------------|-------|
| USERS | PERMISSIONS | 1:M | User can have multiple permissions |
| USERS | ACTIVITY_LOG | 1:M | User can have multiple activity records |
| USERS | GAME_ANSWERS | 1:M | User can submit multiple answers |
| ROUNDS | QUESTIONS | 1:M | Round can have many questions |
| ROUNDS | GAMES | 1:M | Round can be used in multiple games |
| QUESTION_TYPES | QUESTIONS | 1:M | Type can have many questions |
| QUESTIONS | QUESTION_OPTIONS | 1:M | Question can have 4+ options (only multiple_choice/matching) |
| QUESTIONS | GAME_ANSWERS | 1:M | Question can be answered many times (NOT for sign_screen) |
| GAMES | GAME_GROUPS | 1:M | Game can have multiple teams |
| GAMES | GAME_ANSWERS | 1:M | Game has all player answers (NOT including sign_screen) |
| GAME_GROUPS | GAME_ANSWERS | 1:M | Team has multiple answers |

**Important Note on sign_screen**:
- Sign_screen questions → 0 Game Answers (no answers recorded)
- Sign_screen questions → 0 Question Options (no options needed)
- Sign_screen questions → 0 Marks (always 0)
- Sign_screen: Informational display only, not assessed

---

## 🔑 Key/Index Specifications

### Primary Keys
```
All tables use UUID (UUID v4) as primary key:
├── Generates globally unique identifiers
├── No sequence management needed
├── Better for distributed systems
└── Type: UUID (PostgreSQL native)
```

### Foreign Keys
```
All foreign keys include:
├── NOT NULL constraint (required)
├── Index on FK column (for JOIN performance)
├── CASCADE DELETE (where appropriate)
├── RESTRICT DELETE (for safety-critical relations)
└── Referential integrity enforcement
```

### Indexes

```
MOST FREQUENTLY QUERIED:
├── users(email)                  - Fast login lookup
├── games(round_id)               - Find games by round
├── games(status)                 - Filter by status
├── questions(round_id)           - Questions in round
├── questions(question_type)      - Questions by type
├── game_answers(game_id)         - Answers in game
├── game_answers(question_id)     - Responses to question
├── game_answers(user_id)         - Answers by user
├── game_groups(game_id)          - Teams in game
├── permissions(user_id)          - User permissions
├── activity_log(user_id)         - User activities
├── activity_log(created_at)      - Recent activities
└── question_options(question_id) - Options per question
```

---

## 🎯 Data Integrity Rules

### Constraints

```sql
-- PRIMARY KEYS
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE rounds ADD PRIMARY KEY (id);
ALTER TABLE games ADD PRIMARY KEY (id);
ALTER TABLE questions ADD PRIMARY KEY (id);
ALTER TABLE game_answers ADD PRIMARY KEY (id);

-- UNIQUE CONSTRAINTS
ALTER TABLE users ADD UNIQUE (email);
ALTER TABLE roles ADD UNIQUE (name);
ALTER TABLE question_types ADD UNIQUE (name);
ALTER TABLE rounds ADD UNIQUE (round_number);

-- NOT NULL CONSTRAINTS
ALTER TABLE questions ALTER COLUMN question_text SET NOT NULL;
ALTER TABLE questions ALTER COLUMN correct_answer SET NOT NULL;
ALTER TABLE games ALTER COLUMN status SET NOT NULL;
ALTER TABLE game_answers ALTER COLUMN is_correct SET NOT NULL;

-- FOREIGN KEY CONSTRAINTS
ALTER TABLE users ADD CONSTRAINT fk_users_roles
  FOREIGN KEY (role_name) REFERENCES roles(name);

ALTER TABLE questions ADD CONSTRAINT fk_questions_rounds
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE;

ALTER TABLE questions ADD CONSTRAINT fk_questions_types
  FOREIGN KEY (question_type) REFERENCES question_types(name)
  ON DELETE RESTRICT;

ALTER TABLE games ADD CONSTRAINT fk_games_rounds
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE;

ALTER TABLE game_answers ADD CONSTRAINT fk_answers_games
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;

ALTER TABLE game_answers ADD CONSTRAINT fk_answers_questions
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

ALTER TABLE game_answers ADD CONSTRAINT fk_answers_users
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- CHECK CONSTRAINTS
ALTER TABLE questions ADD CONSTRAINT check_time_limit
  CHECK (time_limit >= 5 AND time_limit <= 600);

ALTER TABLE game_answers ADD CONSTRAINT check_marks
  CHECK (marks_obtained >= 0 AND marks_obtained <= 100);

ALTER TABLE games ADD CHECK (status IN ('draft', 'active', 'paused', 'completed'));
```

---

## 📈 Data Volume Estimates

### Typical Deployment Scenarios

```
Small System (Small School):
├── Users: 100-500
├── Rounds: 5-10
├── Games: 20-50
├── Questions: 500-2,000
├── Game Answers: 5,000-50,000
└── Activity Logs: 50,000-200,000

Medium System (School District):
├── Users: 1,000-10,000
├── Rounds: 20-50
├── Games: 200-1,000
├── Questions: 5,000-50,000
├── Game Answers: 100,000-1,000,000
└── Activity Logs: 1,000,000-10,000,000

Large System (Country/Region):
├── Users: 10,000-100,000
├── Rounds: 50-200
├── Games: 1,000-10,000
├── Questions: 50,000-500,000
├── Game Answers: 1,000,000-10,000,000
└── Activity Logs: 10,000,000-100,000,000
```

### Storage Requirements

```
Per 1,000 Game Answers:
├── game_answers table: ~200 KB
├── activity_log records: ~150 KB
├── question_options cache: ~50 KB
└── Indexes overhead: ~100 KB
Total: ~500 KB per 1,000 answers

Growth Rate Estimation:
├── Small system: 50-100 MB/year
├── Medium system: 500 MB-1 GB/year
├── Large system: 5-10 GB/year
└── Database backups: 2-3x storage
```

---

## 🔄 View Suggestions

### Useful Database Views

```sql
-- View: User Activity Summary
CREATE VIEW v_user_activity AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  COUNT(DISTINCT al.id) as total_activities,
  MAX(al.created_at) as last_activity
FROM users u
LEFT JOIN activity_log al ON u.id = al.user_id
GROUP BY u.id, u.full_name, u.email;

-- View: Round Statistics
CREATE VIEW v_round_stats AS
SELECT 
  r.id,
  r.name,
  COUNT(DISTINCT q.id) as question_count,
  COUNT(DISTINCT g.id) as game_count,
  AVG(q.time_limit) as avg_time_limit
FROM rounds r
LEFT JOIN questions q ON r.id = q.round_id
LEFT JOIN games g ON r.id = g.round_id
GROUP BY r.id, r.name;

-- View: Game Performance
CREATE VIEW v_game_performance AS
SELECT 
  g.id,
  g.name,
  gg.id as group_id,
  gg.name as group_name,
  COUNT(DISTINCT ga.id) as answers_count,
  SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) as correct_answers,
  SUM(ga.marks_obtained) as total_marks
FROM games g
LEFT JOIN game_groups gg ON g.id = gg.game_id
LEFT JOIN game_answers ga ON gg.id = ga.group_id
GROUP BY g.id, g.name, gg.id, gg.name;
```

---

## 📊 Query Performance Recommendations

### Index Strategy

```
Priority 1 (Critical for Performance):
├── questions(round_id)           - Most common filter
├── game_answers(game_id)         - Answer retrieval
├── game_answers(created_at)      - Time-based queries
└── users(email)                  - Authentication

Priority 2 (Important for Analytics):
├── games(status)                 - Status filtering
├── activity_log(user_id)         - Audit trails
├── game_groups(game_id)          - Team queries
└── questions(question_type)      - Type filtering

Priority 3 (Nice to Have):
├── game_answers(user_id)         - User statistics
├── game_answers(question_id)     - Question analysis
├── permissions(user_id)          - Permission checks
└── activity_log(created_at)      - Recent activities
```

### Query Optimization Tips

```
1. ALWAYS use WHERE clause with indexed columns
   Good:   SELECT * FROM questions WHERE round_id = ?
   Bad:    SELECT * FROM questions WHERE question_text ILIKE ?

2. Use LIMIT for pagination
   Good:   SELECT * FROM games LIMIT 20 OFFSET 0
   Bad:    SELECT * FROM games (full table load)

3. Avoid SELECT * where possible
   Good:   SELECT id, name, status FROM games
   Bad:    SELECT * FROM games

4. Use batch operations for bulk inserts
   Good:   INSERT INTO questions (...) VALUES (...), (...), (...)
   Bad:    Multiple individual INSERT statements

5. Use JSONB indexing for complex data
   CREATE INDEX idx_activity_details ON activity_log USING GIN (details)
```

---

## 🔐 Security Constraints

### Data Protection

```
├── Password Fields: NEVER select password_hash in APIs
├── Email: Unique constraint prevents account hijacking
├── IP Address: Track for security audits
├── User Agent: Detect suspicious login patterns
├── Activity Log: NEVER DELETE (preserve audit trail)
└── Personal Data: Comply with GDPR/data privacy laws
```

---

## 📋 Migration Strategy

### From Legacy System

```
1. Create new schema with all tables
2. Migrate users (map old roles to new)
3. Migrate rounds and games
4. Migrate questions with new question_type mapping
5. Migrate game answers with user mapping
6. Validate referential integrity
7. Build indexes
8. Update application code
9. Run in parallel (old + new)
10. Cutover when validated
```

---

## 📖 Related Documentation

- See `SYSTEM_ARCHITECTURE.md` for system overview
- See `API_REFERENCE_COMPLETE.md` for API endpoints
- See database initialization scripts in `/scripts/` folder

---

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Database:** PostgreSQL 12+  
**Total Tables:** 11  
**Total Relationships:** 20+
