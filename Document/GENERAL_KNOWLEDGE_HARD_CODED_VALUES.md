# General Knowledge - Hard-Coded Values Found & Analysis

**Document Type:** Issue Analysis  
**Version:** 1.0  
**Date Created:** June 2026  
**Status:** Issues Identified  
**Owner:** Development Team

---

## 🔴 Hard-Coded Values Found

### Issue #1: GeneralKnowledgeQuestion Component Default

**File:** `components/general-knowledge-question.tsx`

**Location:** Line 29

```typescript
minimumTime = 5,  // ← HARD-CODED DEFAULT
```

**Status:** ❌ Hard-coded (should be passed from props or database)

---

### Issue #2: Game Page - Fallback Value

**File:** `app/game/[id]/page.tsx`

**Location:** Line 168

```typescript
if (selectedQuestion && timeLeft === (selectedQuestion.minimum_time_frame || 5) && timeLeft > 0) {
    // ← Hard-coded fallback of 5
}
```

**Status:** ❌ Hard-coded fallback (uses database value if exists, but defaults to 5)

---

### Issue #3: Game Page - Component Props

**File:** `app/game/[id]/page.tsx`

**Location:** Line 654

```typescript
minimumTime={selectedQuestion.minimum_time_frame || 5}  // ← Hard-coded fallback of 5
```

**Status:** ❌ Hard-coded fallback (uses database value if exists, but defaults to 5)

---

### Issue #4: Game Page - GeneralKnowledgeQuestion Call Missing Prop

**File:** `app/game/[id]/page.tsx`

**Location:** Lines 453-467

```typescript
<GeneralKnowledgeQuestion
  questionNumber={selectedQuestionIndex + 1}
  totalQuestions={selectedTypeQuestions.length}
  question={selectedQuestion.title}
  timeLeft={timeLeft}
  totalTime={selectedQuestion.time_limit || 30}
  // ← minimumTime prop is NOT being passed here!
  onBack={() => {...}}
  onTimerClick={() => {...}}
  onNextQuestion={async () => {...}}
/>
```

**Status:** ❌ Not passing minimumTime prop - using component default of 5

---

## 🔍 Where Hard-Coded Values Are Used

### Component Logic:

1. **Alarm Sound Trigger** (Line 42-48)
   ```typescript
   if (mounted && timeLeft <= minimumTime && timeLeft > 0 && !alarmPlayed) {
     playAlarm();  // ← Uses hard-coded minimumTime = 5
   }
   ```

2. **Component Default** (Line 29)
   ```typescript
   minimumTime = 5,  // ← Default when no prop passed
   ```

---

## 📊 Impact Analysis

### Affected Question Types:
- ✅ **general_knowledge** - Uses hard-coded 5 (main issue)

### Affected Operations:
1. When displaying general_knowledge questions in game
2. When playing alarm sound (hard-coded to 5 seconds)
3. When timer reaches minimum threshold

### Data Flow Issue:

```
Database (min_minimum_time_frame = custom value)
    ↓
API Returns selectedQuestion.minimum_time_frame
    ↓
Game Page receives it (line 168, 654)
    ↓
BUT not passed to GeneralKnowledgeQuestion component (line 453)
    ↓
Component uses hard-coded default of 5
    ↓
Wrong minimum_time_frame applied to UI
```

---

## ✅ Required Fixes

### Fix #1: Update GeneralKnowledgeQuestion Component

**File:** `components/general-knowledge-question.tsx`

**Change:**
```typescript
// OLD (Line 29)
minimumTime = 5,  // ← Hard-coded

// NEW
minimumTime,  // ← Required prop (no default)
```

**Also make it required in the interface:**
```typescript
interface GeneralKnowledgeQuestionProps {
  // ... other props
  minimumTime: number;  // ← Remove the default, make it required
}
```

---

### Fix #2: Pass minimumTime Prop in Game Page

**File:** `app/game/[id]/page.tsx`

**Location:** Lines 453-467

**Change:**
```typescript
// OLD
<GeneralKnowledgeQuestion
  questionNumber={selectedQuestionIndex + 1}
  totalQuestions={selectedTypeQuestions.length}
  question={selectedQuestion.title}
  timeLeft={timeLeft}
  totalTime={selectedQuestion.time_limit || 30}
  onBack={() => {...}}
  onTimerClick={() => {...}}
  onNextQuestion={async () => {...}}
/>

// NEW
<GeneralKnowledgeQuestion
  questionNumber={selectedQuestionIndex + 1}
  totalQuestions={selectedTypeQuestions.length}
  question={selectedQuestion.title}
  timeLeft={timeLeft}
  totalTime={selectedQuestion.time_limit || 30}
  minimumTime={selectedQuestion.minimum_time_frame || 1}  // ← ADD THIS
  onBack={() => {...}}
  onTimerClick={() => {...}}
  onNextQuestion={async () => {...}}
/>
```

---

### Fix #3: Remove Hard-Coded Fallback (Optional but Recommended)

**File:** `app/game/[id]/page.tsx`

**Location:** Line 168

**Current:**
```typescript
if (selectedQuestion && timeLeft === (selectedQuestion.minimum_time_frame || 5) && timeLeft > 0) {
```

**Option A - Keep database value only (requires minimum_time_frame in DB):**
```typescript
if (selectedQuestion && selectedQuestion.minimum_time_frame && timeLeft === selectedQuestion.minimum_time_frame && timeLeft > 0) {
```

**Option B - Use database value with sensible default:**
```typescript
if (selectedQuestion && timeLeft === (selectedQuestion.minimum_time_frame ?? 1) && timeLeft > 0) {
```

---

## 🎯 Root Cause

The general_knowledge component was designed with a hard-coded default of `5` seconds, but the game page correctly fetches `minimum_time_frame` from the database. However:

1. The component prop is NOT being passed from the game page
2. The component falls back to its hard-coded default of 5
3. This bypasses the database-driven constraints completely

---

## 📋 Testing Checklist

After applying fixes, verify:

- [ ] General knowledge questions display with correct minimum_time_frame
- [ ] Alarm sounds at the correct time (based on database value, not hard-coded 5)
- [ ] Different question types have different minimum_time_frame values
- [ ] Database value is used when available
- [ ] Questions created via API use database constraints

---

## 🔧 Code Changes Summary

**Total Files to Update:** 2

1. `components/general-knowledge-question.tsx` - Remove hard-coded default
2. `app/game/[id]/page.tsx` - Pass minimumTime prop + remove fallback

**Difficulty:** Low  
**Risk:** Low (only affects general_knowledge display)  
**Backward Compatibility:** Yes (always had minimum time frame)

---

## ✅ Conclusion

**YES - general_knowledge has hard-coded values:**

1. **Component default:** `minimumTime = 5` (hard-coded)
2. **Game page fallback:** `|| 5` (hard-coded)
3. **Missing prop pass:** `minimumTime` not sent to component

**Solution:** Pass `minimum_time_frame` from database to component prop (2 simple changes)

