const sql = require('mssql');
const os = require('os');

const domain = os.userInfo().username.split('\\')[0] || '.';

const sqlConfig = {
  server: 'localhost\\SQLEXPRESS',
  database: 'qua_mk_db',
  authentication: {
    type: 'ntlm',
    options: {
      domain: domain,
      userName: os.userInfo().username.split('\\')[1] || os.userInfo().username,
      password: ''
    }
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function testConnection() {
  try {
    console.log(`Testing Named Pipes connection with NTLM...`);
    console.log(`Domain: ${domain}`);
    console.log(`User: ${os.userInfo().username}`);
    
    const pool = await sql.connect(sqlConfig);
    console.log('✓ Connected successfully!');
    
    const result = await pool.request().query('SELECT 1 as test');
    console.log('✓ Query executed successfully!');
    console.log('Result:', result.recordset);
    
    await pool.close();
  } catch (err) {
    console.log('✗ Connection failed:');
    console.log('Error:', err.message);
  }
}

testConnection();
