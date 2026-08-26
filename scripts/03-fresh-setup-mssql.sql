-- Complete fresh setup - drop everything and recreate

-- Disable all constraints
EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'

-- Drop all tables
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

PRINT 'All tables dropped'

-- Create roles table
CREATE TABLE roles (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT GETDATE()
);

-- Create permissions table
CREATE TABLE permissions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT GETDATE()
);

-- Create role_permissions table
CREATE TABLE role_permissions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  role_id UNIQUEIDENTIFIER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UNIQUEIDENTIFIER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(role_id, permission_id)
);

-- Create users table
CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id UNIQUEIDENTIFIER NOT NULL REFERENCES roles(id),
  is_active BIT DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Create sections table
CREATE TABLE sections (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Create rounds table
CREATE TABLE rounds (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(100) NOT NULL,
  round_number INT NOT NULL UNIQUE,
  description TEXT,
  created_by UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Create question_types table
CREATE TABLE question_types (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT GETDATE()
);

-- Create questions table
CREATE TABLE questions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  section_id UNIQUEIDENTIFIER NOT NULL REFERENCES sections(id),
  round_id UNIQUEIDENTIFIER NOT NULL REFERENCES rounds(id),
  question_type_id UNIQUEIDENTIFIER NOT NULL REFERENCES question_types(id),
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  time_limit INT NOT NULL DEFAULT 30,
  marks INT NOT NULL DEFAULT 1,
  created_by UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  is_deleted BIT DEFAULT 0,
  deleted_at DATETIME,
  deleted_by UNIQUEIDENTIFIER REFERENCES users(id),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  UNIQUE(section_id, round_id, question_number)
);

-- Create question_options table
CREATE TABLE question_options (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  question_id UNIQUEIDENTIFIER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_key VARCHAR(10) NOT NULL,
  option_value TEXT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(question_id, option_key)
);

-- Create question_versions table
CREATE TABLE question_versions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  question_id UNIQUEIDENTIFIER NOT NULL REFERENCES questions(id),
  version_number INT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  time_limit INT NOT NULL,
  marks INT NOT NULL,
  changed_by UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(question_id, version_number)
);

-- Create games table
CREATE TABLE games (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(255) NOT NULL,
  created_by UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  started_at DATETIME,
  ended_at DATETIME,
  is_active BIT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Create game_sections table
CREATE TABLE game_sections (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  game_id UNIQUEIDENTIFIER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  section_id UNIQUEIDENTIFIER NOT NULL REFERENCES sections(id),
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(game_id, section_id)
);

-- Create game_rounds table
CREATE TABLE game_rounds (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  game_id UNIQUEIDENTIFIER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_id UNIQUEIDENTIFIER NOT NULL REFERENCES rounds(id),
  status VARCHAR(20) DEFAULT 'pending',
  started_at DATETIME,
  ended_at DATETIME,
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(game_id, round_id)
);

-- Create game_questions table
CREATE TABLE game_questions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  game_round_id UNIQUEIDENTIFIER NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
  question_id UNIQUEIDENTIFIER NOT NULL REFERENCES questions(id),
  display_order INT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(game_round_id, question_id)
);

-- Create players table
CREATE TABLE players (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UNIQUEIDENTIFIER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  total_score INT DEFAULT 0,
  joined_at DATETIME DEFAULT GETDATE(),
  left_at DATETIME,
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(user_id, game_id)
);

-- Create answers table
CREATE TABLE answers (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  player_id UNIQUEIDENTIFIER NOT NULL REFERENCES players(id) ON DELETE NO ACTION,
  game_question_id UNIQUEIDENTIFIER NOT NULL REFERENCES game_questions(id) ON DELETE NO ACTION,
  answer_text VARCHAR(255) NOT NULL,
  is_correct BIT,
  points_earned INT DEFAULT 0,
  submission_time INT,
  submitted_at DATETIME DEFAULT GETDATE(),
  created_at DATETIME DEFAULT GETDATE()
);

-- Create themes table
CREATE TABLE themes (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(100) NOT NULL,
  primary_color VARCHAR(7) DEFAULT '#3b82f6',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#000000',
  button_color VARCHAR(7) DEFAULT '#3b82f6',
  is_dark_mode BIT DEFAULT 0,
  is_default BIT DEFAULT 0,
  created_by UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  game_id UNIQUEIDENTIFIER REFERENCES games(id),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UNIQUEIDENTIFIER,
  details NVARCHAR(MAX),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT GETDATE()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_questions_section_id ON questions(section_id);
CREATE INDEX idx_questions_round_id ON questions(round_id);
CREATE INDEX idx_questions_is_deleted ON questions(is_deleted);
CREATE INDEX idx_game_rounds_game_id ON game_rounds(game_id);
CREATE INDEX idx_answers_player_id ON answers(player_id);
CREATE INDEX idx_answers_game_question_id ON answers(game_question_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

PRINT 'Schema created successfully'

-- Now insert seed data
INSERT INTO roles (id, name, description) VALUES
  ('A0000000-0000-0000-0000-000000000001', 'admin', 'Administrator with full system access'),
  ('A0000000-0000-0000-0000-000000000002', 'teacher', 'Game Master / Teacher - can create and manage games'),
  ('A0000000-0000-0000-0000-000000000003', 'player', 'Student / Player - can participate in games');

INSERT INTO permissions (id, name, description) VALUES
  ('P0000000-0000-0000-0000-000000000001', 'upload_questions', 'Upload questions via Excel'),
  ('P0000000-0000-0000-0000-000000000002', 'create_questions', 'Create questions manually'),
  ('P0000000-0000-0000-0000-000000000003', 'start_rounds', 'Start game rounds'),
  ('P0000000-0000-0000-0000-000000000004', 'manage_users', 'Manage system users'),
  ('P0000000-0000-0000-0000-000000000005', 'manage_questions', 'Add, update, delete, recover questions'),
  ('P0000000-0000-0000-0000-000000000006', 'view_logs', 'View activity logs and reports'),
  ('P0000000-0000-0000-0000-000000000007', 'manage_themes', 'Customize UI colors and themes'),
  ('P0000000-0000-0000-0000-000000000008', 'manage_roles', 'Manage roles and permissions'),
  ('P0000000-0000-0000-0000-000000000009', 'join_games', 'Join and play games'),
  ('P0000000-0000-0000-0000-000000000010', 'answer_questions', 'Submit answers to questions');

INSERT INTO question_types (id, name, description) VALUES
  ('Q0000000-0000-0000-0000-000000000001', 'choose', 'Multiple choice - select one or more options'),
  ('Q0000000-0000-0000-0000-000000000002', 'sign', 'Sign / True-False / Symbol-based questions');

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'A0000000-0000-0000-0000-000000000001', id FROM permissions;

-- Assign teacher permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'A0000000-0000-0000-0000-000000000002', id FROM permissions
WHERE name IN ('upload_questions', 'create_questions', 'start_rounds', 'manage_questions', 'manage_themes');

-- Assign player permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'A0000000-0000-0000-0000-000000000003', id FROM permissions
WHERE name IN ('join_games', 'answer_questions');

PRINT 'Seed data inserted successfully'
