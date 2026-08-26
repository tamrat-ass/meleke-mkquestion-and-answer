#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verify() {
  const client = await pool.connect();
  try {
    console.log('Verifying migration...\n');

    // Check if columns exist
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions' 
      AND (column_name = 'status' OR column_name = 'opened_at')
      ORDER BY column_name
    `);

    if (result.rows.length === 2) {
      console.log('✅ Migration verified successfully!\n');
      console.log('Columns added:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
      
      // Check sample data
      const sampleResult = await client.query(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'NOT_OPENED' THEN 1 END) as unopened 
         FROM questions`
      );
      console.log('\nSample data:');
      console.log(`  - Total questions: ${sampleResult.rows[0].total}`);
      console.log(`  - Unopened questions: ${sampleResult.rows[0].unopened}`);
    } else {
      console.log('❌ Migration verification failed!');
      console.log('Expected 2 columns, found:', result.rows.length);
      console.log('Columns:', result.rows);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();
