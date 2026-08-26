const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'qua_mk_db',
  multipleStatements: true,
};

async function initializeDatabase() {
  let connection;
  try {
    console.log('Connecting to MySQL (Laragon)...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL');

    const schemaPath = path.join(__dirname, '01-init-schema-mysql.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('✗ Schema file not found: 01-init-schema-mysql.sql');
      process.exit(1);
    }

    console.log('\nCreating database schema...');
    const schemaScript = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaScript);
    console.log('✓ Schema created successfully');

    console.log('\n✓ Database initialization completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Database initialization failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Connection refused. Make sure MySQL is running in Laragon (Start All).');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
