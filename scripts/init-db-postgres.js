const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing PostgreSQL database...');

    // Drop existing tables
    const dropPath = path.join(__dirname, '00-drop-tables-postgres.sql');
    const dropSQL = fs.readFileSync(dropPath, 'utf8');
    
    await client.query(dropSQL);
    console.log('✓ Existing tables dropped');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '01-init-schema-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('✓ Schema created successfully');

    // Read and execute seed data
    const seedPath = path.join(__dirname, '02-seed-data-postgres.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');
    
    await client.query(seedData);
    console.log('✓ Seed data inserted successfully');

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
