import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check current time limits in database
    const result = await sql`
      SELECT 
        qt.id,
        qt.name,
        COUNT(q.id) as question_count,
        AVG(q.time_limit) as avg_time_limit,
        MIN(q.time_limit) as min_time_limit,
        MAX(q.time_limit) as max_time_limit
      FROM question_types qt
      LEFT JOIN questions q ON qt.id = q.question_type_id AND q.is_deleted = false
      GROUP BY qt.id, qt.name
      ORDER BY qt.name
    `;

    return NextResponse.json(
      {
        question_types: result.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify time limit error:', error);
    return NextResponse.json(
      { error: 'Failed to verify time limits', details: String(error) },
      { status: 500 }
    );
  }
}
