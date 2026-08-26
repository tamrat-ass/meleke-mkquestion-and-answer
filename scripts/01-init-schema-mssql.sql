-- SQL Server Schema for Q&A Game Platform

-- Roles table
CREATE TABLE roles (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT GETDATE()
);

-- Permissions table
CREATE TABLE permissions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT GETDATE()
);

-- Role-Permission junction table
CREATE TABLE role_permissions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  role_id UNIQUEIDENTIFIER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UNIQUEIDENTIFIER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(role_id, permission_id)
);

-- Users table
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

-- Sections table
CREATE TABLE sections (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Rounds table
CREATE TABLE rounds (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(100) NOT NULL,
  round_number INT NOT NULL UNIQUE,
  description TEXT,
  created_by UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Question Types table
CREATE TABLE question_types (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT GETDATE()
);

-- Questions table
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

-- Question Options table (for MCQ)
CREATE TABLE question_options (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  question_id UNIQUEIDENTIFIER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_key VARCHAR(10) NOT NULL,
  option_value TEXT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(question_id, option_key)
);

-- Question Versions table (for shadowing/versioning)
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

-- Games table
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

-- Game Sections table
CREATE TABLE game_sections (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  game_id UNIQUEIDENTIFIER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  section_id UNIQUEIDENTIFIER NOT NULL REFERENCES sections(id),
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(game_id, section_id)
);

-- Game Rounds table
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

-- Game Questions table
CREATE TABLE game_questions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  game_round_id UNIQUEIDENTIFIER NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
  question_id UNIQUEIDENTIFIER NOT NULL REFERENCES questions(id),
  display_order INT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  UNIQUE(game_round_id, question_id)
);

-- Players table
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

-- Answers table
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

-- Themes table
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

-- Activity Logs table
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

-- Create indexes for better query performance
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
