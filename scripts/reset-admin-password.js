const { Pool } = require('pg');
const { createHash } = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4840@localhost:5432/qua_mk_db',
});

async function resetPassword() {
  const client = await pool.connect();
  try {
    // Admin user ID
    const userId = 'f213691a-29cf-47b9-8611-bb869c605c39';
    // New password
    const newPassword = 'Admin@123456';
    
    // Hash the password using SHA256
    const passwordHash = createHash('sha256').update(newPassword).digest('hex');
    
    console.log('\n========== RESETTING PASSWORD ==========\n');
    console.log(`User ID: ${userId}`);
    console.log(`New Password: ${newPassword}`);
    console.log(`Password Hash: ${passwordHash}\n`);
    
    // Update the password
    const result = await client.query(
      `UPDATE users 
       SET password_hash = $1
       WHERE id = $2
       RETURNING id, email, first_name, last_name`,
      [passwordHash, userId]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    const user = result.rows[0];
    
    console.log('✅ Password reset successfully!\n');
    console.log('User Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.first_name} ${user.last_name}`);
    console.log(`\n📝 New Login Credentials:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

resetPassword();
