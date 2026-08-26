require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function clearQuestions() {
  const client = await pool.connect();
  try {
    console.log('Starting to clear questions and options...');

    // Delete all question options first (foreign key constraint)
    const optionsResult = await client.query('DELETE FROM question_options');
    console.log(`✓ Deleted ${optionsResult.rowCount} question options`);

    // Delete all questions
    const questionsResult = await client.query('DELETE FROM questions');
    console.log(`✓ Deleted ${questionsResult.rowCount} questions`);

    console.log('✓ Successfully cleared all questions and options from the database');
  } catch (error) {
    console.error('Error clearing questions:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

clearQuestions();
