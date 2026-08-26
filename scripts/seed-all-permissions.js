const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedAllPermissions() {
  const client = await pool.connect();
  try {
    console.log('Seeding all permissions...');

    // Define all permissions
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
      
      // Configuration permissions
      { name: 'configuration.view', description: 'View Configuration' },
      { name: 'configuration.update', description: 'Update Configuration' },
      { name: 'configuration.manage', description: 'Manage Configuration' },
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
    console.log('✓ All permissions seeded successfully!');
  } catch (error) {
    console.error('Error seeding permissions:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAllPermissions();
