require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateOptionsToQuestions() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: Moving options to questions table...');

    // Step 1: Add columns to questions table if they don't exist
    console.log('Adding option columns to questions table...');
    await client.query(`
      ALTER TABLE questions
      ADD COLUMN IF NOT EXISTS option_a VARCHAR(500),
      ADD COLUMN IF NOT EXISTS option_b VARCHAR(500),
      ADD COLUMN IF NOT EXISTS option_c VARCHAR(500),
      ADD COLUMN IF NOT EXISTS option_d VARCHAR(500);
    `);
    console.log('✓ Columns added');

    // Step 2: Migrate existing data from question_options to questions
    console.log('Migrating existing options data...');
    
    // Get all questions with their options
    const questionsResult = await client.query(`
      SELECT DISTINCT q.id
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.question_type_id = (SELECT id FROM question_types WHERE name = 'multiple_choice' LIMIT 1)
    `);

    let migratedCount = 0;
    for (const row of questionsResult.rows) {
      const questionId = row.id;
      
      // Get options for this question
      const optionsResult = await client.query(`
        SELECT option_key, option_value
        FROM question_options
        WHERE question_id = $1
        ORDER BY option_key ASC
      `, [questionId]);

      // Build update query
      const optionMap = {};
      optionsResult.rows.forEach((opt) => {
        optionMap[opt.option_key.toLowerCase()] = opt.option_value;
      });

      // Update questions table with options
      await client.query(`
        UPDATE questions
        SET 
          option_a = $1,
          option_b = $2,
          option_c = $3,
          option_d = $4
        WHERE id = $5
      `, [
        optionMap['a'] || '',
        optionMap['b'] || '',
        optionMap['c'] || '',
        optionMap['d'] || '',
        questionId
      ]);

      migratedCount++;
    }

    console.log(`✓ Migrated ${migratedCount} questions with options`);

    // Step 3: Verify migration
    const verifyResult = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN option_a IS NOT NULL AND option_a != '' THEN 1 END) as with_options
      FROM questions
      WHERE question_type_id = (SELECT id FROM question_types WHERE name = 'multiple_choice' LIMIT 1)
    `);

    console.log(`✓ Verification: ${verifyResult.rows[0].with_options} out of ${verifyResult.rows[0].total} multiple choice questions have options`);
    console.log('✓ Migration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateOptionsToQuestions();
