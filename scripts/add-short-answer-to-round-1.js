require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addShortAnswerToRound1() {
  const client = await pool.connect();
  try {
    console.log('Connected to database\n');

    // Get Round 1 ID
    const roundResult = await client.query(`
      SELECT id FROM rounds WHERE round_number = 1 LIMIT 1
    `);

    if (roundResult.rows.length === 0) {
      console.log('Round 1 not found');
      process.exit(1);
    }

    const roundId = roundResult.rows[0].id;

    // Get short_answer question type ID
    const typeResult = await client.query(`
      SELECT id FROM question_types WHERE name = 'short_answer' LIMIT 1
    `);

    if (typeResult.rows.length === 0) {
      console.log('short_answer question type not found');
      process.exit(1);
    }

    const typeId = typeResult.rows[0].id;

    // Get default section
    let sectionId;
    const sectionResult = await client.query(`
      SELECT id FROM sections WHERE name = 'Default Section' LIMIT 1
    `);

    if (sectionResult.rows.length > 0) {
      sectionId = sectionResult.rows[0].id;
    } else {
      const adminResult = await client.query(`
        SELECT u.id FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = 'admin' LIMIT 1
      `);
      
      const userId = adminResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000';
      
      const newSection = await client.query(`
        INSERT INTO sections (name, description, created_by)
        VALUES ('Default Section', 'Default section for questions', $1)
        RETURNING id
      `, [userId]);
      
      sectionId = newSection.rows[0].id;
    }

    // Get next question number
    const maxQResult = await client.query(`
      SELECT MAX(question_number) as max_num FROM questions 
      WHERE section_id = $1 AND round_id = $2
    `, [sectionId, roundId]);

    let questionNumber = (maxQResult.rows[0]?.max_num || 0) + 1;

    // Get admin user ID
    const userResult = await client.query(`
      SELECT u.id FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'admin' LIMIT 1
    `);

    const userId = userResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000';

    // Sample short_answer questions
    const shortAnswerQuestions = [
      { text: 'What is the chemical symbol for gold?', answer: 'Au' },
      { text: 'Name the smallest prime number.', answer: '2' },
      { text: 'What is the capital of France?', answer: 'Paris' }
    ];

    // Insert short_answer questions
    for (const q of shortAnswerQuestions) {
      await client.query(`
        INSERT INTO questions (
          section_id, round_id, question_type_id, question_number,
          question_text, correct_answer, time_limit, marks, created_by,
          option_a, option_b, option_c, option_d
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, 30, 1, $7,
          '', '', '', ''
        )
      `, [sectionId, roundId, typeId, questionNumber, q.text, q.answer, userId]);

      console.log(`✓ Added: "${q.text}" (Answer: ${q.answer})`);
      questionNumber++;
    }

    console.log(`\n✓ Added ${shortAnswerQuestions.length} short_answer questions to Round 1`);

    // Show updated Round 1 questions
    const updatedResult = await client.query(`
      SELECT 
        qt.name as question_type,
        COUNT(q.id) as count
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE q.round_id = $1 AND q.is_deleted = false
      GROUP BY qt.name
      ORDER BY qt.name
    `, [roundId]);

    console.log('\n--- Updated Round 1 (All Types) ---');
    updatedResult.rows.forEach(row => {
      console.log(`${row.question_type}: ${row.count}`);
    });

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addShortAnswerToRound1();
