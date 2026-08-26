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

    console.log('Update time limit request:', { id, time_limit, minimum_time_frame, body });

    // Try to fetch question type with constraints, with fallback for columns that may not exist
    let questionTypeResult;
    try {
      questionTypeResult = await sql`
        SELECT 
          id, 
          name, 
          min_time_limit, 
          max_time_limit,
          min_minimum_time_frame,
          max_minimum_time_frame
        FROM question_types 
        WHERE id = ${id}
        LIMIT 1
      `;
    } catch (columnError: any) {
      // If columns don't exist, use basic query
      if (columnError.code === '42703') {
        questionTypeResult = await sql`
          SELECT 
            id, 
            name
          FROM question_types 
          WHERE id = ${id}
          LIMIT 1
        `;
      } else {
        throw columnError;
      }
    }

    if (questionTypeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question type not found' },
        { status: 404 }
      );
    }

    const questionType = questionTypeResult.rows[0];
    
    // Use database constraints if defined, otherwise use sensible defaults
    const minTimeLimit = questionType.min_time_limit || 5;
    const maxTimeLimit = questionType.max_time_limit || 300;
    const minMinimumTimeFrame = questionType.min_minimum_time_frame || 1;
    const maxMinimumTimeFrame = questionType.max_minimum_time_frame || undefined;

    // Validate time_limit against database constraints
    if (!time_limit || isNaN(time_limit) || time_limit < minTimeLimit || time_limit > maxTimeLimit) {
      console.error('Invalid time_limit:', time_limit, 'Allowed range:', minTimeLimit, '-', maxTimeLimit);
      return NextResponse.json(
        { error: `Time limit must be between ${minTimeLimit} and ${maxTimeLimit} seconds (from database)` },
        { status: 400 }
      );
    }

    // Validate minimum_time_frame against database constraints
    const maxMinimumAllowed = maxMinimumTimeFrame || time_limit - 1;
    if (!minimum_time_frame || isNaN(minimum_time_frame) || minimum_time_frame < minMinimumTimeFrame || minimum_time_frame >= time_limit) {
      console.error('Invalid minimum_time_frame:', minimum_time_frame, 'Allowed range:', minMinimumTimeFrame, '-', maxMinimumAllowed);
      return NextResponse.json(
        { error: `Minimum time frame must be between ${minMinimumTimeFrame} and less than the time limit (from database)` },
        { status: 400 }
      );
    }

    // Update all questions of this type with the new time limit and minimum time frame
    console.log('Executing UPDATE query with:', { time_limit, minimum_time_frame, id });
    
    const result = await sql`
      UPDATE questions
      SET time_limit = ${time_limit}, minimum_time_frame = ${minimum_time_frame}
      WHERE question_type_id = ${id}
      RETURNING id
    `;

    console.log('Update result:', { updated_count: result.rows.length });

    return NextResponse.json(
      {
        message: `Updated ${result.rows.length} questions with time limit ${time_limit}s and minimum time frame ${minimum_time_frame}s (constraints from database)`,
        updated_count: result.rows.length,
        constraints: {
          time_limit_range: `${minTimeLimit}-${maxTimeLimit}s`,
          minimum_time_frame_range: `${minMinimumTimeFrame}-${maxMinimumAllowed}s`
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update question type error:', error);
    return NextResponse.json(
      { error: 'Failed to update question type and questions', details: String(error) },
      { status: 500 }
    );
  }
}
