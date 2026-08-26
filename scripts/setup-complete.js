const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupComplete() {
  const client = await pool.connect();
  try {
    console.log('Starting complete setup...\n');

    // 1. Create permissions table if not exists
    console.log('1. Creating permissions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✓ Permissions table ready\n');

    // 2. Seed all permissions
    console.log('2. Seeding permissions...');
    const permissions = [
      { name: 'questions.create', description: 'Create Questions' },
      { name: 'questions.read', description: 'View Questions' },
      { name: 'questions.update', description: 'Edit Questions' },
      { name: 'questions.delete', description: 'Delete Questions' },
      { name: 'questions.upload', description: 'Upload Questions' },
      { name: 'rounds.create', description: 'Create Rounds' },
      { name: 'rounds.read', description: 'View Rounds' },
      { name: 'rounds.update', description: 'Edit Rounds' },
      { name: 'rounds.delete', description: 'Delete Rounds' },
      { name: 'games.create', description: 'Create Games' },
      { name: 'games.read', description: 'View Games' },
      { name: 'games.update', description: 'Edit Games' },
      { name: 'games.delete', description: 'Delete Games' },
      { name: 'games.play', description: 'Play Games' },
      { name: 'users.create', description: 'Create Users' },
      { name: 'users.read', description: 'View Users' },
      { name: 'users.update', description: 'Edit Users' },
      { name: 'users.delete', description: 'Delete Users' },
      { name: 'dashboard.view', description: 'View Dashboard' },
      { name: 'dashboard.stats', description: 'View Statistics' },
      { name: 'dashboard.activity', description: 'View Activity' },
      { name: 'configuration.view', description: 'View Configuration' },
      { name: 'configuration.update', description: 'Update Configuration' },
      { name: 'configuration.manage', description: 'Manage Configuration' },
    ];

    let insertedCount = 0;
    for (const perm of permissions) {
      const result = await client.query(
        'INSERT INTO permissions (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING RETURNING id',
        [perm.name, perm.description]
      );
      if (result.rows.length > 0) {
        insertedCount++;
      }
    }
    console.log(`   ✓ Seeded ${insertedCount} new permissions\n`);

    // 3. Assign permissions to existing users
    console.log('3. Assigning permissions to existing users...');
    
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

    const roles = ['admin', 'teacher', 'player'];
    let totalAssigned = 0;

    for (const roleName of roles) {
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
      if (!roleResult.rows[0]) {
        console.log(`   ⚠ Role not found: ${roleName}`);
        continue;
      }

      const roleId = roleResult.rows[0].id;
      const users = await client.query('SELECT id FROM users WHERE role_id = $1', [roleId]);
      
      for (const user of users.rows) {
        // Clear existing permissions
        await client.query('DELETE FROM user_permissions WHERE user_id = $1', [user.id]);
        
        // Assign new permissions
        for (const permName of rolePermissions[roleName]) {
          const permResult = await client.query('SELECT id FROM permissions WHERE name = $1', [permName]);
          
          if (permResult.rows[0]) {
            const result = await client.query(
              'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
              [user.id, permResult.rows[0].id]
            );
            if (result.rows.length > 0) {
              totalAssigned++;
            }
          }
        }
      }
      console.log(`   ✓ Assigned permissions to ${users.rows.length} ${roleName} users`);
    }

    console.log(`   ✓ Total permissions assigned: ${totalAssigned}\n`);
    console.log('✅ Setup complete! All permissions are now configured.');
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupComplete();
