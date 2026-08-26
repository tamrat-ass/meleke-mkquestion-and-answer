const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetPasswords() {
  const client = await pool.connect();
  try {
    console.log('Resetting all user passwords to default...');
    
    // Default password: DefaultPassword123!
    const defaultPassword = 'DefaultPassword123!';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');

    console.log(`Default password: ${defaultPassword}`);
    console.log(`Password hash: ${passwordHash}`);

    const result = await client.query(
      'UPDATE users SET password_hash = $1 RETURNING id, email, first_name, last_name',
      [passwordHash]
    );

    console.log(`\n✓ Updated ${result.rows.length} users`);
    console.log('\nUsers updated:');
    result.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.first_name} ${user.last_name})`);
    });

    console.log(`\nAll users can now login with password: ${defaultPassword}`);
  } catch (error) {
    console.error('Error resetting passwords:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetPasswords();
