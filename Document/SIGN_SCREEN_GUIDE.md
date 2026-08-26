# Sign Screen Question Type Documentation

**Document Type:** Feature Guide  
**Version:** 1.0  
**Date Created:** June 2026  
**Status:** Complete  
**Owner:** Development Team

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Purpose & Use Cases](#purpose--use-cases)
3. [How Sign Screen Works](#how-sign-screen-works)
4. [Configuration](#configuration)
5. [Creating Sign Screen Questions](#creating-sign-screen-questions)
6. [Bulk Upload Format](#bulk-upload-format)
7. [Game Play Experience](#game-play-experience)
8. [UI/UX Design](#uiux-design)
9. [Technical Implementation](#technical-implementation)
10. [Database Schema](#database-schema)
11. [API Endpoints](#api-endpoints)
12. [Differences from Other Question Types](#differences-from-other-question-types)
13. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## 🎯 Overview

**Sign Screen** is a specialized question type in the Q&A Game Platform designed to display full-screen information, announcements, confirmations, or important messages to users during a quiz game.

### Key Characteristics

| Aspect | Details |
|--------|---------|
| **Type Name** | `sign_screen` |
| **Purpose** | Display information/messages to all participants |
| **User Input** | None - purely informational |
| **Scoring** | No marks awarded (0 points) |
| **Correct Answer** | Not required (empty string) |
| **Timer** | 30-60 seconds (configurable) |
| **Display Mode** | Full-screen immersive experience |
| **Use Case** | Announcements, instructions, breaks, important notices |

### Examples of Sign Screen Content

✔️ **"Break Time - Stretch and Relax!"** (2-minute break announcement)  
✔️ **"Section 1 Complete - Now Starting Section 2"** (Progress indicator)  
✔️ **"Read the instructions carefully before proceeding"** (Important notice)  
✔️ **"Final Question Coming Up!"** (Preparation message)  
✔️ **"Congratulations! Quiz Complete"** (Final message)  

---

## 💡 Purpose & Use Cases

### UC1: Break Announcements
**Scenario**: During a long quiz, the teacher wants to give players a 2-minute break.

**Implementation**:
- Create sign_screen question with text: "Break Time - 2 Minutes"
- Set time_limit to 120 seconds
- Insert between regular questions
- Full-screen display signals break time to all participants

**User Experience**:
- Player sees full-screen "Break Time - 2 Minutes" message
- 2-minute countdown timer displays prominently
- Cannot skip or submit answer (read-only screen)
- Automatically advances to next question after timer expires

---

### UC2: Section Transitions
**Scenario**: Multi-section quiz (e.g., Math, Science, History sections).

**Implementation**:
- Sign_screen questions between each section
- Text: "Section 1 Complete - Now Starting Section 2: Science"
- 30-second display for reading
- Helps pace the quiz and signal transitions

**Benefits**:
- Clear visual break between sections
- Tells players what's coming next
- Maintains engagement and flow

---

### UC3: Important Instructions
**Scenario**: Must communicate critical information before a difficult section.

**Implementation**:
- Text: "Important: Multiple Choice Only - Select ONE answer"
- 45-second display time
- Shows before complex question section
- Ensures all players understand requirements

---

### UC4: Motivational Messages
**Scenario**: Start and end quiz with motivational content.

**Implementation**:
- Start: "Welcome! You have 30 minutes to complete this quiz"
- End: "Excellent Work! Quiz Complete - Results Coming Soon"
- Creates professional quiz experience

---

## ⚙️ How Sign Screen Works

### Sign Screen Flow

```
1. Teacher Creates Sign Screen Question
         ↓
2. Question Stored in Database (marks = 0, correct_answer = '')
         ↓
3. Game Loaded - Sign Screen Question Appears
         ↓
4. SignScreen Component Renders (Full-screen display)
         ↓
5. Timer Starts (when user clicks the screen or logo)
         ↓
6. Countdown Visible (MM:SS format, red/prominent)
         ↓
7. When Timer Reaches 5 Seconds (Alarm sound plays)
         ↓
8. Timer Expires (No answer submission required)
         ↓
9. Auto-Advance to Next Question
         ↓
10. Continue Game Flow
```

### Key Characteristics of Behavior

**No User Answer Input**:
- Sign screen questions don't require or accept user answers
- No "Submit Answer" button
- Players cannot skip or interact (except timer controls)
- No scoring/marks calculation

**Automatic Progression**:
- When timer expires, system automatically loads next question
- No player action needed to proceed
- Ensures consistent pacing

**Timer Controls**:
- Click the screen or logo to START the timer
- Click the reset button (↻) to RESET the timer
- Cannot pause mid-countdown
- Back button (left logo) goes back to previous questions

**Visual Design**:
- Full-screen immersive experience
- Large readable text (scales based on content length)
- Prominent timer display (MM:SS format)
- Progress bar at bottom
- Professional branding (logos on left/right)
- Dark/light mode support

---

## ⚙️ Configuration

### Database Question Type Record

**Table**: `question_types`

```sql
INSERT INTO question_types (name, description, time_limit)
VALUES (
  'sign_screen',
  'Information display screen with timer - no user input',
  60
);
```

| Field | Value | Description |
|-------|-------|-------------|
| `name` | `sign_screen` | Unique type identifier |
| `time_limit` | 60 | Default timer seconds (can override per question) |
| `description` | Information display screen | What this type does |

### Question Record Structure

For a sign screen question in the `questions` table:

```sql
INSERT INTO questions (
  id,
  round_id,
  question_type,
  question_text,
  correct_answer,
  time_limit,
  marks,
  created_at
) VALUES (
  'q-uuid-123',
  'round-uuid-456',
  'sign_screen',
  'Break Time - 2 Minutes',
  '',                    -- Empty for sign_screen
  120,                   -- Override default (60) with 120
  0,                     -- Always 0 marks
  '2026-06-10 10:30:00'
);
```

### Key Differences from Other Types

| Field | Multiple Choice | Short Answer | Sign Screen |
|-------|-----------------|--------------|-------------|
| `correct_answer` | Required | Required | Empty string |
| `marks` | 1-100 | 1-100 | Always 0 |
| `options` | Required (4) | None | None |
| `time_limit` | 20-60 sec | 30-90 sec | 30-600 sec |
| Scoring | Yes | Yes | No |
| User Input | Yes | Yes | No |

---

## 📝 Creating Sign Screen Questions

### Method 1: UI Dashboard

**Step 1**: Navigate to **Dashboard → Questions → New Question**

**Step 2**: Fill Question Details
```
Question Type: [Select] → "Sign Screen" ✓
Question Text: "Break Time - 2 Minutes"
```

**Step 3**: Observe Conditional Rendering
- When you select "Sign Screen", the form automatically:
  - Hides "Correct Answer" field
  - Hides "Options" fields (A, B, C, D)
  - Hides "Marks" field
  - Shows only: Question Text, Round, Time Limit

**Step 4**: Set Additional Details
```
Round: [Select round]
Time Limit: 120 seconds
```

**Step 5**: Submit
- Click "Create Question"
- Question saved with marks = 0, correct_answer = ''

### Form Logic (Code Reference)

```typescript
// In Create Question Form
if (formData.question_type !== 'sign_screen') {
  // Show fields for other question types
  if (!formData.correct_answer) {
    setError("Answer Required");
    return;
  }
  // Validate options for multiple choice
} else {
  // For sign_screen: no validation needed
  // Set defaults: correct_answer = '', marks = 0
}

const response = await fetch('/api/questions', {
  method: 'POST',
  body: JSON.stringify({
    question_text: formData.question_text,
    question_type: 'sign_screen',
    correct_answer: '',              // Empty
    marks: 0,                         // Zero
    time_limit: 120,                 // Custom or default
    round_id: formData.round_id,
  }),
});
```

---

## 📤 Bulk Upload Format

### Excel Upload for Sign Screen

When bulk uploading questions via Excel, sign_screen questions have a simplified format:

#### Excel Column Structure

| Column | Required? | For Sign Screen |
|--------|-----------|-----------------|
| Question Text | ✅ Yes | Question/message |
| Type | ✅ Yes | `sign_screen` |
| Correct Answer | ❌ No | Leave blank |
| Option A | ❌ No | Leave blank |
| Option B | ❌ No | Leave blank |
| Option C | ❌ No | Leave blank |
| Option D | ❌ No | Leave blank |
| Marks | ❌ No | Leave blank (defaults to 0) |

#### Example Excel Data

```
| Question Text | Type | Correct Answer | Option A | Option B | Option C | Option D | Marks |
|---|---|---|---|---|---|---|---|
| Break Time - 2 Minutes | sign_screen | | | | | | |
| Section 1 Complete | sign_screen | | | | | | |
| Read Instructions | sign_screen | | | | | | |
| What is 2+2? | multiple_choice | A | 4 | 5 | 6 | 7 | 4 |
```

### Validation Rules for Upload

**For sign_screen rows**:
```
✅ VALID:
- Question text present
- Type = "sign_screen" (case-insensitive)
- Correct answer can be blank
- Options can be blank
- Marks field can be blank

❌ INVALID:
- Question text missing
- Type misspelled (e.g., "sign screen", "signscreen")
- Empty row
```

**Error Messages**:
```
Row 3: Correct Answer is NOT required for sign_screen ✓
Row 5: Invalid question type "sign scren" - Use "sign_screen" ✗
Row 7: Question text is required ✗
```

---

## 🎮 Game Play Experience

### Player Perspective

When a player encounters a sign_screen question during a game:

#### Screen 1: Initial Display
```
┌─────────────────────────────────────────┐
│                                         │
│        [MK Logo]  🕐  [Platform Logo]  │
│                                         │
│                                         │
│      "Break Time - 2 Minutes"          │
│                                         │
│           (Click to start)             │
│                                         │
│      [Progress Bar: 0%]                │
│           [↻ Reset]                    │
│                                         │
└─────────────────────────────────────────┘
```

**Status**: Waiting for player to click to start timer

#### Screen 2: Timer Running
```
┌─────────────────────────────────────────┐
│                                         │
│        [MK Logo]  🕐  [Platform Logo]  │
│                                         │
│                                         │
│      "Break Time - 2 Minutes"          │
│                                         │
│            02:00 ⏱️                     │
│        (Pulsing animation)             │
│                                         │
│      [Progress Bar: 15%]               │
│           [↻ Reset]                    │
│                                         │
└─────────────────────────────────────────┘
```

**Status**: Countdown in progress (2:00 remaining)

#### Screen 3: Final 5 Seconds
```
┌─────────────────────────────────────────┐
│                                         │
│        [MK Logo]  🕐  [Platform Logo]  │
│                                         │
│                                         │
│      "Break Time - 2 Minutes"          │
│                                         │
│            00:05 ⏱️ 🔴                  │
│      (RED color, alarm sound plays)    │
│                                         │
│      [Progress Bar: 98%] (RED)         │
│           [↻ Reset]                    │
│                                         │
└─────────────────────────────────────────┘
```

**Status**: Final 5 seconds, alarm sounding

#### Screen 4: Auto-Advance
```
Timer reaches 00:00
         ↓
No answer submission needed
         ↓
Automatically load next question
         ↓
Proceed to next question in game
```

### Interactive Elements

| Element | Action | Result |
|---------|--------|--------|
| Click Message Text | Starts timer | Timer begins counting down |
| Click Logo (left) | Goes back | Returns to question selection |
| Click Logo (right) | Starts timer | Timer begins counting down |
| Click Reset Button (↻) | Resets timer | Time reverts to full (2:00 → 2:00) |
| Timer expires | Auto-advance | Next question loads automatically |

---

## 🎨 UI/UX Design

### Sign Screen Component Structure

```
SignScreen Component
├── Background Layer
│   └── Light/Dark theme background
├── Main Card Container
│   ├── Top Section (Logos + Timer)
│   │   ├── Left Logo (MK - Back button)
│   │   ├── Center Timer Display
│   │   │   ├── Clock Icon (🕐)
│   │   │   └── Time in MM:SS format
│   │   └── Right Logo (Platform logo)
│   ├── Content Section (Message)
│   │   └── Question Text (large, centered)
│   ├── Progress Bar (bottom)
│   │   └── Visual timer progress
│   └── Controls (bottom)
│       └── Reset Button (↻)
└── Audio Element (hidden alarm sound)
```

### Visual Styling

#### Colors
- **Default**: Red (#c0392b)
- **Warning** (5 sec remaining): Dark Red (#7B0000)
- **Background**: Light mode (#f0eeea), Dark mode (#1a1a1a)
- **Card**: White (#ffffff)
- **Text**: Black/Dark (#1a1a1a)

#### Typography
- **Question Text**: 80-120px (scales based on content length)
- **Timer Display**: 72px bold
- **Font Weight**: 600-700
- **Font Family**: System fonts (San Francisco, Segoe UI)

#### Animation
- **Timer Pulse**: Scale 1.0 → 1.3, opacity fade
- **Duration**: 1.5 seconds, infinite loop
- **Progress Bar**: Linear width animation (1 sec per second)
- **Button Hover**: Opacity and scale changes

### Responsive Design
- **Full-screen layout**: 100vh height
- **Card max-width**: 1200px
- **Padding**: 80px (scales on smaller screens)
- **Mobile**: Adapts padding and font sizes
- **Touch-friendly**: Large tap targets (40px buttons)

---

## 🔧 Technical Implementation

### Frontend Component: SignScreen.tsx

**File Location**: `/components/sign-screen.tsx`

**Key State Variables**:
```typescript
const [timeLeft, setTimeLeft] = useState(question.time_limit);      // Current countdown
const [isComplete, setIsComplete] = useState(false);                 // Timer finished?
const [isDarkMode, setIsDarkMode] = useState(false);                // Theme mode
const [timerStarted, setTimerStarted] = useState(false);            // Timer active?
```

**Props Interface**:
```typescript
interface SignScreenProps {
  question: {
    id: string;
    question_text: string;
    time_limit: number;
  };
  onTimeUp: () => void;              // Callback when timer expires
  onBack?: () => void;               // Callback for back button
}
```

**Key Functions**:

1. **Timer Logic**:
```typescript
useEffect(() => {
  if (!timerStarted || isComplete) return;
  
  const timer = setInterval(() => {
    setTimeLeft(prev => {
      const newTime = prev - 1;
      
      if (newTime === 5) {
        // Play alarm sound when 5 seconds left
        audioRef.current?.play();
      }
      
      if (newTime <= 0) {
        setIsComplete(true);
        onTimeUp();  // Call parent callback
        return 0;
      }
      
      return newTime;
    });
  }, 1000);
  
  return () => clearInterval(timer);
}, [timerStarted, isComplete, onTimeUp]);
```

2. **Time Formatting**:
```typescript
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
// Example: 125 seconds → "02:05"
```

3. **Timer Start**:
```typescript
const handleStartTimer = () => {
  setTimerStarted(true);
};
```

4. **Timer Reset**:
```typescript
const handleResetTimer = () => {
  setTimeLeft(question.time_limit);
  setIsComplete(false);
  setTimerStarted(false);  // Stop timer when resetting
};
```

### Integration in Game Page

**File Location**: `/app/game/[id]/page.tsx`

**How Sign Screen Questions Are Handled**:

```typescript
// In Game Component
if (selectedQuestion) {
  if (selectedQuestion.question_type === 'sign_screen') {
    return (
      <SignScreen
        question={{
          id: selectedQuestion.id,
          question_text: selectedQuestion.title || '',
          time_limit: selectedQuestion.time_limit || 60
        }}
        onBack={() => {
          // Go back to question type selection
          setSelectedQuestion(null);
          setShowAnswer(false);
        }}
        onTimeUp={() => {
          // Auto-advance to next question
          const currentIndex = selectedTypeQuestions.indexOf(selectedQuestion);
          if (currentIndex < selectedTypeQuestions.length - 1) {
            // Load next question
            const nextQuestion = selectedTypeQuestions[currentIndex + 1];
            // Fetch and display next question
          } else {
            // End of questions
            setSelectedQuestion(null);
          }
        }}
      />
    );
  }
  
  // Handle other question types (multiple_choice, short_answer, etc.)
  return (
    // Regular question display
  );
}
```

**Key Behavior**:
- When sign_screen timer expires, NO game answer is saved
- Automatically advances to next question
- No user answer submitted to database
- No scoring involved

---

## 🗄️ Database Schema

### Question Table Entry for Sign Screen

```sql
-- Sign Screen Question Example
INSERT INTO questions (
  id,
  round_id,
  question_type,
  question_text,
  correct_answer,
  time_limit,
  marks,
  created_at
) VALUES (
  '12345678-1234-1234-1234-123456789012',
  '87654321-4321-4321-4321-210987654321',
  'sign_screen',
  'Break Time - 2 Minutes',
  '',        -- Empty string for sign_screen
  120,       -- Custom time (2 minutes)
  0,         -- Always 0 marks
  NOW()
);
```

### Question Types Table

```sql
-- Sign Screen Type
SELECT * FROM question_types WHERE name = 'sign_screen';

Result:
┌────────────────────────────────────────┬──────────────┬──────────────────────────────────────────┐
│ id                                     │ name         │ time_limit                               │
├────────────────────────────────────────┼──────────────┼──────────────────────────────────────────┤
│ 550e8400-e29b-41d4-a716-446655440999  │ sign_screen  │ 60                                       │
└────────────────────────────────────────┴──────────────┴──────────────────────────────────────────┘
```

### Game Answers Table

**Important**: Sign screen questions do NOT create game_answers records.

```sql
-- This table entry does NOT exist for sign_screen questions
-- Because:
-- 1. No user answer to record (no input field)
-- 2. No scoring (marks = 0)
-- 3. No correctness evaluation (no correct answer)

-- Contrast with multiple_choice questions:
INSERT INTO game_answers (
  id,
  game_id,
  question_id,
  user_id,
  answer,
  is_correct,
  marks_obtained,
  time_taken,
  created_at
) VALUES (
  '...',
  '...',
  '...',  -- If question_type = 'multiple_choice'
  '...',
  'A',    -- User's answer
  true,   -- Correct or not
  4,      -- Marks earned
  15000,  -- Time in milliseconds
  NOW()
);

-- For sign_screen: NO record created above
```

### Relationships

```
Rounds (1) ──────>> (M) Questions
             
Questions (1) ──────>> (M) Game Answers
(But: sign_screen questions have 0 game_answers)

Question Types (1) ──────>> (M) Questions
└── sign_screen type → many sign_screen questions
    (No game_answers for any of these)
```

---

## 📡 API Endpoints

### 1. Create Sign Screen Question

**Endpoint**: `POST /api/questions`

**Request**:
```json
{
  "question_text": "Break Time - 2 Minutes",
  "question_type": "sign_screen",
  "round_id": "round-uuid-123",
  "correct_answer": "",
  "time_limit": 120,
  "marks": 0
}
```

**Response (201 Created)**:
```json
{
  "question": {
    "id": "q-uuid-456",
    "question_text": "Break Time - 2 Minutes",
    "question_type": "sign_screen",
    "round_id": "round-uuid-123",
    "correct_answer": "",
    "time_limit": 120,
    "marks": 0,
    "created_at": "2026-06-10T10:30:00Z"
  },
  "message": "Question created successfully"
}
```

### 2. Get Sign Screen Question

**Endpoint**: `GET /api/questions/:id`

**Response (200 OK)**:
```json
{
  "question": {
    "id": "q-uuid-456",
    "title": "Break Time - 2 Minutes",
    "question_text": "Break Time - 2 Minutes",
    "question_type": "sign_screen",
    "round_id": "round-uuid-123",
    "correct_answer": "",
    "time_limit": 120,
    "marks": 0
  }
}
```

### 3. Bulk Upload with Sign Screen

**Endpoint**: `POST /api/questions/upload`

**Excel Parsing**:
```typescript
// For each row in Excel:
const questionType = row['Type']; // "sign_screen"

if (questionType === 'sign_screen') {
  // Correct answer not required
  // Options not required
  // Marks can be empty
  
  const question = {
    question_text: row['Question Text'],
    question_type: 'sign_screen',
    correct_answer: '',
    marks: 0,
    time_limit: <inherited from type>
  };
}
```

### 4. Questions by Round

**Endpoint**: `GET /api/questions/by-round/:roundId`

**Includes Sign Screen Questions**:
```json
{
  "questions": [
    {
      "id": "q-uuid-1",
      "title": "What is 2+2?",
      "question_type": "multiple_choice",
      "time_limit": 30,
      "options": [...]
    },
    {
      "id": "q-uuid-2",
      "title": "Break Time - 2 Minutes",
      "question_type": "sign_screen",
      "time_limit": 120,
      "options": []
    }
  ]
}
```

---

## 📊 Differences from Other Question Types

### Comparison Table

| Feature | Multiple Choice | Short Answer | True/False | Sign Screen |
|---------|-----------------|--------------|-----------|------------|
| **User Input** | Required | Required | Required | None |
| **Scoring** | Yes | Yes | Yes | No |
| **Correct Answer** | Required | Required | Required | Not needed |
| **Options** | 4 required | None | Yes/No | None |
| **Time Limit** | 20-60 sec | 30-90 sec | 20-30 sec | 30-600 sec |
| **Marks** | 1-100 | 1-100 | 1-100 | Always 0 |
| **Game Answers Record** | Created | Created | Created | Not created |
| **Display Mode** | Question + options | Text field | Options | Full-screen |
| **Purpose** | Assessment | Assessment | Assessment | Information |
| **Use Case** | Knowledge test | Free response | Quick check | Announcements |

### Validation Rules

**Creation Validation**:

```typescript
// Multiple Choice / Short Answer / True False
if (!correctAnswer) {
  throw Error("Correct answer required");
}

// Sign Screen (DIFFERENT)
if (questionType === 'sign_screen') {
  // NO validation for correct_answer
  // NO validation for options
  // NO validation for marks
  correctAnswer = '';
  marks = 0;
}
```

**Upload Validation**:

```
For sign_screen rows:
✅ Question text required
✅ Type = 'sign_screen'
❌ Correct answer optional (can be blank)
❌ Options optional (can be blank)
❌ Marks optional (auto-set to 0)

For other rows:
✅ Question text required
✅ Type required
✅ Correct answer required
✅ Options required (for multiple_choice)
✅ Marks required
```

---

## ❓ FAQ & Troubleshooting

### Q1: Do players get points for sign_screen questions?

**A**: No. Sign_screen questions always award 0 marks. They are informational only, not assessments.

```typescript
marks: questionType === 'sign_screen' ? 0 : parseInt(marks);
```

### Q2: Can I skip a sign_screen question?

**A**: No. When a sign_screen appears, you must let the timer complete. However, you can:
- Click the back arrow (left logo) to return to question selection
- Click reset button to restart the timer

### Q3: What happens if a player doesn't click to start the timer?

**A**: The timer will NOT start automatically. Players must click the message text or logo to start the countdown. This gives them time to read the message.

### Q4: Is the sign_screen answer saved to database?

**A**: No. Sign_screen questions do NOT create game_answers records. Nothing is saved except the question itself exists in the round.

```typescript
// No game answer submission for sign_screen
if (questionType !== 'sign_screen') {
  await saveGameAnswer(gameId, questionId, answer, isCorrect);
}
```

### Q5: Can I change the timer on a sign_screen question?

**A**: Yes! The `time_limit` field can be set per question:
- Default from question_type: 60 seconds
- Override per question: Any value 30-600 seconds
- 2 minutes (break): 120 seconds
- 30 seconds (brief message): 30 seconds

### Q6: What's the audio alarm that plays?

**A**: When 5 seconds remain, an alarm sound plays (`/audio/alarm.wav`) to alert players.

**Error if not found**:
```typescript
if (audioRef.current) {
  audioRef.current.play().catch((error) => {
    console.error('Audio playback failed:', error);
    // Component continues working without audio
  });
}
```

**Solution**: Ensure `/public/audio/alarm.wav` exists.

### Q7: How do I include sign_screen in my Excel upload?

**A**: 
```
Row 1: Headers (Question Text | Type | Correct Answer | Option A | ... | Marks)
Row 2: Break Time - 2 Minutes | sign_screen | [blank] | [blank] | [blank] | [blank]
Row 3: Section 1 Complete | sign_screen | [blank] | [blank] | [blank] | [blank]
```

**Key**: Leave Correct Answer, Options, and Marks blank for sign_screen.

### Q8: Can I have multiple sign_screen questions in a row?

**A**: Yes! You can have consecutive sign_screen questions:
```
Question 1: Multiple Choice (scored)
Question 2: Sign Screen - "Section 1 Complete" (0 marks)
Question 3: Sign Screen - "Now Starting Section 2" (0 marks)
Question 4: Multiple Choice (scored)
```

### Q9: What if a sign_screen question has the wrong time_limit?

**Scenario**: Question created with 30 seconds but needs 120 seconds.

**Solution**:
1. Delete the question
2. Recreate with correct time_limit (120)

OR (from edit page):
1. Edit question
2. Change time_limit to 120
3. Save

### Q10: Why is the screen so large and full?

**A**: Sign_screen is designed for prominent display to ensure all players see important messages. Full-screen immersive design:
- Captures attention
- Ensures readability from distance
- Professional presentation
- Breaks up regular question flow

---

## 🎯 Use Case Examples

### Example 1: Break Time Announcement

**Setup**:
- Question Text: "Break Time - 5 Minutes"
- Type: sign_screen
- Time Limit: 300 seconds (5 minutes)
- Round Position: After question 10

**Player Experience**:
1. Finishes question 10 (multiple choice)
2. Auto-loads sign_screen
3. Sees "Break Time - 5 Minutes" on full screen
4. Clicks to start timer
5. 5-minute countdown displays
6. After 5 minutes, next question loads

---

### Example 2: Section Transition

**Setup**:
```
Question 9: Last question of Section 1 (multiple_choice)
Question 10: Sign Screen - "Section 1 Complete! Starting Section 2: Science" (45 sec)
Question 11: First question of Section 2 (multiple_choice)
```

**Flow**:
1. Player completes question 9
2. Sign_screen displays for 45 seconds
3. Automatically advances to question 11
4. Player starts answering science questions

---

### Example 3: Important Instructions

**Setup**:
- Position: Before difficult question section
- Text: "IMPORTANT: For the next 5 questions, select only ONE answer - multiple answers will be marked incorrect"
- Time: 60 seconds

**Purpose**: Ensures players understand rules before proceeding

---

### Example 4: Quiz Start Message

**Setup**:
```
Question 1: Sign Screen - "Welcome! Quiz Rules: 1) No phones 2) Raise hand for help 3) 30 min limit" (60 sec)
Question 2: First actual question (multiple_choice)
```

**Purpose**: Set expectations and rules before starting

---

## 📝 Best Practices

### ✅ Do's

- ✅ Use clear, concise messages (one idea per sign_screen)
- ✅ Set appropriate time limits (30-120 seconds typical)
- ✅ Use for instructions before complex sections
- ✅ Place strategically between regular questions
- ✅ Test timer lengths in practice runs
- ✅ Use large readable text (emoji, short words)

### ❌ Don'ts

- ❌ Don't use for testing knowledge (it's informational only)
- ❌ Don't exceed 3-4 sign screens per quiz (reduces engagement)
- ❌ Don't use extremely long text (won't be readable)
- ❌ Don't mix sign_screen timing with question timing (confusing)
- ❌ Don't force players to "skip" or "answer" sign screens
- ❌ Don't use for critical instructions (can be missed)

---

## 🔗 Related Documentation

- [REQUIREMENTS.md](./REQUIREMENTS.md) - Feature requirements
- [API_REFERENCE_COMPLETE.md](./API_REFERENCE_COMPLETE.md) - Full API documentation
- [USER_MANUAL.md](./USER_MANUAL.md) - End-user guide
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - System design

---

## 📞 Support

**Questions about Sign Screen?**

- Check FAQ section above (Q1-Q10)
- Review use case examples
- Contact development team
- Submit issue on GitHub

---

## ✅ Checklist: Creating a Sign Screen Question

Before creating a sign_screen question, verify:

- [ ] Question type = "sign_screen" (not "sign screen" or other variant)
- [ ] Question text is clear and readable
- [ ] Time limit is appropriate (30-600 seconds)
- [ ] Leave Correct Answer blank
- [ ] Leave Options (A/B/C/D) blank
- [ ] Leave Marks at 0
- [ ] Round is selected
- [ ] Purpose is informational, not assessment
- [ ] Message won't confuse players
- [ ] Test with full game before using live

---

**Document Version**: 1.0  
**Last Updated**: June 2026  
**Status**: Complete and Ready for Use

*For clarifications or updates, please contact the development team.*
