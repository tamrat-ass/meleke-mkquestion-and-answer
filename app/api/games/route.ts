import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT g.id, g.name, g.created_at, g.is_active, g.round_id, r.name as round_name, r.round_number
      FROM games g
      LEFT JOIN rounds r ON g.round_id = r.id
      ORDER BY r.round_number ASC, g.created_at DESC
    `;
    const rows = result.rows;

    const games = (Array.isArray(rows) ? rows : []).map((row: any) => ({
      id: row.id,
      title: row.name || 'Game',
      status: row.is_active ? 'active' : 'draft',
      created_at: row.created_at,
      round_id: row.round_id,
      round_name: row.round_name,
      round_number: row.round_number,
    }));

    return NextResponse.json({ games }, { status: 200 });
  } catch (error) {
    console.error('Games list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, round_id, groups } = await request.json();

    const gameTitle = title?.trim() || 'Game';

    // Get the first admin user
    const userResult = await sql`
      SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'admin') LIMIT 1
    `;
    
    const userId = userResult.rows[0]?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'No admin user found' },
        { status: 400 }
      );
    }

    const insertResult = await sql`
      INSERT INTO games (name, created_by, round_id)
      VALUES (${gameTitle}, ${userId}, ${round_id})
      RETURNING id, name, created_at
    `;

    const inserted = insertResult.rows[0] as any;
    const gameId = inserted.id;

    // Create two teams/groups for the game
    if (Array.isArray(groups) && groups.length >= 2) {
      const group1Name = (groups[0]?.name || 'Team 1').toString();
      const group2Name = (groups[1]?.name || 'Team 2').toString();

      await sql`
        INSERT INTO game_groups (game_id, name)
        VALUES (${gameId}, ${group1Name}), (${gameId}, ${group2Name})
      `;
    }

    const game = inserted
      ? {
          id: inserted.id,
          title: inserted.name || 'Game',
          status: 'draft',
          created_at: inserted.created_at,
        }
      : null;

    return NextResponse.json(
      {
        game,
        message: 'Game created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create game error:', error);
    return NextResponse.json(
      { error: 'Failed to create game', details: String(error) },
      { status: 500 }
    );
  }
}
