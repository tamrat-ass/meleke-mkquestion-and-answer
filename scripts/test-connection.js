const sql = require('mssql');

const configs = [
  {
    name: 'Windows Auth (Named Pipe)',
    config: {
      server: 'localhost\\SQLEXPRESS',
      database: 'qua_mk_db',
      authentication: { type: 'windows' },
      options: { encrypt: false, trustServerCertificate: true }
    }
  },
  {
    name: 'SA Auth (Port 1433)',
    config: {
      server: 'localhost',
      port: 1433,
      database: 'qua_mk_db',
      authentication: {
        type: 'default',
        options: { userName: 'sa', password: 'YourPassword123' }
      },
      options: { encrypt: false, trustServerCertificate: true }
    }
  },
  {
    name: 'SA Auth (Named Instance)',
    config: {
      server: 'localhost\\SQLEXPRESS',
      database: 'qua_mk_db',
      authentication: {
        type: 'default',
        options: { userName: 'sa', password: 'YourPassword123' }
      },
      options: { encrypt: false, trustServerCertificate: true, instanceName: 'SQLEXPRESS' }
    }
  }
];

async function testConnection(name, config) {
  try {
    console.log(`\nTesting: ${name}...`);
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT 1 as test');
    console.log(`✓ SUCCESS: ${name}`);
    await pool.close();
    return true;
  } catch (err) {
    console.log(`✗ FAILED: ${name}`);
    console.log(`  Error: ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Testing SQL Server connections...');
  
  for (const { name, config } of configs) {
    await testConnection(name, config);
  }
  
  console.log('\nDone!');
}

runTests();
