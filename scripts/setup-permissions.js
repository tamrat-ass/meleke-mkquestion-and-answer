const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupPermissions() {
  const client = await pool.connect();
  try {
    console.log('Setting up permissions system...\n');

    // 1. Create user_permissions table if it doesn't exist
    console.log('1. Creating user_permissions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission_key VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, permission_key)
      );
    `);
    console.log('   ✓ user_permissions table ready\n');

    // 2. Create index
    console.log('2. Creating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
      ON user_permissions(user_id);
    `);
    console.log('   ✓ Index created\n');

    // 3. Get all users
    console.log('3. Fetching users...');
    const usersResult = await client.query('SELECT id, email, role_name FROM users');
    const users = usersResult.rows;
    console.log(`   ✓ Found ${users.length} users\n`);

    // 4. Define default permissions by role
    const rolePermissions = {
      admin: [
        'questions.create', 'questions.read', 'questions.update', 'questions.delete', 'questions.upload',
        'rounds.create', 'rounds.read', 'rounds.update', 'rounds.delete',
        'games.create', 'games.read', 'games.update', 'games.delete', 'games.play',
        'users.create', 'users.read', 'users.update', 'users.delete',
        'dashboard.view', 'dashboard.stats', 'dashboard.activity',
        'configuration.view', 'configuration.update', 'configuration.manage',
      ],
      teacher: [
        'questions.create', 'questions.read', 'questions.update', 'questions.delete', 'questions.upload',
        'rounds.read',
        'games.create', 'games.read', 'games.update', 'games.delete',
        'dashboard.view', 'dashboard.stats', 'dashboard.activity',
        'configuration.view',
      ],
      player: [
        'questions.read',
        'rounds.read',
        'games.read', 'games.play',
        'dashboard.view',
      ],
    };

    // 5. Assign permissions to users
    console.log('4. Assigning permissions to users...');
    for (const user of users) {
      const permissions = rolePermissions[user.role_name] || [];
      
      // Delete existing permissions
      await client.query(
        'DELETE FROM user_permissions WHERE user_id = $1',
        [user.id]
      );

      // Insert new permissions
      for (const permission of permissions) {
        await client.query(
          'INSERT INTO user_permissions (user_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user.id, permission]
        );
      }

      console.log(`   ✓ ${user.email} (${user.role_name}): ${permissions.length} permissions`);
    }

    console.log('\n✓ Permissions setup complete!');
    console.log('\nPermissions assigned:');
    console.log('  - Admin: 24 permissions (all)');
    console.log('  - Teacher: 14 permissions');
    console.log('  - Player: 5 permissions');

  } catch (error) {
    console.error('Error setting up permissions:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupPermissions();
