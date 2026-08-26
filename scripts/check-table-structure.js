const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4840@localhost:5432/qua_mk_db',
});

async function checkStructure() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions'
      ORDER BY ordinal_position
    `);

    console.log('Questions table structure:\n');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    // Get one sample question
    console.log('\nSample question:\n');
    const sampleRes = await client.query('SELECT * FROM questions LIMIT 1');
    if (sampleRes.rows.length > 0) {
      const q = sampleRes.rows[0];
      console.log(JSON.stringify(q, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

checkStructure();
