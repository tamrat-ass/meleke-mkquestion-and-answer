require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addSignScreenType() {
  const client = await pool.connect();
  try {
    console.log('Connected to database:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));

    // Check if sign_screen already exists
    const checkResult = await client.query(
      'SELECT id FROM question_types WHERE name = $1',
      ['sign_screen']
    );

    if (checkResult.rows.length > 0) {
      console.log('✓ sign_screen question type already exists (ID:', checkResult.rows[0].id, ')');
    } else {
      // Insert sign_screen type
      const insertResult = await client.query(
        'INSERT INTO question_types (name, description, time_limit) VALUES ($1, $2, $3) RETURNING id',
        ['sign_screen', 'Sign Screen - Information display screen', 60]
      );
      console.log('✓ Added sign_screen question type (ID:', insertResult.rows[0].id, ')');
    }

    // List all question types
    const allTypes = await client.query(
      'SELECT id, name, time_limit FROM question_types ORDER BY id'
    );

    console.log('\n✓ All Question Types:');
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

addSignScreenType();
