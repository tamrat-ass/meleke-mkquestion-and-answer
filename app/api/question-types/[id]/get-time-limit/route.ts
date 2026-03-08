import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get average time limit and minimum time frame for all questions of this type
    const result = await sql`
      SELECT 
        COALESCE(AVG(time_limit), 30) as average_time_limit,
        COALESCE(AVG(minimum_time_frame), 5) as average_minimum_time_frame,
        COUNT(*) as question_count
      FROM questions
      WHERE question_type_id = ${id} AND is_deleted = false
    `;

    // Get marks from question_types table
    const marksResult = await sql`
      SELECT marks
      FROM question_types
      WHERE id = ${id}
    `;

    const data = result.rows[0];
    const marks = marksResult.rows[0]?.marks || 4;

    return NextResponse.json(
      {
        average_time_limit: Math.round(data.average_time_limit),
        average_minimum_time_frame: Math.round(data.average_minimum_time_frame),
        question_count: data.question_count,
        marks: marks,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get question time limit error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question time limit', details: String(error) },
      { status: 500 }
    );
  }
}
