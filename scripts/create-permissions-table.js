const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedPermissions() {
  const client = await pool.connect();
  try {
    console.log('Seeding permissions...');

    // Define permissions - using 'name' and 'description' columns as per actual schema
    const permissions = [
      // Question permissions
      { name: 'questions.create', description: 'Create Questions' },
      { name: 'questions.read', description: 'View Questions' },
      { name: 'questions.update', description: 'Edit Questions' },
      { name: 'questions.delete', description: 'Delete Questions' },
      { name: 'questions.upload', description: 'Upload Questions' },
      
      // Round permissions
      { name: 'rounds.create', description: 'Create Rounds' },
      { name: 'rounds.read', description: 'View Rounds' },
      { name: 'rounds.update', description: 'Edit Rounds' },
      { name: 'rounds.delete', description: 'Delete Rounds' },
      
      // Game permissions
      { name: 'games.create', description: 'Create Games' },
      { name: 'games.read', description: 'View Games' },
      { name: 'games.update', description: 'Edit Games' },
      { name: 'games.delete', description: 'Delete Games' },
      { name: 'games.play', description: 'Play Games' },
      
      // User permissions
      { name: 'users.create', description: 'Create Users' },
      { name: 'users.read', description: 'View Users' },
      { name: 'users.update', description: 'Edit Users' },
      { name: 'users.delete', description: 'Delete Users' },
      
      // Dashboard permissions
      { name: 'dashboard.view', description: 'View Dashboard' },
      { name: 'dashboard.stats', description: 'View Statistics' },
      { name: 'dashboard.activity', description: 'View Activity' },
    ];

    // Insert permissions (skip if already exist)
    let insertedCount = 0;
    for (const perm of permissions) {
      const result = await client.query(
        'INSERT INTO permissions (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING RETURNING id',
        [perm.name, perm.description]
      );
      if (result.rows.length > 0) {
        insertedCount++;
        console.log(`  ✓ Created permission: ${perm.name}`);
      }
    }
    console.log(`✓ Inserted ${insertedCount} new permissions`);

    // Get role IDs
    const adminRoleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    const teacherRoleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['teacher']);
    const playerRoleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['player']);

    if (!adminRoleResult.rows[0] || !teacherRoleResult.rows[0] || !playerRoleResult.rows[0]) {
      console.error('Roles not found');
      return;
    }

    // Define role permissions
    const rolePermissions = {
      admin: [
        'questions.create', 'questions.read', 'questions.update', 'questions.delete', 'questions.upload',
        'rounds.create', 'rounds.read', 'rounds.update', 'rounds.delete',
        'games.create', 'games.read', 'games.update', 'games.delete', 'games.play',
        'users.create', 'users.read', 'users.update', 'users.delete',
        'dashboard.view', 'dashboard.stats', 'dashboard.activity',
      ],
      teacher: [
        'questions.create', 'questions.read', 'questions.update', 'questions.delete', 'questions.upload',
        'rounds.read',
        'games.create', 'games.read', 'games.update', 'games.delete',
        'dashboard.view', 'dashboard.stats', 'dashboard.activity',
      ],
      player: [
        'questions.read',
        'rounds.read',
        'games.read', 'games.play',
        'dashboard.view',
      ],
    };

    // Assign permissions to users
    const roles = [
      { name: 'admin', roleId: adminRoleResult.rows[0].id },
      { name: 'teacher', roleId: teacherRoleResult.rows[0].id },
      { name: 'player', roleId: playerRoleResult.rows[0].id },
    ];

    let assignedCount = 0;
    for (const role of roles) {
      const users = await client.query('SELECT id FROM users WHERE role_id = $1', [role.roleId]);
      
      for (const user of users.rows) {
        for (const permName of rolePermissions[role.name]) {
          const permResult = await client.query('SELECT id FROM permissions WHERE name = $1', [permName]);
          
          if (permResult.rows[0]) {
            const result = await client.query(
              'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
              [user.id, permResult.rows[0].id]
            );
            if (result.rows.length > 0) {
              assignedCount++;
            }
          }
        }
      }
    }

    console.log(`✓ Assigned ${assignedCount} new user permissions`);
    console.log('✓ Permissions seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding permissions:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

seedPermissions();
