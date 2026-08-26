const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createRoleTemplatesTable() {
  const client = await pool.connect();
  try {
    console.log('Creating role_templates table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        permissions TEXT[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ role_templates table created successfully');

    // Insert default templates
    console.log('Inserting default role templates...');
    
    await client.query(`
      INSERT INTO role_templates (name, description, permissions) VALUES
      ('Admin', 'Full access to all features', ARRAY[
        'questions.create', 'questions.read', 'questions.update', 'questions.delete', 'questions.upload',
        'rounds.create', 'rounds.read', 'rounds.update', 'rounds.delete',
        'games.create', 'games.read', 'games.update', 'games.delete', 'games.play',
        'users.create', 'users.read', 'users.update', 'users.delete',
        'dashboard.view', 'dashboard.stats', 'dashboard.activity'
      ]),
      ('Teacher', 'Can manage questions, rounds, and games', ARRAY[
        'questions.create', 'questions.read', 'questions.update', 'questions.delete', 'questions.upload',
        'rounds.read',
        'games.create', 'games.read', 'games.update', 'games.delete',
        'dashboard.view', 'dashboard.stats', 'dashboard.activity'
      ]),
      ('Player', 'Can view and play games', ARRAY[
        'questions.read',
        'rounds.read',
        'games.read', 'games.play',
        'dashboard.view'
      ])
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('✓ Default role templates inserted successfully');
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createRoleTemplatesTable();
