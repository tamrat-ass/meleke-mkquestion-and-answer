-- Drop all tables in reverse order of dependencies

-- Disable foreign key constraints temporarily
EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'

-- Drop tables
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS themes;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS game_questions;
DROP TABLE IF EXISTS game_rounds;
DROP TABLE IF EXISTS game_sections;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS question_versions;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS question_types;
DROP TABLE IF EXISTS rounds;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

-- Re-enable foreign key constraints
EXEC sp_MSForEachTable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'

PRINT 'All tables dropped successfully!'
