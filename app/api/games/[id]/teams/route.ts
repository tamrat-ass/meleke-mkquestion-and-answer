import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logActivity } from '@/lib/auth';

type TeamRow = {
  id: number;
  game_id: number;
  name: string;
  created_by: number | null;
  created_at: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gameId = Number.parseInt(id, 10);

    if (Number.isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 });
    }

    const result = await sql`
      SELECT id, game_id, name, created_by, created_at
      FROM teams
      WHERE game_id = ${gameId}
      ORDER BY created_at ASC
    `;
    const rows = result.rows;

    return NextResponse.json({ teams: rows }, { status: 200 });
  } catch (error) {
    console.error(' Fetch teams error:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gameId = Number.parseInt(id, 10);
    const { name } = await request.json();
    const authUser = request.headers.get('x-user-id');

    if (Number.isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Team name must be 100 characters or fewer' },
        { status: 400 }
      );
    }

    const createdBy = authUser ? Number.parseInt(authUser, 10) : null;

    const insertResult = await sql`
      INSERT INTO teams (game_id, name, created_by)
      VALUES (${gameId}, ${trimmedName}, ${Number.isNaN(createdBy as number) ? null : createdBy})
      RETURNING id, game_id, name, created_by, created_at
    `;

    const team = insertResult.rows[0];

    await logActivity(
      Number.isNaN(createdBy as number) ? null : createdBy,
      'TEAM_CREATED',
      'team',
      team.id,
      { game_id: gameId, name: trimmedName }
    );

    return NextResponse.json({ team, message: 'Team created successfully' }, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'A team with this name already exists for this game' },
        { status: 409 }
      );
    }

    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
