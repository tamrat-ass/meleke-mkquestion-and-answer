/**
 * Test MySQL database connectivity (Laragon).
 * Run from project root: npm run test-db
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load .env from project root (optional)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'qua_mk_db',
};

async function testConnection() {
  console.log('Testing MySQL connection (Laragon)...');
  console.log('  Host:', dbConfig.host);
  console.log('  Port:', dbConfig.port);
  console.log('  User:', dbConfig.user);
  console.log('  Database:', dbConfig.database);
  console.log('');

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL');

    const [rows] = await connection.execute('SELECT VERSION() AS version');
    const version = rows && rows[0] && rows[0].version;
    console.log('✓ Server version:', version || 'unknown');

    const [dbRows] = await connection.execute('SELECT DATABASE() AS db');
    const db = dbRows && dbRows[0] && dbRows[0].db;
    console.log('✓ Current database:', db || 'unknown');

    console.log('\n✓ Database connectivity test passed.');
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Connection failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('  → Is MySQL running in Laragon? Try "Start All" in Laragon.');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('  → Database "' + dbConfig.database + '" does not exist. Create it in HeidiSQL.');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('  → Check MYSQL_USER and MYSQL_PASSWORD in .env');
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

testConnection();
