import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { game_id, question_id, user_answer, is_correct, marks_obtained } = await request.json();

    if (!game_id || !question_id) {
      return NextResponse.json(
        { error: 'game_id and question_id are required' },
        { status: 400 }
      );
    }

    // Insert or update the answer record
    const result = await sql`
      INSERT INTO game_answers (game_id, question_id, user_answer, is_correct, marks_obtained, answered_at)
      VALUES (${game_id}, ${question_id}, ${user_answer}, ${is_correct}, ${marks_obtained}, NOW())
      ON CONFLICT (game_id, question_id) 
      DO UPDATE SET 
        user_answer = ${user_answer},
        is_correct = ${is_correct},
        marks_obtained = ${marks_obtained},
        answered_at = NOW()
      RETURNING id, marks_obtained
    `;

    return NextResponse.json(
      {
        answer: result.rows[0],
        message: 'Answer saved successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Save answer error:', error);
    return NextResponse.json(
      { error: 'Failed to save answer', details: String(error) },
      { status: 500 }
    );
  }
}
