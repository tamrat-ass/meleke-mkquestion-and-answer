import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = createHash('sha256').update(newPassword).digest('hex');

    // Update user password
    const result = await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}
      WHERE id = ${userId}
      RETURNING id, email, first_name, last_name
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    console.log(`Admin reset password for user: ${user.email}`);

    return NextResponse.json(
      {
        message: 'User password reset successfully',
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password', details: String(error) },
      { status: 500 }
    );
  }
}
