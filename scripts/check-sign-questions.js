const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:4840@localhost:5432/qua_mk_db',
});

async function checkSignQuestions() {
  const client = await pool.connect();
  try {
    console.log('Checking sign questions...\n');

    // Get sign type
    const typeResult = await client.query(
      'SELECT id FROM question_types WHERE name = $1',
      ['sign']
    );

    if (typeResult.rows.length === 0) {
      console.log('❌ Sign question type not found!');
      return;
    }

    const signTypeId = typeResult.rows[0].id;
    console.log(`Sign Type ID: ${signTypeId}\n`);

    // Count sign questions
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM questions WHERE question_type_id = $1',
      [signTypeId]
    );

    const count = countResult.rows[0].count;
    console.log(`📊 Total sign questions: ${count}\n`);

    if (count === 0) {
      console.log('⚠️  No sign questions found. Adding sample sign questions...\n');

      const sampleQuestions = [
        {
          title: 'Which sign represents agreement?',
          text: 'Which gesture is commonly used to indicate agreement?',
          correctAnswer: 'Thumbs Up',
          options: ['Thumbs Up', 'Wave', 'Point Down', 'Shake Head'],
        },
        {
          title: 'What does this symbol mean?',
          text: 'What is the meaning of the stop hand gesture?',
          correctAnswer: 'Stop',
          options: ['Stop', 'Go', 'Wait', 'Proceed'],
        },
        {
          title: 'Hand signal recognition',
          text: 'Recognize the hand signal shown',
          correctAnswer: 'OK',
          options: ['OK', 'Peace', 'Rock', 'Love'],
        },
      ];

      for (const q of sampleQuestions) {
        await client.query(
          `INSERT INTO questions (
            title, question_text, correct_answer, question_type_id, time_limit, marks, is_deleted
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [q.title, q.text, q.correctAnswer, signTypeId, 30, 1, false]
        );
      }

      console.log('✅ Sample sign questions added!\n');
    }

    // Show question distribution
    console.log('📈 Question Distribution by Type:\n');
    const distResult = await client.query(`
      SELECT 
        qt.name,
        COUNT(q.id) as count
      FROM question_types qt
      LEFT JOIN questions q ON qt.id = q.question_type_id
      GROUP BY qt.name
      ORDER BY count DESC
    `);

    distResult.rows.forEach((row) => {
      console.log(`  ${row.name.toUpperCase()}: ${row.count} questions`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

checkSignQuestions();
