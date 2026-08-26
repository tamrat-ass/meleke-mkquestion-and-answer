const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: rename "choose" to "multiple_choice"...');

    // Check if 'choose' exists
    const checkResult = await client.query(
      'SELECT id FROM question_types WHERE name = $1',
      ['choose']
    );

    if (checkResult.rows.length === 0) {
      console.log('No "choose" question type found. Migration not needed.');
      return;
    }

    const chooseId = checkResult.rows[0].id;

    // Check if 'multiple_choice' already exists
    const multipleChoiceResult = await client.query(
      'SELECT id FROM question_types WHERE name = $1',
      ['multiple_choice']
    );

    if (multipleChoiceResult.rows.length > 0) {
      // If multiple_choice exists, update all questions with choose to use multiple_choice
      const multipleChoiceId = multipleChoiceResult.rows[0].id;
      await client.query(
        'UPDATE questions SET question_type_id = $1 WHERE question_type_id = $2',
        [multipleChoiceId, chooseId]
      );
      console.log('Updated questions to use existing "multiple_choice" type');

      // Delete the old 'choose' type
      await client.query(
        'DELETE FROM question_types WHERE id = $1',
        [chooseId]
      );
      console.log('Deleted old "choose" question type');
    } else {
      // If multiple_choice doesn't exist, rename choose to multiple_choice
      await client.query(
        'UPDATE question_types SET name = $1 WHERE id = $2',
        ['multiple_choice', chooseId]
      );
      console.log('Renamed "choose" to "multiple_choice"');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
