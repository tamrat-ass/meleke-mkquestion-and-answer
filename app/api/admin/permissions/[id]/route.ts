import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { permissions } = await request.json();

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    console.log('Updating permissions for user:', id);

    // Update user permissions
    const updateResult = await sql`
      UPDATE users 
      SET permissions = ${JSON.stringify(permissions)}
      WHERE id::text = ${id}
      RETURNING id, email, first_name, permissions
    `;

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUser = updateResult.rows[0];
    const userPermissions = updatedUser.permissions ? JSON.parse(updatedUser.permissions) : [];

    return NextResponse.json(
      {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.first_name,
          permissions: userPermissions,
        },
        message: 'Permissions updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions', details: String(error) },
      { status: 500 }
    );
  }
}
