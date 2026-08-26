#!/usr/bin/env node

/**
 * Migration runner for adding question status field
 * Run with: node scripts/run-migration.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: Add question status field...\n');

    // Add status column
    console.log('Adding status column...');
    await client.query(
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'NOT_OPENED'`
    );
    console.log('✓ Status column added\n');

    // Add opened_at column
    console.log('Adding opened_at column...');
    await client.query(
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP`
    );
    console.log('✓ opened_at column added\n');

    // Create indexes
    console.log('Creating indexes...');
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status)`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_questions_status_type ON questions(status, question_type_id)`
    );
    console.log('✓ Indexes created\n');

    console.log('✅ Migration completed successfully!');
    console.log('\nNew columns:');
    console.log('  - status: VARCHAR(20) DEFAULT "NOT_OPENED"');
    console.log('  - opened_at: TIMESTAMP');
    console.log('\nNew indexes:');
    console.log('  - idx_questions_status');
    console.log('  - idx_questions_status_type');
  } catch (error) {
    if (error.code === '42701') {
      console.log('✓ Column already exists (skipped)');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
