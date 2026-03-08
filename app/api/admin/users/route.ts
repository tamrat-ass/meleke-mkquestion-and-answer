import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Define available permissions
export const AVAILABLE_PERMISSIONS = {
  // Question permissions
  'questions.create': 'Create Questions',
  'questions.read': 'View Questions',
  'questions.update': 'Edit Questions',
  'questions.delete': 'Delete Questions',
  'questions.upload': 'Upload Questions',
  
  // Round permissions
  'rounds.create': 'Create Rounds',
  'rounds.read': 'View Rounds',
  'rounds.update': 'Edit Rounds',
  'rounds.delete': 'Delete Rounds',
  
  // Game permissions
  'games.create': 'Create Games',
  'games.read': 'View Games',
  'games.update': 'Edit Games',
  'games.delete': 'Delete Games',
  'games.play': 'Play Games',
  
  // User permissions
  'users.create': 'Create Users',
  'users.read': 'View Users',
  'users.update': 'Edit Users',
  'users.delete': 'Delete Users',
  
  // Dashboard permissions
  'dashboard.view': 'View Dashboard',
  'dashboard.stats': 'View Statistics',
  'dashboard.activity': 'View Activity',
  
  // Configuration permissions
  'configuration.view': 'View Configuration',
  'configuration.update': 'Update Configuration',
  'configuration.manage': 'Manage Configuration',
};

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT 
        u.id,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        r.name as role_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `;

    const users = result.rows;

    return NextResponse.json(
      {
        users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, full_name, name, role_name, password } = await request.json();

    // Accept either full_name or name
    const userName = full_name || name;

    if (!email || !userName || !role_name) {
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    // Get role ID
    const roleResult = await sql`
      SELECT id FROM roles WHERE name = ${role_name}
    `;

    if (roleResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const roleId = roleResult.rows[0].id;

    // Generate a default password hash if not provided
    // In production, use bcrypt or similar
    const { createHash } = require('crypto');
    const defaultPassword = password || 'DefaultPassword123!';
    const passwordHash = createHash('sha256').update(defaultPassword).digest('hex');

    // Create user - store name as first_name, leave last_name empty
    const createResult = await sql`
      INSERT INTO users (first_name, last_name, email, role_id, is_active, password_hash)
      VALUES (${userName}, '', ${email}, ${roleId}, true, ${passwordHash})
      RETURNING id, email, first_name, last_name, created_at, is_active
    `;

    const newUser = createResult.rows[0];

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.first_name,
          role_name,
          is_active: newUser.is_active,
          created_at: newUser.created_at,
        },
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: String(error) },
      { status: 500 }
    );
  }
}
