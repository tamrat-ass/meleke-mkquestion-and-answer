import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { time_limit } = await request.json();

    // Try to fetch question type with constraints, with fallback for columns that may not exist
    let questionTypeResult;
    try {
      questionTypeResult = await sql`
        SELECT 
          id, 
          name, 
          min_time_limit, 
          max_time_limit
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

    // Validate against database constraints
    if (!time_limit || time_limit < minTimeLimit || time_limit > maxTimeLimit) {
      return NextResponse.json(
        { error: `Time limit must be between ${minTimeLimit} and ${maxTimeLimit} seconds (from database)` },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE question_types
      SET time_limit = ${time_limit}
      WHERE id = ${id}
      RETURNING id, name, time_limit
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        question_type: result.rows[0],
        message: 'Question type updated successfully',
        constraints: {
          min_time_limit: minTimeLimit,
          max_time_limit: maxTimeLimit,
          source: 'database'
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update question type error:', error);
    return NextResponse.json(
      { error: 'Failed to update question type', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, check if any questions use this question type
    const questionsCount = await sql`
      SELECT COUNT(*) as count FROM questions WHERE question_type_id = ${id} AND is_deleted = false
    `;

    const count = questionsCount.rows?.[0]?.count || 0;

    if (count > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete question type',
          message: `This question type is being used by ${count} question(s). Please delete or reassign those questions first.`,
          questionsUsingType: count,
        },
        { status: 409 }
      );
    }

    // Delete the question type
    const result = await sql`
      DELETE FROM question_types
      WHERE id = ${id}
      RETURNING id, name
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Question type deleted successfully',
        question_type: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete question type error:', error);
    return NextResponse.json(
      { error: 'Failed to delete question type', details: String(error) },
      { status: 500 }
    );
  }
}