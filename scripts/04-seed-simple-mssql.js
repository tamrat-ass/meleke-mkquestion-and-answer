const sql = require('mssql');

const sqlConfig = {
  server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.MSSQL_DATABASE || 'qua_mk_db',
  authentication: {
    type: 'windows'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    instanceName: 'SQLEXPRESS'
  }
};

async function seedDatabase() {
  try {
    console.log('[seed] Connecting to MSSQL...');
    const pool = await sql.connect(sqlConfig);
    console.log('[seed] Starting database seeding...');

    // Insert roles
    console.log('[seed] Inserting roles...');
    await pool.request()
      .query(`
        INSERT INTO roles (name, description) VALUES
          ('admin', 'Administrator with full system access'),
          ('teacher', 'Game Master / Teacher - can create and manage games'),
          ('player', 'Student / Player - can participate in games')
      `);

    // Insert permissions
    console.log('[seed] Inserting permissions...');
    await pool.request()
      .query(`
        INSERT INTO permissions (name, description) VALUES
          ('upload_questions', 'Upload questions via Excel'),
          ('create_questions', 'Create questions manually'),
          ('start_rounds', 'Start game rounds'),
          ('manage_users', 'Manage system users'),
          ('manage_questions', 'Add, update, delete, recover questions'),
          ('view_logs', 'View activity logs and reports'),
          ('manage_themes', 'Customize UI colors and themes'),
          ('manage_roles', 'Manage roles and permissions'),
          ('join_games', 'Join and play games'),
          ('answer_questions', 'Submit answers to questions')
      `);

    // Insert question types
    console.log('[seed] Inserting question types...');
    await pool.request()
      .query(`
        INSERT INTO question_types (name, description) VALUES
          ('choose', 'Multiple choice - select one or more options'),
          ('sign', 'Sign / True-False / Symbol-based questions')
      `);

    // Get role IDs
    console.log('[seed] Fetching role IDs...');
    const adminRole = await pool.request()
      .query(`SELECT id FROM roles WHERE name = 'admin'`);
    const teacherRole = await pool.request()
      .query(`SELECT id FROM roles WHERE name = 'teacher'`);
    const playerRole = await pool.request()
      .query(`SELECT id FROM roles WHERE name = 'player'`);

    const adminRoleId = adminRole.recordset[0].id;
    const teacherRoleId = teacherRole.recordset[0].id;
    const playerRoleId = playerRole.recordset[0].id;

    // Assign all permissions to admin role
    console.log('[seed] Assigning permissions to admin role...');
    await pool.request()
      .input('adminRoleId', sql.UniqueIdentifier, adminRoleId)
      .query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT @adminRoleId, id FROM permissions
      `);

    // Assign teacher permissions
    console.log('[seed] Assigning permissions to teacher role...');
    await pool.request()
      .input('teacherRoleId', sql.UniqueIdentifier, teacherRoleId)
      .query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT @teacherRoleId, id FROM permissions
        WHERE name IN ('upload_questions', 'create_questions', 'start_rounds', 'manage_questions', 'manage_themes')
      `);

    // Assign player permissions
    console.log('[seed] Assigning permissions to player role...');
    await pool.request()
      .input('playerRoleId', sql.UniqueIdentifier, playerRoleId)
      .query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT @playerRoleId, id FROM permissions
        WHERE name IN ('join_games', 'answer_questions')
      `);

    console.log('[seed] Seed data inserted successfully!');
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('[seed] Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();
