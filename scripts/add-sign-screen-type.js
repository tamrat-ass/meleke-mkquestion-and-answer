const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4840@localhost:5432/qua_mk_db',
});

async function addSignScreenType() {
  const client = await pool.connect();
  try {
    console.log('Adding Sign Screen question type...\n');

    // Check if sign_screen type exists
    const checkResult = await client.query(
      'SELECT * FROM question_types WHERE name = $1',
      ['sign_screen']
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Sign Screen question type already exists');
      console.log(checkResult.rows[0]);
      return;
    }

    // Add sign_screen type
    const insertResult = await client.query(
      `INSERT INTO question_types (name, description, time_limit) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      ['sign_screen', 'Information display screen with timer - no user input', 60]
    );

    console.log('✅ Sign Screen question type created successfully!');
    console.log(insertResult.rows[0]);

    // List all question types
    console.log('\n📋 All question types:\n');
    const allTypes = await client.query('SELECT * FROM question_types ORDER BY name');
    allTypes.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.name} (ID: ${row.id})`);
      console.log(`     Time Limit: ${row.time_limit}s`);
      console.log(`     Description: ${row.description}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

addSignScreenType();
