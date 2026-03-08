import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if any question of this type has options
    const result = await sql`
      SELECT COUNT(*) as option_count
      FROM question_options qo
      INNER JOIN questions q ON qo.question_id = q.id
      WHERE q.question_type_id = ${id} AND q.is_deleted = false
      LIMIT 1
    `;

    const hasOptions = result.rows[0]?.option_count > 0;

    return NextResponse.json(
      {
        has_options: hasOptions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check options error:', error);
    return NextResponse.json(
      { error: 'Failed to check options', details: String(error) },
      { status: 500 }
    );
  }
}
