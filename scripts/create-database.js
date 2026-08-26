const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

// Replace qua_mk_db with postgres to connect to the default database
const postgresUrl = connectionString.replace('/qua_mk_db', '/postgres');

const pool = new Pool({
  connectionString: postgresUrl,
});

async function createDatabase() {
  const client = await pool.connect();
  try {
    console.log('Creating database qua_mk_db...');
    
    await client.query('CREATE DATABASE qua_mk_db');
    
    console.log('✓ Database created successfully');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✓ Database already exists');
    } else {
      console.error('Error creating database:', error);
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

createDatabase();
