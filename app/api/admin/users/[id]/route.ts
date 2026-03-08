import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { full_name, name, email, role_name, is_active } = await request.json();

    // Accept either full_name or name
    const userName = full_name || name;

    if (!userName || !email || !role_name) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    console.log('Updating user with ID:', id);

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

    // Update user - store name as first_name, leave last_name empty
    const updateResult = await sql`
      UPDATE users 
      SET first_name = ${userName}, 
          last_name = '',
          email = ${email}, 
          role_id = ${roleId},
          is_active = ${is_active !== undefined ? is_active : true}
      WHERE id::text = ${id}
      RETURNING id, email, first_name, last_name, created_at, is_active
    `;

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUser = updateResult.rows[0];

    return NextResponse.json(
      {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.first_name,
          role_name,
          is_active: updatedUser.is_active,
          created_at: updatedUser.created_at,
        },
        message: 'User updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    console.log('Deleting user with ID:', id);

    // First check if user exists
    const checkResult = await sql`
      SELECT id FROM users WHERE id = ${id} OR id::text = ${id}
    `;

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const deleteResult = await sql`
      DELETE FROM users WHERE id = ${id} OR id::text = ${id}
      RETURNING id
    `;

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: String(error) },
      { status: 500 }
    );
  }
}
