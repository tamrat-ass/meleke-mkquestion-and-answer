import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // For each question with NULL time_limit or minimum_time_frame, 
    // use the default from its question type from the database

    // Get all questions with NULL time_limit, along with their question type defaults
    const nullTimeLimitQuestions = await sql`
      SELECT 
        q.id,
        COALESCE(qt.time_limit, 30) as default_time_limit,
        COALESCE(qt.min_minimum_time_frame, 1) as default_minimum_time_frame
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE q.time_limit IS NULL OR q.minimum_time_frame IS NULL
    `;

    let updatedTimeLimit = 0;
    let updatedMinimumTimeFrame = 0;

    // Update each question with database-driven defaults
    for (const question of nullTimeLimitQuestions.rows) {
      if (question.time_limit === null) {
        await sql`
          UPDATE questions
          SET time_limit = ${question.default_time_limit}
          WHERE id = ${question.id}
        `;
        updatedTimeLimit++;
      }

      if (question.minimum_time_frame === null) {
        await sql`
          UPDATE questions
          SET minimum_time_frame = ${question.default_minimum_time_frame}
          WHERE id = ${question.id}
        `;
        updatedMinimumTimeFrame++;
      }
    }
    
    return NextResponse.json(
      {
        message: 'Fixed question timings using database constraints',
        updated_time_limit: updatedTimeLimit,
        updated_minimum_time_frame: updatedMinimumTimeFrame,
        note: 'Values fetched from question_types table (min_minimum_time_frame and time_limit columns)',
        source: 'database'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fixing timings:', error);
    return NextResponse.json(
      { error: 'Failed to fix timings', details: String(error) },
      { status: 500 }
    );
  }
}
