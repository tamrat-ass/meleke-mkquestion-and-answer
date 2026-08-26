const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4840@localhost:5432/qua_mk_db',
});

async function getUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.password_hash,
        r.name as role_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    console.log('\n========== USERS LIST ==========\n');
    result.rows.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.first_name} ${user.last_name}`);
      console.log(`  Role: ${user.role_name}`);
      console.log(`  Password Hash: ${user.password_hash}`);
      console.log(`  Active: ${user.is_active}`);
      console.log(`  Created: ${user.created_at}`);
      console.log('');
    });

    console.log(`Total Users: ${result.rows.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

getUsers();
