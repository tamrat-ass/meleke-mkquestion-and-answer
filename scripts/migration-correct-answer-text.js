const { sql } = require('@/lib/db');

async function migrateCorrectAnswerField() {
  try {
    console.log('Starting migration: VARCHAR(255) to TEXT for correct_answer field...');

    // Check database type and run appropriate migration
    const dbType = process.env.DATABASE_TYPE || 'postgres';

    if (dbType === 'postgres') {
      console.log('Running PostgreSQL migration...');
      await sql`ALTER TABLE questions ALTER COLUMN correct_answer TYPE TEXT`;
      await sql`ALTER TABLE question_versions ALTER COLUMN correct_answer TYPE TEXT`;
      console.log('✓ PostgreSQL migration completed');
    } else if (dbType === 'mysql') {
      console.log('Running MySQL migration...');
      await sql`ALTER TABLE questions MODIFY correct_answer TEXT`;
      await sql`ALTER TABLE question_versions MODIFY correct_answer TEXT`;
      console.log('✓ MySQL migration completed');
    } else if (dbType === 'mssql') {
      console.log('Running MSSQL migration...');
      await sql`ALTER TABLE questions ALTER COLUMN correct_answer TEXT`;
      await sql`ALTER TABLE question_versions ALTER COLUMN correct_answer TEXT`;
      console.log('✓ MSSQL migration completed');
    }

    console.log('✅ Migration successful! correct_answer field now supports TEXT (multi-line paragraphs)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateCorrectAnswerField();
