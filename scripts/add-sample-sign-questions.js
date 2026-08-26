const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4840@localhost:5432/qua_mk_db',
});

async function addSampleSignQuestions() {
  const client = await pool.connect();
  try {
    console.log('Adding sample sign questions...\n');

    // Get sign type ID
    const typeResult = await client.query(
      'SELECT id FROM question_types WHERE name = $1',
      ['sign']
    );

    if (typeResult.rows.length === 0) {
      console.log('❌ Sign question type not found!');
      return;
    }

    const signTypeId = typeResult.rows[0].id;

    // Get a default user (for created_by field if it exists)
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

    // Get Round 1 (for round_id field if it exists)
    const roundResult = await client.query('SELECT id FROM rounds LIMIT 1');
    const roundId = roundResult.rows.length > 0 ? roundResult.rows[0].id : null;

    // Sample sign questions
    const sampleQuestions = [
      {
        title: 'Which gesture shows agreement?',
        text: 'What hand gesture typically indicates agreement or approval?',
        correctAnswer: 'Thumbs Up',
      },
      {
        title: 'Stop gesture meaning',
        text: 'What does the "stop" hand gesture mean?',
        correctAnswer: 'Stop',
      },
      {
        title: 'Victory sign',
        text: 'What does the V-shaped hand gesture represent?',
        correctAnswer: 'Victory',
      },
      {
        title: 'Peace gesture',
        text: 'What is the meaning of the peace hand sign?',
        correctAnswer: 'Peace',
      },
      {
        title: 'OK hand sign',
        text: 'What does the OK hand gesture mean?',
        correctAnswer: 'OK',
      },
    ];

    let addedCount = 0;

    for (const q of sampleQuestions) {
      const id = uuidv4();
      const now = new Date().toISOString();

      const result = await client.query(
        `INSERT INTO questions (
          id, title, question_text, correct_answer, question_type_id, 
          time_limit, marks, is_deleted, created_at, updated_at ${userId ? ', created_by' : ''} ${roundId ? ', round_id' : ''}
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ${userId ? ', $11' : ''} ${roundId ? ', $12' : ''})
        RETURNING id`,
        userId && roundId
          ? [id, q.title, q.text, q.correctAnswer, signTypeId, 30, 1, false, now, now, userId, roundId]
          : userId
          ? [id, q.title, q.text, q.correctAnswer, signTypeId, 30, 1, false, now, now, userId]
          : roundId
          ? [id, q.title, q.text, q.correctAnswer, signTypeId, 30, 1, false, now, now, roundId]
          : [id, q.title, q.text, q.correctAnswer, signTypeId, 30, 1, false, now, now]
      );

      if (result.rows.length > 0) {
        addedCount++;
        console.log(`✅ Added: ${q.title}`);
      }
    }

    console.log(`\n✅ Successfully added ${addedCount} sign questions!\n`);

    // Show updated distribution
    console.log('📊 Updated Question Distribution:\n');
    const distResult = await client.query(`
      SELECT 
        qt.name,
        COUNT(q.id) as count
      FROM question_types qt
      LEFT JOIN questions q ON qt.id = q.question_type_id AND q.is_deleted = false
      GROUP BY qt.name
      ORDER BY count DESC
    `);

    let total = 0;
    distResult.rows.forEach((row) => {
      const pct = ((row.count / distResult.rows.reduce((sum, r) => sum + r.count, 0)) * 100).toFixed(1);
      console.log(`  ${row.name.toUpperCase()}: ${row.count} questions (${pct}%)`);
      total += row.count;
    });

    console.log(`\nTotal: ${total} questions`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

addSampleSignQuestions();
