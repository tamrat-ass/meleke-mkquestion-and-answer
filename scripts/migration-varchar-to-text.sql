-- Migration: Change correct_answer from VARCHAR(255) to TEXT
-- This allows short answer questions to support multi-line paragraphs

-- For PostgreSQL
-- ALTER TABLE questions ALTER COLUMN correct_answer TYPE TEXT;
-- ALTER TABLE question_versions ALTER COLUMN correct_answer TYPE TEXT;

-- For MySQL
-- ALTER TABLE questions MODIFY correct_answer TEXT;
-- ALTER TABLE question_versions MODIFY correct_answer TEXT;

-- For MSSQL
-- ALTER TABLE questions ALTER COLUMN correct_answer TEXT;
-- ALTER TABLE question_versions ALTER COLUMN correct_answer TEXT;
