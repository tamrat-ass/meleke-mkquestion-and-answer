require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyDatabase() {
  const client = await pool.connect();
  try {
    console.log('Verifying database structure...\n');

    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('✓ Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check roles
    const rolesResult = await client.query('SELECT * FROM roles;');
    console.log(`\n✓ Roles (${rolesResult.rows.length}):`);
    rolesResult.rows.forEach(row => {
      console.log(`  - ${row.name}`);
    });

    // Check users
    const usersResult = await client.query('SELECT email, role_id FROM users;');
    console.log(`\n✓ Users (${usersResult.rows.length}):`);
    usersResult.rows.forEach(row => {
      console.log(`  - ${row.email}`);
    });

    // Check question types
    const typesResult = await client.query('SELECT * FROM question_types;');
    console.log(`\n✓ Question Types (${typesResult.rows.length}):`);
    typesResult.rows.forEach(row => {
      console.log(`  - ${row.name}`);
    });

    // Check questions count
    const questionsResult = await client.query('SELECT COUNT(*) as count FROM questions;');
    console.log(`\n✓ Questions: ${questionsResult.rows[0].count}`);

    // Check question options count
    const optionsResult = await client.query('SELECT COUNT(*) as count FROM question_options;');
    console.log(`✓ Question Options: ${optionsResult.rows[0].count}`);

    // Check rounds count
    const roundsResult = await client.query('SELECT COUNT(*) as count FROM rounds;');
    console.log(`✓ Rounds: ${roundsResult.rows[0].count}`);

    // Check games count
    const gamesResult = await client.query('SELECT COUNT(*) as count FROM games;');
    console.log(`✓ Games: ${gamesResult.rows[0].count}`);

    console.log('\n✅ Database verification completed successfully!');
  } catch (error) {
    console.error('❌ Database verification error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
