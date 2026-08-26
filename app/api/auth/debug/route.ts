import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Check if user has sent their user data in headers
    // Frontend sends user info via Authorization header or custom header
    const authHeader = request.headers.get('x-user-id');
    
    if (authHeader) {
      // User provided their ID - fetch their full profile with role
      try {
        const userId = parseInt(authHeader);
        const userResult = await sql`
          SELECT 
            u.id,
            u.email,
            CONCAT(u.first_name, ' ', u.last_name) as full_name,
            r.name as role_name,
            u.is_active,
            u.permissions
          FROM users u
          LEFT JOIN roles r ON u.role_id = r.id
          WHERE u.id = ${userId}
        `;

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          return NextResponse.json(
            {
              user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role_name: user.role_name || 'player',
                is_active: user.is_active,
                permissions: user.permissions || []
              },
              authenticated: true
            },
            { status: 200 }
          );
        }
      } catch (err) {
        console.error('Error fetching user from header:', err);
      }
    }

    // Fallback: Return debug info for password testing
    const result = await sql`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        password_hash,
        is_active
      FROM users
      ORDER BY created_at
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'No users found in database' },
        { status: 200 }
      );
    }

    // Calculate hashes for common passwords
    const testPasswords = {
      'password123': crypto.createHash('sha256').update('password123').digest('hex'),
      'DefaultPassword123!': crypto.createHash('sha256').update('DefaultPassword123!').digest('hex'),
      'admin': crypto.createHash('sha256').update('admin').digest('hex'),
      'teacher': crypto.createHash('sha256').update('teacher').digest('hex'),
      'player': crypto.createHash('sha256').update('player').digest('hex'),
    };

    const users = result.rows.map(user => {
      // Find matching password
      let matchingPassword = 'UNKNOWN';
      Object.entries(testPasswords).forEach(([pwd, hash]) => {
        if (hash === user.password_hash) {
          matchingPassword = pwd;
        }
      });

      return {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        is_active: user.is_active,
        password_hash: user.password_hash,
        matching_password: matchingPassword,
        note: matchingPassword === 'UNKNOWN' ? 'Hash does not match any test password. Need to update.' : 'Hash matches a known password',
      };
    });

    return NextResponse.json(
      {
        total_users: users.length,
        users,
        test_hashes: testPasswords,
        instructions: 'If matching_password is UNKNOWN, the password hash in DB does not match common passwords. Update it using the SQL command in FIX-LOGIN.md',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: String(error) },
      { status: 500 }
    );
  }
}
