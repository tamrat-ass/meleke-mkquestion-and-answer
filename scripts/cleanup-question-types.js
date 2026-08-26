require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanupQuestionTypes() {
  const client = await pool.connect();
  try {
    console.log('Connected to database');

    // Delete the old "sign" type (keep sign_screen)
    const deleteResult = await client.query(
      'DELETE FROM question_types WHERE name = $1',
      ['sign']
    );

    console.log('✓ Deleted "sign" question type');

    // List all remaining question types
    const allTypes = await client.query(
      'SELECT id, name, time_limit FROM question_types ORDER BY id'
    );

    console.log('\n✓ Remaining Question Types:');
    allTypes.rows.forEach((row) => {
      console.log(`  - ${row.name} (ID: ${row.id}, Time: ${row.time_limit}s)`);
    });

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanupQuestionTypes();
