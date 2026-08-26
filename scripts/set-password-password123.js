const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setPassword() {
  const client = await pool.connect();
  try {
    console.log('Setting all user passwords to: password123\n');
    
    const password = 'password123';
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    console.log(`Password: ${password}`);
    console.log(`SHA256 Hash: ${passwordHash}\n`);

    const result = await client.query(
      'UPDATE users SET password_hash = $1 RETURNING id, email, first_name, last_name',
      [passwordHash]
    );

    console.log(`✓ Updated ${result.rows.length} users\n`);
    console.log('Users updated:');
    result.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.first_name} ${user.last_name})`);
    });

    console.log(`\nAll users can now login with:`);
    console.log(`  Email: admin@example.com`);
    console.log(`  Password: password123`);
  } catch (error) {
    console.error('Error setting password:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setPassword();
