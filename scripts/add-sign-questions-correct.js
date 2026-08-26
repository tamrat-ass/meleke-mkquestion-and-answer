const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4840@localhost:5432/qua_mk_db',
});

async function addSignQuestions() {
  const client = await pool.connect();
  try {
    console.log('Adding sign questions...\n');

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

    // Get a default user and section
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

    const sectionResult = await client.query('SELECT id FROM sections LIMIT 1');
    const sectionId = sectionResult.rows.length > 0 ? sectionResult.rows[0].id : null;

    // Get a round (or create default)
    let roundId = null;
    const roundResult = await client.query('SELECT id FROM rounds LIMIT 1');
    if (roundResult.rows.length > 0) {
      roundId = roundResult.rows[0].id;
    }

    console.log(`Sign Type ID: ${signTypeId}`);
    console.log(`Section ID: ${sectionId}`);
    console.log(`Round ID: ${roundId}`);
    console.log(`User ID: ${userId}\n`);

    // Sample sign questions
    const sampleQuestions = [
      {
        text: 'Which gesture shows agreement or approval?',
        answer: 'Thumbs Up',
      },
      {
        text: 'What does the "stop" hand gesture mean?',
        answer: 'Stop',
      },
      {
        text: 'What does the V-shaped hand gesture represent?',
        answer: 'Victory',
      },
      {
        text: 'What is the meaning of the peace hand sign?',
        answer: 'Peace',
      },
      {
        text: 'What does the OK hand gesture mean?',
        answer: 'OK',
      },
    ];

    let addedCount = 0;
    let questionNumber = 1;

    for (const q of sampleQuestions) {
      const id = uuidv4();
      const now = new Date().toISOString();

      const result = await client.query(
        `INSERT INTO questions (
          id, question_text, correct_answer, question_type_id, 
          question_number, time_limit, marks, is_deleted, 
          created_at, updated_at, created_by, section_id, round_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id`,
        [id, q.text, q.answer, signTypeId, questionNumber, 30, 1, false, now, now, userId, sectionId, roundId]
      );

      if (result.rows.length > 0) {
        addedCount++;
        questionNumber++;
        console.log(`✅ Added: ${q.text}`);
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
      total += parseInt(row.count);
    });

    distResult.rows.forEach((row) => {
      const pct = ((row.count / total) * 100).toFixed(1);
      console.log(`  ${row.name.toUpperCase()}: ${row.count} questions (${pct}%)`);
    });

    console.log(`\n📊 Total: ${total} questions`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    pool.end();
  }
}

addSignQuestions();
