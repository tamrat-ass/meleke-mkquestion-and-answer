import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Get all users and their password hashes
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
