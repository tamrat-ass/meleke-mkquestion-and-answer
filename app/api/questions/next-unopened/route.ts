import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('round_id');
    const questionType = searchParams.get('question_type');

    if (!roundId) {
      return NextResponse.json(
        { error: 'round_id is required' },
        { status: 400 }
      );
    }

    let result;

    if (questionType) {
      result = await sql`
        SELECT 
          q.id,
          q.question_text as title,
          qt.name as question_type,
          q.marks as difficulty,
          q.created_at,
          q.round_id,
          r.name as round_name,
          r.round_number,
          q.correct_answer,
          q.time_limit,
          q.minimum_time_frame,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.status
        FROM questions q
        LEFT JOIN question_types qt ON q.question_type_id = qt.id
        LEFT JOIN rounds r ON q.round_id = r.id
        WHERE q.round_id = ${roundId}
        AND q.is_deleted = false
        AND q.status = 'NOT_OPENED'
        AND qt.name = ${questionType}
        ORDER BY q.created_at ASC
        LIMIT 1
      `;
    } else {
      result = await sql`
        SELECT 
          q.id,
          q.question_text as title,
          qt.name as question_type,
          q.marks as difficulty,
          q.created_at,
          q.round_id,
          r.name as round_name,
          r.round_number,
          q.correct_answer,
          q.time_limit,
          q.minimum_time_frame,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.status
        FROM questions q
        LEFT JOIN question_types qt ON q.question_type_id = qt.id
        LEFT JOIN rounds r ON q.round_id = r.id
        WHERE q.round_id = ${roundId}
        AND q.is_deleted = false
        AND q.status = 'NOT_OPENED'
        ORDER BY q.created_at ASC
        LIMIT 1
      `;
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { question: null, message: 'No unopened questions found' },
        { status: 200 }
      );
    }

    // Convert options to array format
    const row = result.rows[0];
    const options = [];
    if (row.option_a) options.push({ option_key: 'A', option_value: row.option_a });
    if (row.option_b) options.push({ option_key: 'B', option_value: row.option_b });
    if (row.option_c) options.push({ option_key: 'C', option_value: row.option_c });
    if (row.option_d) options.push({ option_key: 'D', option_value: row.option_d });

    const question = {
      id: row.id,
      title: row.title,
      question_type: row.question_type || 'multiple_choice',
      difficulty: row.difficulty ? (row.difficulty > 2 ? 'hard' : row.difficulty > 1 ? 'medium' : 'easy') : 'medium',
      created_at: row.created_at,
      round_id: row.round_id,
      round_name: row.round_name || 'No Round',
      round_number: row.round_number,
      correct_answer: row.correct_answer,
      time_limit: row.time_limit,
      minimum_time_frame: row.minimum_time_frame,
      option_a: row.option_a,
      option_b: row.option_b,
      option_c: row.option_c,
      option_d: row.option_d,
      options: options,
      status: row.status
    };

    return NextResponse.json(
      { question },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching next unopened question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch next unopened question', details: String(error) },
      { status: 500 }
    );
  }
}
