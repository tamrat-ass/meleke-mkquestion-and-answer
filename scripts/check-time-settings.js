require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        q.id,
        q.question_text,
        q.time_limit,
        q.minimum_time_frame,
        qt.name as question_type
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE qt.name IN ('short_answer', 'sign_screen')
      LIMIT 10
    `);
    
    console.log('Questions with time settings:');
    result.rows.forEach(row => {
      console.log(`${row.question_type}: "${row.question_text.substring(0, 40)}..." (time_limit: ${row.time_limit}s, minimum_time_frame: ${row.minimum_time_frame}s)`);
    });
    
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
