const sql = require('mssql');
const bcryptjs = require('bcryptjs');

const sqlConfig = {
  server: 'localhost\\SQLEXPRESS',
  database: 'qua_mk_db',
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'YourPassword123'
    }
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

async function seedDemoUsers() {
  try {
    console.log('[seed] Connecting to MSSQL...');
    const pool = await sql.connect(sqlConfig);
    console.log('[seed] Connected successfully!');

    // Generate password hash
    const passwordHash = '$2a$10$njN7Mjvmn/7ovzK2JUS6Fe2CkaU6fuxv1deDGGSXWA5qQbXFhk2Ey';

    // Get role IDs
    console.log('[seed] Fetching role IDs...');
    const adminRole = await pool.request()
      .query(`SELECT id FROM roles WHERE name = 'admin'`);
    const teacherRole = await pool.request()
      .query(`SELECT id FROM roles WHERE name = 'teacher'`);
    const playerRole = await pool.request()
      .query(`SELECT id FROM roles WHERE name = 'player'`);

    if (!adminRole.recordset[0] || !teacherRole.recordset[0] || !playerRole.recordset[0]) {
      console.error('[seed] Error: Roles not found. Run seed-db first.');
      process.exit(1);
    }

    const adminRoleId = adminRole.recordset[0].id;
    const teacherRoleId = teacherRole.recordset[0].id;
    const playerRoleId = playerRole.recordset[0].id;

    console.log('[seed] Inserting demo users...');

    // Insert admin user
    await pool.request()
      .input('email', sql.NVarChar, 'admin@example.com')
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('fullName', sql.NVarChar, 'Admin User')
      .input('roleId', sql.UniqueIdentifier, adminRoleId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = @email)
        INSERT INTO users (email, password_hash, full_name, role_id, is_active)
        VALUES (@email, @passwordHash, @fullName, @roleId, 1)
      `);
    console.log('[seed] ✓ Admin user created');

    // Insert teacher user
    await pool.request()
      .input('email', sql.NVarChar, 'teacher@example.com')
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('fullName', sql.NVarChar, 'Teacher User')
      .input('roleId', sql.UniqueIdentifier, teacherRoleId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = @email)
        INSERT INTO users (email, password_hash, full_name, role_id, is_active)
        VALUES (@email, @passwordHash, @fullName, @roleId, 1)
      `);
    console.log('[seed] ✓ Teacher user created');

    // Insert player user
    await pool.request()
      .input('email', sql.NVarChar, 'player@example.com')
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('fullName', sql.NVarChar, 'Player User')
      .input('roleId', sql.UniqueIdentifier, playerRoleId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = @email)
        INSERT INTO users (email, password_hash, full_name, role_id, is_active)
        VALUES (@email, @passwordHash, @fullName, @roleId, 1)
      `);
    console.log('[seed] ✓ Player user created');

    console.log('[seed] Demo users inserted successfully!');
    console.log('[seed] You can now login with:');
    console.log('[seed]   admin@example.com / password123');
    console.log('[seed]   teacher@example.com / password123');
    console.log('[seed]   player@example.com / password123');

    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('[seed] Error:', err.message);
    process.exit(1);
  }
}

seedDemoUsers();
