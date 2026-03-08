import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { time_limit } = await request.json();

    if (!time_limit || time_limit < 5 || time_limit > 300) {
      return NextResponse.json(
        { error: 'Time limit must be between 5 and 300 seconds' },
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
