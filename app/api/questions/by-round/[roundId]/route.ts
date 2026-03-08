import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  try {
    const { roundId } = await params;

    // Fetch questions for the round with question type
    const questionsResult = await sql`
      SELECT 
        q.id,
        q.question_text as title,
        q.correct_answer,
        q.time_limit,
        q.minimum_time_frame,
        q.marks as difficulty,
        q.created_at,
        COALESCE(qt.name, 'multiple_choice') as question_type
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE q.round_id = ${roundId} AND q.is_deleted = false
      ORDER BY q.question_number ASC
    `;

    console.log('Questions result:', questionsResult.rows);

    // For each question, fetch its options
    const questionsWithOptions = await Promise.all(
      questionsResult.rows.map(async (question: any) => {
        const optionsResult = await sql`
          SELECT option_key, option_value
          FROM question_options
          WHERE question_id = ${question.id}
          ORDER BY option_key ASC
        `;

        return {
          id: question.id,
          title: question.title,
          question_type: question.question_type,
          difficulty: question.difficulty,
          created_at: question.created_at,
          correct_answer: question.correct_answer,
          time_limit: question.time_limit,
          minimum_time_frame: question.minimum_time_frame,
          options: optionsResult.rows,
        };
      })
    );

    console.log('Questions with options:', questionsWithOptions);

    return NextResponse.json(
      {
        questions: questionsWithOptions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching questions by round:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: String(error) },
      { status: 500 }
    );
  }
}
