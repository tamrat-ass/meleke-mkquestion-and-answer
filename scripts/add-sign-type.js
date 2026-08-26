const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4840@localhost:5432/qua_mk_db',
});

async function addSignType() {
  const client = await pool.connect();
  try {
    console.log('Checking for sign question type...\n');

    // Check if sign type exists
    const checkResult = await client.query(
      'SELECT * FROM question_types WHERE name = $1',
      ['sign']
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Sign question type already exists');
      console.log(checkResult.rows[0]);
      return;
    }

    // Add sign type if it doesn't exist
    console.log('Adding sign question type...');
    const insertResult = await client.query(
      'INSERT INTO question_types (name, time_limit) VALUES ($1, $2) RETURNING *',
      ['sign', 60]
    );

    console.log('✅ Sign question type added successfully!');
    console.log(insertResult.rows[0]);

    // List all question types
    console.log('\n📋 All question types in database:\n');
    const allTypes = await client.query('SELECT * FROM question_types ORDER BY name');
    allTypes.rows.forEach((row) => {
      console.log(`  - ${row.name} (ID: ${row.id}, Time Limit: ${row.time_limit}s)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

addSignType();
