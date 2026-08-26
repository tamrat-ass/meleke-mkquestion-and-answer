require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateSignQuestions() {
  const client = await pool.connect();
  try {
    console.log('Connected to database');

    // Get the IDs of both question types
    const typesResult = await client.query(
      'SELECT id, name FROM question_types WHERE name IN ($1, $2)',
      ['sign', 'sign_screen']
    );

    const signId = typesResult.rows.find(t => t.name === 'sign')?.id;
    const signScreenId = typesResult.rows.find(t => t.name === 'sign_screen')?.id;

    console.log('sign ID:', signId);
    console.log('sign_screen ID:', signScreenId);

    // Move any questions from "sign" to "sign_screen"
    const updateResult = await client.query(
      'UPDATE questions SET question_type_id = $1 WHERE question_type_id = $2',
      [signScreenId, signId]
    );

    console.log('✓ Migrated', updateResult.rowCount, 'questions from "sign" to "sign_screen"');

    // Now delete the old "sign" type
    const deleteResult = await client.query(
      'DELETE FROM question_types WHERE name = $1',
      ['sign']
    );

    console.log('✓ Deleted "sign" question type');

    // List all remaining question types
    const allTypes = await client.query(
      'SELECT id, name, time_limit FROM question_types ORDER BY name'
    );

    console.log('\n✓ Remaining Question Types:');
    allTypes.rows.forEach((row) => {
      console.log(`  - ${row.name} (Time: ${row.time_limit}s)`);
    });

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

migrateSignQuestions();
