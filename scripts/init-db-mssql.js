const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const sqlConfig = {
    server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.MSSQL_DATABASE,
    authentication: {
        type: process.env.MSSQL_WINDOWS_AUTH === 'true' ? 'windows' : 'default',
        options: process.env.MSSQL_WINDOWS_AUTH === 'true' ? {} : {
            userName: process.env.MSSQL_USER,
            password: process.env.MSSQL_PASSWORD
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

async function initializeDatabase() {
    let pool;
    try {
        console.log('Connecting to SQL Server...');
        pool = await sql.connect(sqlConfig);
        console.log('✓ Connected to SQL Server');

        // Read and execute schema script
        console.log('\nCreating database schema...');
        const schemaScript = fs.readFileSync(
            path.join(__dirname, '01-init-schema-mssql.sql'),
            'utf8'
        );
        
        // Split by GO statements and execute each batch
        const batches = schemaScript.split(/\nGO\n/i).filter(batch => batch.trim());
        for (const batch of batches) {
            if (batch.trim()) {
                await pool.request().query(batch);
            }
        }
        console.log('✓ Schema created successfully');

        // Read and execute seed data script
        console.log('\nSeeding initial data...');
        const seedScript = fs.readFileSync(
            path.join(__dirname, '02-seed-data-mssql.sql'),
            'utf8'
        );
        
        const seedBatches = seedScript.split(/\nGO\n/i).filter(batch => batch.trim());
        for (const batch of seedBatches) {
            if (batch.trim()) {
                await pool.request().query(batch);
            }
        }
        console.log('✓ Seed data inserted successfully');

        console.log('\n✓ Database initialization completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('✗ Database initialization failed:', err.message);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

initializeDatabase();
