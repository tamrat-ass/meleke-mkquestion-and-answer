const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedUsers() {
  const client = await pool.connect();
  try {
    console.log('Starting user seeding...');

    // Get role IDs
    const adminRoleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const teacherRoleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['teacher']);
    const playerRoleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['player']);

    if (!adminRoleResult.rows[0] || !teacherRoleResult.rows[0] || !playerRoleResult.rows[0]) {
      console.error('Roles not found. Please ensure roles are created first.');
      return;
    }

    const adminRoleId = adminRoleResult.rows[0].id;
    const teacherRoleId = teacherRoleResult.rows[0].id;
    const playerRoleId = playerRoleResult.rows[0].id;

    // Define users to insert
    const users = [
      {
        email: 'teacher@example.com',
        firstName: 'Teacher',
        lastName: 'User',
        password: 'password123',
        roleId: teacherRoleId,
      },
      {
        email: 'player@example.com',
        firstName: 'Player',
        lastName: 'User',
        password: 'password123',
        roleId: playerRoleId,
      },
    ];

    // Insert only missing users
    for (const user of users) {
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [user.email]);
      
      if (existingUser.rows.length === 0) {
        await client.query(
          'INSERT INTO users (email, first_name, last_name, password_hash, role_id, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.email, user.firstName, user.lastName, user.password, user.roleId, true]
        );
        console.log(`✓ Created user: ${user.email}`);
      } else {
        console.log(`✓ User already exists: ${user.email}`);
      }
    }

    console.log('✓ User seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    client.release();
    pool.end();
  }
}

seedUsers();
