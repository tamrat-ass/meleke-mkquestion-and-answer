import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const time_limit = parseInt(body.time_limit);
    const minimum_time_frame = parseInt(body.minimum_time_frame);
    const marks = parseInt(body.marks) || 4;

    console.log('Update time limit request:', { id, time_limit, minimum_time_frame, marks, body });

    if (!time_limit || isNaN(time_limit) || time_limit < 5 || time_limit > 300) {
      console.error('Invalid time_limit:', time_limit);
      return NextResponse.json(
        { error: 'Time limit must be between 5 and 300 seconds' },
        { status: 400 }
      );
    }

    if (!minimum_time_frame || isNaN(minimum_time_frame) || minimum_time_frame < 1 || minimum_time_frame >= time_limit) {
      console.error('Invalid minimum_time_frame:', minimum_time_frame);
      return NextResponse.json(
        { error: 'Minimum time frame must be between 1 and less than time limit' },
        { status: 400 }
      );
    }

    // Update all questions of this type with the new time limit and minimum time frame
    console.log('Executing UPDATE query with:', { time_limit, minimum_time_frame, marks, id });
    
    const result = await sql`
      UPDATE questions
      SET time_limit = ${time_limit}, minimum_time_frame = ${minimum_time_frame}
      WHERE question_type_id = ${id}
      RETURNING id
    `;

    // Update marks in question_types table
    await sql`
      UPDATE question_types
      SET marks = ${marks}
      WHERE id = ${id}
    `;

    console.log('Update result:', { updated_count: result.rows.length });

    return NextResponse.json(
      {
        message: `Updated ${result.rows.length} questions with time limit ${time_limit}s and minimum time frame ${minimum_time_frame}s, marks: ${marks}`,
        updated_count: result.rows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update question time limit error:', error);
    return NextResponse.json(
      { error: 'Failed to update question time limits', details: String(error) },
      { status: 500 }
    );
  }
}
