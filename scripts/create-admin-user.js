const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAdminUser() {
  const client = await pool.connect();
  try {
    console.log('Creating admin user...');

    // Get admin role
    const roleResult = await client.query(
      'SELECT id FROM roles WHERE name = $1',
      ['admin']
    );

    if (roleResult.rows.length === 0) {
      console.error('Admin role not found. Run npm run init-db first.');
      process.exit(1);
    }

    const roleId = roleResult.rows[0].id;

    // Hash password
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['admin@example.com', passwordHash, 'Admin', 'User', roleId, true]
    );

    if (userResult.rows.length > 0) {
      console.log('✓ Admin user created successfully');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    } else {
      console.log('✓ Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser();
