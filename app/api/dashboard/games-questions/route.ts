import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT 
        r.name as round_name,
        r.round_number,
        COUNT(DISTINCT g.id) as games_count,
        COUNT(DISTINCT q.id) as questions_count
      FROM rounds r
      LEFT JOIN games g ON r.id = g.round_id
      LEFT JOIN questions q ON r.id = q.round_id
      GROUP BY r.id, r.name, r.round_number
      ORDER BY r.round_number ASC
    `;

    const data = result.rows.map((row: any) => ({
      round: row.round_name || 'No Round',
      games: parseInt(row.games_count || '0'),
      questions: parseInt(row.questions_count || '0'),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Games and questions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games and questions data' },
      { status: 500 }
    );
  }
}
