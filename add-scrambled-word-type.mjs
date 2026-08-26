#!/usr/bin/env node

/**
 * Simple script to add Scrambled Word Challenge question type
 * Run with: node add-scrambled-word-type.mjs
 */

import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:4840@localhost:5432/qua_mk_db';

async function setupScrambledWord() {
  let sql;
  
  try {
    console.log('🔌 Connecting to database...');
    sql = postgres(DATABASE_URL);

    console.log('📋 Checking if scrambled_word type exists...');
    const existing = await sql`
      SELECT id, name FROM question_types WHERE name = 'scrambled_word'
    `;

    if (existing.length > 0) {
      console.log('✅ Scrambled Word Challenge type already exists!');
      console.log(`   ID: ${existing[0].id}`);
      console.log(`   Name: ${existing[0].name}\n`);
      await sql.end();
      process.exit(0);
    }

    console.log('➕ Adding Scrambled Word Challenge to question_types table...');
    const result = await sql`
      INSERT INTO question_types (name, description)
      VALUES (
        'scrambled_word',
        'Scrambled Word Challenge - Players must identify the original word from scrambled letters'
      )
      RETURNING id, name, description
    `;

    console.log('✅ Successfully added!\n');
    console.log(`   ID: ${result[0].id}`);
    console.log(`   Name: ${result[0].name}`);
    console.log(`   Description: ${result[0].description}\n`);

    console.log('🎉 Setup complete!');
    console.log('📝 Next steps:');
    console.log('   1. Refresh your browser');
    console.log('   2. Go to: http://localhost:3000/dashboard/questions/new');
    console.log('   3. Select "Scrambled Word Challenge" from Question Type dropdown\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (sql) await sql.end();
    process.exit(1);
  }
}

setupScrambledWord();
