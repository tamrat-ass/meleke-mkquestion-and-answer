import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all questions with their options count
    const result = await sql`
      SELECT 
        q.id,
        q.question_text,
        qt.name as question_type,
        COUNT(qo.id) as option_count
      FROM questions q
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.is_deleted = false
      GROUP BY q.id, q.question_text, qt.name
      ORDER BY q.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json(
      {
        questions: result.rows,
        message: 'Questions with option counts'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check options error:', error);
    return NextResponse.json(
      { error: 'Failed to check options', details: String(error) },
      { status: 500 }
    );
  }
}
