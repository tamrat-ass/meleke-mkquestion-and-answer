import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT id, name, time_limit
      FROM question_types
      ORDER BY name ASC
    `;

    return NextResponse.json(
      {
        question_types: result.rows,
        types: result.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Question types error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question types', details: String(error) },
      { status: 500 }
    );
  }
}
