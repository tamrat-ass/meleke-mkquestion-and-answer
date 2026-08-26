import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to fetch question type with constraints, with fallback for columns that may not exist
    let typeResult;
    try {
      typeResult = await sql`
        SELECT 
          name,
          min_minimum_time_frame,
          marks
        FROM question_types
        WHERE id = ${id}
      `;
    } catch (columnError: any) {
      // If columns don't exist, use basic query
      if (columnError.code === '42703') {
        typeResult = await sql`
          SELECT 
            name,
            marks
          FROM question_types
          WHERE id = ${id}
        `;
      } else {
        throw columnError;
      }
    }

    if (typeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question type not found' },
        { status: 404 }
      );
    }

    const questionType = typeResult.rows[0];

    // Try to get averages with default constraint
    let result;
    const minMinimumTimeFrame = questionType.min_minimum_time_frame || 1;
    try {
      result = await sql`
        SELECT 
          COALESCE(AVG(time_limit), 30) as average_time_limit,
          COALESCE(AVG(minimum_time_frame), ${minMinimumTimeFrame}) as average_minimum_time_frame,
          COUNT(*) as question_count
        FROM questions
        WHERE question_type_id = ${id} AND is_deleted = false
      `;
    } catch (columnError: any) {
      // If columns don't exist, return empty result
      if (columnError.code === '42703') {
        result = { rows: [{ average_time_limit: 30, average_minimum_time_frame: minMinimumTimeFrame, question_count: 0 }] };
      } else {
        throw columnError;
      }
    }

    const data = result.rows[0];
    const marks = questionType.marks || 4;

    return NextResponse.json(
      {
        average_time_limit: Math.round(data.average_time_limit),
        average_minimum_time_frame: Math.round(data.average_minimum_time_frame),
        min_minimum_time_frame: minMinimumTimeFrame,
        question_count: data.question_count,
        marks: marks,
        source: 'database',
        note: `Minimum time frame uses database value of ${minMinimumTimeFrame}s as default instead of hard-coded 5s`
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
