-- Insert roles
INSERT INTO roles (id, name, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin', 'Administrator with full system access'),
  ('a0000000-0000-0000-0000-000000000002', 'teacher', 'Game Master / Teacher - can create and manage games'),
  ('a0000000-0000-0000-0000-000000000003', 'player', 'Student / Player - can participate in games')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (id, name, description) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'upload_questions', 'Upload questions via Excel'),
  ('p0000000-0000-0000-0000-000000000002', 'create_questions', 'Create questions manually'),
  ('p0000000-0000-0000-0000-000000000003', 'start_rounds', 'Start game rounds'),
  ('p0000000-0000-0000-0000-000000000004', 'manage_users', 'Manage system users'),
  ('p0000000-0000-0000-0000-000000000005', 'manage_questions', 'Add, update, delete, recover questions'),
  ('p0000000-0000-0000-0000-000000000006', 'view_logs', 'View activity logs and reports'),
  ('p0000000-0000-0000-0000-000000000007', 'manage_themes', 'Customize UI colors and themes'),
  ('p0000000-0000-0000-0000-000000000008', 'manage_roles', 'Manage roles and permissions'),
  ('p0000000-0000-0000-0000-000000000009', 'join_games', 'Join and play games'),
  ('p0000000-0000-0000-0000-000000000010', 'answer_questions', 'Submit answers to questions')
ON CONFLICT (name) DO NOTHING;

-- Insert question types
INSERT INTO question_types (id, name, description) VALUES
  ('q0000000-0000-0000-0000-000000000001', 'choose', 'Multiple choice - select one or more options'),
  ('q0000000-0000-0000-0000-000000000002', 'sign', 'Sign / True-False / Symbol-based questions')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign teacher permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000002', id FROM permissions
WHERE name IN ('upload_questions', 'create_questions', 'start_rounds', 'manage_questions', 'manage_themes')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign player permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000003', id FROM permissions
WHERE name IN ('join_games', 'answer_questions')
ON CONFLICT (role_id, permission_id) DO NOTHING;
