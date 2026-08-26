const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addTimeLimitColumn() {
  const client = await pool.connect();
  try {
    console.log('Adding time_limit column to question_types table...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'question_types' AND column_name = 'time_limit'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('Column time_limit already exists');
      return;
    }

    // Add the column
    await client.query(`
      ALTER TABLE question_types
      ADD COLUMN time_limit INTEGER DEFAULT 30
    `);

    console.log('Successfully added time_limit column to question_types table');
    console.log('Default time limit set to 30 seconds');

  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addTimeLimitColumn();
