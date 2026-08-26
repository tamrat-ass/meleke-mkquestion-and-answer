-- Scrambled Word Challenge - Integrated with Generic Questions
-- Uses questions table + question_types + independent scrambled_word_questions table

-- 1. Insert Scrambled Word Challenge question type
INSERT INTO question_types (name, description)
VALUES ('scrambled_word', 'Scrambled Word Challenge - Players must identify the original word from scrambled letters')
ON CONFLICT (name) DO NOTHING;

-- 2. Create Independent Scrambled Word Questions Table (For metadata only)
CREATE TABLE IF NOT EXISTS scrambled_word_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
  category VARCHAR(100),
  hint TEXT,
  scramble_seed INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create Game Answers for Scrambled Words
CREATE TABLE IF NOT EXISTS scrambled_word_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scrambled_word_id UUID NOT NULL REFERENCES scrambled_word_questions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_answer VARCHAR(255) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INT DEFAULT 0,
  time_taken INT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_answer_per_player_per_question UNIQUE(player_id, game_id, scrambled_word_id)
);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scrambled_word_questions_question_id 
  ON scrambled_word_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_scrambled_word_questions_category 
  ON scrambled_word_questions(category);
CREATE INDEX IF NOT EXISTS idx_scrambled_word_answers_player_id 
  ON scrambled_word_answers(player_id);
CREATE INDEX IF NOT EXISTS idx_scrambled_word_answers_game_id 
  ON scrambled_word_answers(game_id);
CREATE INDEX IF NOT EXISTS idx_scrambled_word_answers_scrambled_word_id 
  ON scrambled_word_answers(scrambled_word_id);
CREATE INDEX IF NOT EXISTS idx_scrambled_word_answers_submitted_at 
  ON scrambled_word_answers(submitted_at);
