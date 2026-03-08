import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Fetch all questions with their correct answers
    const result = await sql`
      SELECT 
        id,
        question_text,
        correct_answer,
        time_limit,
        marks,
        created_at
      FROM questions
      WHERE is_deleted = false
      ORDER BY created_at DESC
    `;

    const questions = result.rows.map((row: any) => ({
      id: row.id,
      question: row.question_text,
      correctAnswer: row.correct_answer,
      timeLimit: row.time_limit,
      marks: row.marks,
      createdAt: row.created_at
    }));

    return NextResponse.json(
      {
        total: questions.length,
        questions,
        message: 'All questions with correct answers retrieved successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: String(error) },
      { status: 500 }
    );
  }
}
