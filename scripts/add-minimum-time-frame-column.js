const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addMinimumTimeFrameColumn() {
  const client = await pool.connect();
  try {
    console.log('Adding minimum_time_frame column to questions table...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'minimum_time_frame'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('Column minimum_time_frame already exists');
      return;
    }

    // Add the column
    await client.query(`
      ALTER TABLE questions
      ADD COLUMN minimum_time_frame INTEGER DEFAULT 5
    `);

    console.log('Successfully added minimum_time_frame column to questions table');
    console.log('Default minimum time frame set to 5 seconds');

  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMinimumTimeFrameColumn();
