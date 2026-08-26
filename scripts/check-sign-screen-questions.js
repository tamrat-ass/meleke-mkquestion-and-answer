require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSignScreenQuestions() {
  const client = await pool.connect();
  try {
    console.log('Connected to database\n');

    // Get all sign_screen questions
    const result = await client.query(`
      SELECT 
        q.id,
        q.question_text,
        q.round_id,
        r.name as round_name,
        qt.name as question_type,
        q.is_deleted,
        q.created_at
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      LEFT JOIN rounds r ON q.round_id = r.id
      WHERE qt.name = 'sign_screen'
      ORDER BY q.created_at DESC
    `);

    console.log('✓ Sign Screen Questions Found:', result.rows.length);
    console.log('');

    if (result.rows.length > 0) {
      result.rows.forEach((q, idx) => {
        console.log(`${idx + 1}. "${q.question_text}"`);
        console.log(`   Round: ${q.round_name} (ID: ${q.round_id})`);
        console.log(`   Type: ${q.question_type}`);
        console.log(`   Deleted: ${q.is_deleted}`);
        console.log(`   Created: ${new Date(q.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('No sign_screen questions found in database');
    }

    // Also show all question counts by type
    console.log('\n--- Question Count by Type ---');
    const countResult = await client.query(`
      SELECT 
        qt.name as type,
        COUNT(q.id) as count
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE q.is_deleted = false
      GROUP BY qt.name
      ORDER BY qt.name
    `);

    countResult.rows.forEach((row) => {
      console.log(`${row.type}: ${row.count}`);
    });

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSignScreenQuestions();
