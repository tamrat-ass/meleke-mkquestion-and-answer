import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Try to fetch with new constraint columns, with fallback for old schema
    let result;
    try {
      result = await sql`
        SELECT 
          id, 
          name, 
          COALESCE(time_limit, (SELECT AVG(time_limit)::INT FROM questions WHERE question_type_id = question_types.id), 30) as time_limit,
          COALESCE((SELECT AVG(minimum_time_frame)::INT FROM questions WHERE question_type_id = question_types.id), 1) as min_minimum_time_frame,
          COALESCE(min_time_limit, 5) as min_time_limit,
          COALESCE(max_time_limit, 300) as max_time_limit,
          max_minimum_time_frame
        FROM question_types
        ORDER BY name ASC
      `;
    } catch (columnError: any) {
      // If columns don't exist (error code 42703), use basic query and get values from questions
      if (columnError.code === '42703') {
        result = await sql`
          SELECT 
            qt.id, 
            qt.name,
            COALESCE(AVG(q.time_limit)::INT, 30) as time_limit,
            COALESCE(AVG(q.minimum_time_frame)::INT, 1) as min_minimum_time_frame,
            5 as min_time_limit,
            300 as max_time_limit,
            NULL as max_minimum_time_frame
          FROM question_types qt
          LEFT JOIN questions q ON q.question_type_id = qt.id
          GROUP BY qt.id, qt.name
          ORDER BY qt.name ASC
        `;
      } else {
        throw columnError;
      }
    }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, time_limit = 30 } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Question type name is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if question type already exists
    const existing = await sql`
      SELECT id FROM question_types WHERE name = ${name}
    `;

    if (existing.rows && existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Question type already exists' },
        { status: 409 }
      );
    }

    // Insert new question type
    const result = await sql`
      INSERT INTO question_types (name, time_limit)
      VALUES (${name}, ${time_limit})
      RETURNING id, name, time_limit
    `;

    return NextResponse.json(
      {
        message: 'Question type created successfully',
        question_type: result.rows?.[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create question type error:', error);
    return NextResponse.json(
      { error: 'Failed to create question type', details: String(error) },
      { status: 500 }
    );
  }
}
