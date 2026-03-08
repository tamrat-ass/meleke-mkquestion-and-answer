import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await sql`
      DELETE FROM questions WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Question deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json(
      { error: 'Failed to delete question', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await sql`
      SELECT q.id, q.question_text, q.correct_answer, q.marks, q.created_at,
             q.option_a, q.option_b, q.option_c, q.option_d, 
             qt.name as question_type, q.time_limit, q.minimum_time_frame
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE q.id = ${id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const question = result.rows[0];

    // Convert options to array format
    const options = [];
    if (question.option_a) options.push({ option_key: 'A', option_value: question.option_a });
    if (question.option_b) options.push({ option_key: 'B', option_value: question.option_b });
    if (question.option_c) options.push({ option_key: 'C', option_value: question.option_c });
    if (question.option_d) options.push({ option_key: 'D', option_value: question.option_d });

    return NextResponse.json(
      { 
        question: {
          ...question,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          options: options
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get question error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { question_text, correct_answer, time_limit, marks } = await request.json();

    const result = await sql`
      UPDATE questions
      SET question_text = ${question_text}, 
          correct_answer = ${correct_answer},
          time_limit = ${time_limit},
          marks = ${marks},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, question_text, correct_answer, time_limit, marks, created_at
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        question: result.rows[0], 
        message: 'Question updated successfully' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json(
      { error: 'Failed to update question', details: String(error) },
      { status: 500 }
    );
  }
}
