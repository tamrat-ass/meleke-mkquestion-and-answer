import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;

    // Mark question as OPENED
    const result = await sql`
      UPDATE questions
      SET status = 'OPENED', opened_at = NOW()
      WHERE id = ${questionId} AND status = 'NOT_OPENED'
      RETURNING id, status, opened_at
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question not found or already opened' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Question marked as opened',
        question: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking question as opened:', error);
    return NextResponse.json(
      { error: 'Failed to mark question as opened', details: String(error) },
      { status: 500 }
    );
  }
}
