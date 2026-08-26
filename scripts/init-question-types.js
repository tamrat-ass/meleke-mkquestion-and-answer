const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initializeQuestionTypes() {
  const client = await pool.connect();
  try {
    console.log('Initializing question types...');

    // Check if question types exist
    const existingTypes = await client.query(
      'SELECT name FROM question_types'
    );

    const existingTypeNames = existingTypes.rows.map(row => row.name);

    // Define required question types
    const requiredTypes = [
      { name: 'choose', description: 'Multiple Choice Questions' },
      { name: 'short_answer', description: 'Short Answer Questions' }
    ];

    // Insert missing types
    for (const type of requiredTypes) {
      if (!existingTypeNames.includes(type.name)) {
        await client.query(
          'INSERT INTO question_types (name, description) VALUES ($1, $2)',
          [type.name, type.description]
        );
        console.log(`✓ Created question type: ${type.name}`);
      } else {
        console.log(`✓ Question type already exists: ${type.name}`);
      }
    }

    console.log('Question types initialization complete!');
  } catch (error) {
    console.error('Error initializing question types:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeQuestionTypes();
