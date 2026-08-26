-- Migration: Add question status field for general knowledge questions (MSSQL)
-- This migration adds a status column to track whether questions have been viewed

-- Add columns if they don't exist
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'questions' AND COLUMN_NAME = 'status')
BEGIN
    ALTER TABLE questions ADD status VARCHAR(20) DEFAULT 'NOT_OPENED';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'questions' AND COLUMN_NAME = 'opened_at')
BEGIN
    ALTER TABLE questions ADD opened_at DATETIME;
END

-- Create indexes for efficient filtering
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_questions_status')
BEGIN
    CREATE INDEX idx_questions_status ON questions(status);
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_questions_status_type')
BEGIN
    CREATE INDEX idx_questions_status_type ON questions(status, question_type_id);
END
