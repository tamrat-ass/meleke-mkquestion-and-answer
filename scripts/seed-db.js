const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');

const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'quiz_app',
};

async function seedDatabase() {
  let connection;
  try {
    console.log('[v0] Connecting to MySQL (Laragon)...');
    connection = await mysql.createConnection(dbConfig);
    console.log('[v0] Starting database seeding...');

    // 1. Insert roles
    console.log('[v0] Inserting roles...');
    const rolesData = [
      { name: 'admin', description: 'Administrator with full system access' },
      { name: 'teacher', description: 'Game Master / Teacher - can create and manage games' },
      { name: 'player', description: 'Student / Player - can participate in games' },
    ];

    for (const role of rolesData) {
      await connection.execute(
        `INSERT IGNORE INTO roles (name, description) VALUES (?, ?)`,
        [role.name, role.description]
      );
    }

    // 2. Insert permissions
    console.log('[v0] Inserting permissions...');
    const permissionsData = [
      { name: 'upload_questions', description: 'Upload questions via Excel' },
      { name: 'create_questions', description: 'Create questions manually' },
      { name: 'start_rounds', description: 'Start game rounds' },
      { name: 'manage_users', description: 'Manage system users' },
      { name: 'manage_questions', description: 'Add, update, delete, recover questions' },
      { name: 'view_logs', description: 'View activity logs and reports' },
      { name: 'manage_themes', description: 'Customize UI colors and themes' },
      { name: 'manage_roles', description: 'Manage roles and permissions' },
      { name: 'join_games', description: 'Join and play games' },
      { name: 'answer_questions', description: 'Submit answers to questions' },
    ];

    for (const perm of permissionsData) {
      await connection.execute(
        `INSERT IGNORE INTO permissions (name, description) VALUES (?, ?)`,
        [perm.name, perm.description]
      );
    }

    // 3. Insert question types
    console.log('[v0] Inserting question types...');
    const questionTypesData = [
      { name: 'choose', description: 'Multiple choice - select one or more options' },
      { name: 'sign', description: 'Sign / True-False / Symbol-based questions' },
    ];

    for (const qt of questionTypesData) {
      await connection.execute(
        `INSERT IGNORE INTO question_types (name, description) VALUES (?, ?)`,
        [qt.name, qt.description]
      );
    }

    // 4. Get role IDs
    const [roleRows] = await connection.execute('SELECT id, name FROM roles');
    const roles = {};
    (roleRows || []).forEach((row) => {
      roles[row.name] = row.id;
    });
    console.log('[v0] Role IDs:', roles);

    // 5. Get permission IDs
    const [permsRows] = await connection.execute('SELECT id, name FROM permissions');
    const permissions = {};
    (permsRows || []).forEach((row) => {
      permissions[row.name] = row.id;
    });

    // 6. Assign permissions to roles
    console.log('[v0] Assigning permissions to roles...');
    const assignPerm = async (roleId, permName) => {
      if (!permissions[permName]) {
        console.warn(`Permission ${permName} not found!`);
        return;
      }
      await connection.execute(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
        [roleId, permissions[permName]]
      );
    };

    for (const perm of permissionsData) await assignPerm(roles.admin, perm.name);

    const teacherPerms = [
      'upload_questions',
      'create_questions',
      'start_rounds',
      'manage_questions',
      'manage_themes',
    ];
    for (const perm of teacherPerms) await assignPerm(roles.teacher, perm);

    const playerPerms = ['join_games', 'answer_questions'];
    for (const perm of playerPerms) await assignPerm(roles.player, perm);

    console.log('[v0] Permissions assigned to roles');

    // 7. Create users
    console.log('[v0] Creating demo users...');
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash('password123', salt);

    const upsertUser = async (email, fullName, roleId) => {
      const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (Array.isArray(existing) && existing.length > 0) {
        await connection.execute(
          'UPDATE users SET password_hash = ?, role_id = ?, is_active = 1 WHERE email = ?',
          [passwordHash, roleId, email]
        );
      } else {
        await connection.execute(
          'INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES (?, ?, ?, ?, 1)',
          [email, passwordHash, fullName, roleId]
        );
      }
    };

    if (roles.admin) await upsertUser('admin@example.com', 'Admin User', roles.admin);
    if (roles.teacher) await upsertUser('teacher@example.com', 'Teacher User', roles.teacher);
    if (roles.player) await upsertUser('player@example.com', 'Player User', roles.player);

    console.log('[v0] Database seeded successfully!');
    console.log('[v0] Demo credentials:');
    console.log('[v0]   Admin: admin@example.com / password123');
    console.log('[v0]   Teacher: teacher@example.com / password123');
    console.log('[v0]   Player: player@example.com / password123');

    await connection.end();
  } catch (error) {
    console.error('[v0] Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

