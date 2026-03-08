import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete game groups first (cascade)
    await sql`DELETE FROM game_groups WHERE game_id = ${id}`;

    // Delete the game
    const result = await sql`DELETE FROM games WHERE id = ${id} RETURNING id`;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Game deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete game error:', error);
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const gameResult = await sql`
      SELECT g.id, g.name, g.created_at, g.is_active, g.round_id, r.name as round_name
      FROM games g
      LEFT JOIN rounds r ON g.round_id = r.id
      WHERE g.id = ${id}
    `;

    if (gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const game = gameResult.rows[0];

    const groupsResult = await sql`
      SELECT id, name FROM game_groups WHERE game_id = ${id}
    `;

    return NextResponse.json(
      {
        game: {
          id: game.id,
          title: game.name,
          status: game.is_active ? 'active' : 'draft',
          created_at: game.created_at,
          round_id: game.round_id,
          round_name: game.round_name,
        },
        groups: groupsResult.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get game error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title, round_id, groups, status } = await request.json();

    let updateResult;

    // Handle different update scenarios
    if (status !== undefined && title === undefined && round_id === undefined) {
      // Only updating status
      updateResult = await sql`
        UPDATE games 
        SET is_active = ${status === 'active'}
        WHERE id = ${id}
        RETURNING id, name, created_at, is_active
      `;
    } else if (title !== undefined && round_id !== undefined) {
      // Updating title and round_id
      updateResult = await sql`
        UPDATE games 
        SET name = ${title || 'Game'}, round_id = ${round_id}
        WHERE id = ${id}
        RETURNING id, name, created_at, is_active
      `;
    } else if (title !== undefined) {
      // Only updating title
      updateResult = await sql`
        UPDATE games 
        SET name = ${title || 'Game'}
        WHERE id = ${id}
        RETURNING id, name, created_at, is_active
      `;
    } else if (round_id !== undefined) {
      // Only updating round_id
      updateResult = await sql`
        UPDATE games 
        SET round_id = ${round_id}
        WHERE id = ${id}
        RETURNING id, name, created_at, is_active
      `;
    } else {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Update groups if provided
    if (Array.isArray(groups) && groups.length > 0) {
      // Delete existing groups
      await sql`DELETE FROM game_groups WHERE game_id = ${id}`;

      // Insert new groups
      for (const group of groups) {
        await sql`
          INSERT INTO game_groups (game_id, name)
          VALUES (${id}, ${group.name})
        `;
      }
    }

    const updated = updateResult.rows[0];

    return NextResponse.json(
      {
        game: {
          id: updated.id,
          title: updated.name,
          status: updated.is_active ? 'active' : 'draft',
          created_at: updated.created_at,
        },
        message: 'Game updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update game error:', error);
    return NextResponse.json(
      { error: 'Failed to update game', details: String(error) },
      { status: 500 }
    );
  }
}
