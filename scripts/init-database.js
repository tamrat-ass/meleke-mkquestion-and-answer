require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Starting database initialization...');

    // Create roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Roles table created');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role_id UUID REFERENCES roles(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table created');

    // Create rounds table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rounds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        round_number INT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Rounds table created');

    // Create sections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Sections table created');

    // Create question_types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Question types table created');

    // Create questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id UUID REFERENCES sections(id),
        round_id UUID REFERENCES rounds(id),
        question_type_id UUID REFERENCES question_types(id),
        question_number INT,
        question_text TEXT NOT NULL,
        correct_answer VARCHAR(255),
        time_limit INT DEFAULT 30,
        marks INT DEFAULT 1,
        minimum_time_frame INT DEFAULT 5,
        created_by UUID REFERENCES users(id),
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Questions table created');

    // Create question_options table
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
        option_key VARCHAR(10) NOT NULL,
        option_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Question options table created');

    // Create games table
    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255),
        round_id UUID REFERENCES rounds(id),
        created_by UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Games table created');

    // Create game_groups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID REFERENCES games(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Game groups table created');

    // Create game_answers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID REFERENCES games(id) ON DELETE CASCADE,
        question_id UUID REFERENCES questions(id),
        group_id UUID REFERENCES game_groups(id),
        answer_text TEXT,
        is_correct BOOLEAN,
        time_taken INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Game answers table created');

    // Insert default roles if they don't exist
    await client.query(`
      INSERT INTO roles (name, description) 
      VALUES ('admin', 'Administrator'), ('user', 'Regular User')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✓ Default roles inserted');

    // Insert default question types if they don't exist
    await client.query(`
      INSERT INTO question_types (name, description) 
      VALUES 
        ('multiple_choice', 'Multiple Choice Questions'),
        ('short_answer', 'Short Answer Questions')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✓ Default question types inserted');

    // Create admin user if it doesn't exist
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@example.com']
    );

    if (adminCheck.rows.length === 0) {
      const adminRole = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        ['admin']
      );
      
      if (adminRole.rows.length > 0) {
        await client.query(
          'INSERT INTO users (email, password, role_id) VALUES ($1, $2, $3)',
          ['admin@example.com', 'admin123', adminRole.rows[0].id]
        );
        console.log('✓ Admin user created (admin@example.com / admin123)');
      }
    } else {
      console.log('✓ Admin user already exists');
    }

    console.log('\n✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
