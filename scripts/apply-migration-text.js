#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    console.log('Starting migration: Changing correct_answer field from VARCHAR(255) to TEXT...\n');

    // Check current column type
    console.log('Checking current column definitions...');
    const checkQuestions = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'questions' AND column_name = 'correct_answer'
    `);
    
    if (checkQuestions.rows.length > 0) {
      const col = checkQuestions.rows[0];
      console.log(`Current questions.correct_answer: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    }

    // Migrate questions table
    console.log('\n1. Migrating questions table...');
    await client.query(`
      ALTER TABLE questions ALTER COLUMN correct_answer TYPE TEXT;
    `);
    console.log('   ✓ questions table migrated');

    // Migrate question_versions table
    console.log('2. Migrating question_versions table...');
    await client.query(`
      ALTER TABLE question_versions ALTER COLUMN correct_answer TYPE TEXT;
    `);
    console.log('   ✓ question_versions table migrated');

    // Verify migration
    console.log('\nVerifying migration...');
    const verifyQuestions = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'questions' AND column_name = 'correct_answer'
    `);
    
    const verifyVersions = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'question_versions' AND column_name = 'correct_answer'
    `);

    if (verifyQuestions.rows.length > 0) {
      console.log(`✓ questions.correct_answer is now: ${verifyQuestions.rows[0].data_type}`);
    }
    if (verifyVersions.rows.length > 0) {
      console.log(`✓ question_versions.correct_answer is now: ${verifyVersions.rows[0].data_type}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('Short answer questions now support multi-line paragraph answers.');
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error details:', error);
    
    try {
      await client.end();
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
    }
    process.exit(1);
  }
}

applyMigration();
