-- SQL Server Seed Data for Q&A Game Platform

-- Insert roles
INSERT INTO roles (id, name, description) VALUES
  (CAST('A0000000-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER), 'admin', 'Administrator with full system access'),
  (CAST('A0000000-0000-0000-0000-000000000002' AS UNIQUEIDENTIFIER), 'teacher', 'Game Master / Teacher - can create and manage games'),
  (CAST('A0000000-0000-0000-0000-000000000003' AS UNIQUEIDENTIFIER), 'player', 'Student / Player - can participate in games');

-- Insert permissions
INSERT INTO permissions (id, name, description) VALUES
  (CAST('P0000000-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER), 'upload_questions', 'Upload questions via Excel'),
  (CAST('P0000000-0000-0000-0000-000000000002' AS UNIQUEIDENTIFIER), 'create_questions', 'Create questions manually'),
  (CAST('P0000000-0000-0000-0000-000000000003' AS UNIQUEIDENTIFIER), 'start_rounds', 'Start game rounds'),
  (CAST('P0000000-0000-0000-0000-000000000004' AS UNIQUEIDENTIFIER), 'manage_users', 'Manage system users'),
  (CAST('P0000000-0000-0000-0000-000000000005' AS UNIQUEIDENTIFIER), 'manage_questions', 'Add, update, delete, recover questions'),
  (CAST('P0000000-0000-0000-0000-000000000006' AS UNIQUEIDENTIFIER), 'view_logs', 'View activity logs and reports'),
  (CAST('P0000000-0000-0000-0000-000000000007' AS UNIQUEIDENTIFIER), 'manage_themes', 'Customize UI colors and themes'),
  (CAST('P0000000-0000-0000-0000-000000000008' AS UNIQUEIDENTIFIER), 'manage_roles', 'Manage roles and permissions'),
  (CAST('P0000000-0000-0000-0000-000000000009' AS UNIQUEIDENTIFIER), 'join_games', 'Join and play games'),
  (CAST('P0000000-0000-0000-0000-000000000010' AS UNIQUEIDENTIFIER), 'answer_questions', 'Submit answers to questions');

-- Insert question types
INSERT INTO question_types (id, name, description) VALUES
  (CAST('Q0000000-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER), 'choose', 'Multiple choice - select one or more options'),
  (CAST('Q0000000-0000-0000-0000-000000000002' AS UNIQUEIDENTIFIER), 'sign', 'Sign / True-False / Symbol-based questions');

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT CAST('A0000000-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER), id FROM permissions;

-- Assign teacher permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT CAST('A0000000-0000-0000-0000-000000000002' AS UNIQUEIDENTIFIER), id FROM permissions
WHERE name IN ('upload_questions', 'create_questions', 'start_rounds', 'manage_questions', 'manage_themes');

-- Assign player permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT CAST('A0000000-0000-0000-0000-000000000003' AS UNIQUEIDENTIFIER), id FROM permissions
WHERE name IN ('join_games', 'answer_questions');
