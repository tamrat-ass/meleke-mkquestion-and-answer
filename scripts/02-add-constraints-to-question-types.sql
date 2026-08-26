-- Migration: Add time frame constraints to question_types table
-- Purpose: Store minimum and maximum time limits per question type in the database instead of hard-coding them
-- Date: June 2026

-- PostgreSQL Migration
-- For PostgreSQL, use this:
ALTER TABLE IF EXISTS question_types 
ADD COLUMN IF NOT EXISTS min_time_limit INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_time_limit INT DEFAULT 300,
ADD COLUMN IF NOT EXISTS min_minimum_time_frame INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_minimum_time_frame INT DEFAULT NULL;

-- Add constraints to ensure valid values
ALTER TABLE question_types 
ADD CONSTRAINT min_time_limit_positive CHECK (min_time_limit > 0),
ADD CONSTRAINT max_time_limit_greater_than_min CHECK (max_time_limit > min_time_limit),
ADD CONSTRAINT min_minimum_time_frame_positive CHECK (min_minimum_time_frame >= 0);

-- MySQL Migration (if using MySQL)
-- Uncomment and use this if your database is MySQL:
/*
ALTER TABLE question_types 
ADD COLUMN min_time_limit INT DEFAULT 5 AFTER time_limit,
ADD COLUMN max_time_limit INT DEFAULT 300 AFTER min_time_limit,
ADD COLUMN min_minimum_time_frame INT DEFAULT 1 AFTER max_time_limit,
ADD COLUMN max_minimum_time_frame INT DEFAULT NULL AFTER min_minimum_time_frame,
ADD CONSTRAINT min_time_limit_positive CHECK (min_time_limit > 0),
ADD CONSTRAINT max_time_limit_gt_min CHECK (max_time_limit > min_time_limit),
ADD CONSTRAINT min_minimum_time_frame_positive CHECK (min_minimum_time_frame >= 0);
*/

-- MSSQL Migration (if using MSSQL)
-- Uncomment and use this if your database is MSSQL:
/*
ALTER TABLE question_types 
ADD min_time_limit INT DEFAULT 5,
    max_time_limit INT DEFAULT 300,
    min_minimum_time_frame INT DEFAULT 1,
    max_minimum_time_frame INT DEFAULT NULL;

ALTER TABLE question_types 
ADD CONSTRAINT min_time_limit_positive CHECK (min_time_limit > 0),
    CONSTRAINT max_time_limit_gt_min CHECK (max_time_limit > min_time_limit),
    CONSTRAINT min_minimum_time_frame_positive CHECK (min_minimum_time_frame >= 0);
*/

-- Update existing question types with appropriate constraints
-- These constraints can be customized per question type as needed

UPDATE question_types 
SET min_time_limit = 5,
    max_time_limit = 300,
    min_minimum_time_frame = 1
WHERE min_time_limit IS NULL;

-- You can customize constraints per question type:
-- Example for sign_screen: longer break times
UPDATE question_types 
SET min_time_limit = 30,
    max_time_limit = 600,
    min_minimum_time_frame = 5
WHERE name = 'sign_screen';

-- Example for multiple_choice: shorter focused times
UPDATE question_types 
SET min_time_limit = 5,
    max_time_limit = 120,
    min_minimum_time_frame = 1
WHERE name = 'multiple_choice';

-- Example for short_answer: moderate times
UPDATE question_types 
SET min_time_limit = 10,
    max_time_limit = 300,
    min_minimum_time_frame = 2
WHERE name = 'short_answer';
