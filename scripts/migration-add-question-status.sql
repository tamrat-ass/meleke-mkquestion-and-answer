-- Migration: Add question status field for general knowledge questions
-- This migration adds a status column to track whether questions have been viewed

-- For PostgreSQL
ALTER TABLE questions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'NOT_OPENED';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_status_type ON questions(status, question_type_id);

-- Add comment explaining the status field
COMMENT ON COLUMN questions.status IS 'Question status: NOT_OPENED (not yet viewed), OPENED (already viewed)';
COMMENT ON COLUMN questions.opened_at IS 'Timestamp when question was marked as OPENED';
