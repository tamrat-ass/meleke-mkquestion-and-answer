-- Insert demo users for testing

-- Get role IDs
DECLARE @admin_role_id UNIQUEIDENTIFIER = (SELECT id FROM roles WHERE name = 'admin');
DECLARE @teacher_role_id UNIQUEIDENTIFIER = (SELECT id FROM roles WHERE name = 'teacher');
DECLARE @player_role_id UNIQUEIDENTIFIER = (SELECT id FROM roles WHERE name = 'player');

-- Insert demo users
INSERT INTO users (email, password_hash, full_name, role_id, is_active)
VALUES 
  ('admin@example.com', '$2a$10$njN7Mjvmn/7ovzK2JUS6Fe2CkaU6fuxv1deDGGSXWA5qQbXFhk2Ey', 'Admin User', @admin_role_id, 1),
  ('teacher@example.com', '$2a$10$njN7Mjvmn/7ovzK2JUS6Fe2CkaU6fuxv1deDGGSXWA5qQbXFhk2Ey', 'Teacher User', @teacher_role_id, 1),
  ('player@example.com', '$2a$10$njN7Mjvmn/7ovzK2JUS6Fe2CkaU6fuxv1deDGGSXWA5qQbXFhk2Ey', 'Player User', @player_role_id, 1);

PRINT 'Demo users inserted successfully!';
