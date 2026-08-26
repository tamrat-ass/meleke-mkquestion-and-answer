const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createUserPermissionsTable() {
  const client = await pool.connect();
  try {
    console.log('Creating user_permissions table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission_key VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, permission_key)
      );
    `);

    console.log('✓ user_permissions table created successfully');

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
      ON user_permissions(user_id);
    `);

    console.log('✓ Index created successfully');
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createUserPermissionsTable();
