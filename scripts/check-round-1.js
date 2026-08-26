require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkRound1() {
  const client = await pool.connect();
  try {
    console.log('Connected to database\n');

    // Get Round 1 info
    const roundResult = await client.query(`
      SELECT id, name, round_number FROM rounds WHERE round_number = 1 LIMIT 1
    `);

    if (roundResult.rows.length === 0) {
      console.log('Round 1 not found');
      await client.end();
      process.exit(0);
    }

    const round = roundResult.rows[0];
    console.log(`Round 1: ${round.name} (ID: ${round.id})\n`);

    // Get all questions in Round 1 grouped by type
    const result = await client.query(`
      SELECT 
        q.id,
        q.question_text,
        qt.name as question_type,
        q.is_deleted,
        COUNT(*) OVER (PARTITION BY qt.name) as type_count
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE q.round_id = $1 AND q.is_deleted = false
      ORDER BY qt.name, q.created_at DESC
    `, [round.id]);

    console.log(`✓ Total Questions in Round 1: ${result.rows.length}\n`);

    if (result.rows.length > 0) {
      // Group by type
      const byType = {};
      result.rows.forEach(row => {
        if (!byType[row.question_type]) {
          byType[row.question_type] = [];
        }
        byType[row.question_type].push(row);
      });

      console.log('--- Questions by Type ---\n');
      Object.keys(byType).sort().forEach((type) => {
        const questions = byType[type];
        console.log(`${type}: ${questions.length} questions`);
        questions.forEach((q, idx) => {
          console.log(`  ${idx + 1}. "${q.question_text}"`);
        });
        console.log('');
      });
    } else {
      console.log('No questions found in Round 1');
    }

    // Also show summary across all rounds
    console.log('\n--- Summary: All Rounds ---');
    const summaryResult = await client.query(`
      SELECT 
        r.round_number,
        r.name,
        qt.name as question_type,
        COUNT(q.id) as count
      FROM rounds r
      LEFT JOIN questions q ON r.id = q.round_id AND q.is_deleted = false
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE qt.name IS NOT NULL
      GROUP BY r.id, r.round_number, r.name, qt.name
      ORDER BY r.round_number, qt.name
    `);

    summaryResult.rows.forEach(row => {
      console.log(`Round ${row.round_number} (${row.name}): ${row.question_type} = ${row.count}`);
    });

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRound1();
