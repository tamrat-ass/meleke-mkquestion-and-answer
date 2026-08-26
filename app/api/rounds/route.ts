import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT id, name, round_number, description, created_at
      FROM rounds
      ORDER BY round_number ASC
    `;

    return NextResponse.json(
      {
        rounds: result.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Rounds list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rounds', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Round name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check if round with same name already exists (case-insensitive)
    const existingRound = await sql`
      SELECT id FROM rounds WHERE LOWER(name) = LOWER(${trimmedName})
    `;

    if (existingRound.rows.length > 0) {
      return NextResponse.json(
        { error: 'A round with this name already exists' },
        { status: 409 }
      );
    }

    // Get user ID
    const userResult = await sql`
      SELECT u.id FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'admin' LIMIT 1
    `;
    
    const userId = userResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000';

    // Get next round number
    const maxRoundResult = await sql`
      SELECT MAX(round_number) as max_num FROM rounds
    `;
    
    const roundNumber = (maxRoundResult.rows[0]?.max_num || 0) + 1;

    const insertResult = await sql`
      INSERT INTO rounds (name, round_number, description, created_by)
      VALUES (${trimmedName}, ${roundNumber}, ${description || null}, ${userId})
      RETURNING id, name, round_number, description, created_at
    `;

    const round = insertResult.rows[0];

    return NextResponse.json(
      {
        round,
        message: 'Round created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create round error:', error);
    return NextResponse.json(
      { error: 'Failed to create round', details: String(error) },
      { status: 500 }
    );
  }
}
