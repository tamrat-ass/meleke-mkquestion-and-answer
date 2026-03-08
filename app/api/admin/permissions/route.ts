import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all users with their permissions
    const result = await sql`
      SELECT 
        u.id,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        r.name as role_name,
        u.is_active,
        u.permissions,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `;

    const users = result.rows.map(user => ({
      ...user,
      permissions: user.permissions ? JSON.parse(user.permissions) : []
    }));

    return NextResponse.json(
      {
        users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Permissions list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
