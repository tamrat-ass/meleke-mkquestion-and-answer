const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPasswords() {
  const client = await pool.connect();
  try {
    console.log('Checking user passwords in database...\n');
    
    const result = await client.query(
      'SELECT id, email, first_name, last_name, password_hash FROM users ORDER BY created_at'
    );

    if (result.rows.length === 0) {
      console.log('No users found in database');
      return;
    }

    console.log(`Found ${result.rows.length} users:\n`);

    // Test passwords
    const testPasswords = [
      'DefaultPassword123!',
      'password123',
      'Password123!',
      'admin',
      'teacher',
      'player',
    ];

    result.rows.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.first_name} ${user.last_name}`);
      console.log(`Stored hash: ${user.password_hash}`);
      
      // Try to match with test passwords
      let matched = false;
      testPasswords.forEach(testPass => {
        const hash = crypto.createHash('sha256').update(testPass).digest('hex');
        if (hash === user.password_hash) {
          console.log(`✓ Matches password: "${testPass}"`);
          matched = true;
        }
      });

      if (!matched) {
        console.log('✗ No match found with common passwords');
        console.log(`  Hash length: ${user.password_hash.length}`);
        console.log(`  Hash type: ${user.password_hash.substring(0, 20)}...`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error checking passwords:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPasswords();
