import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Update questions with NULL time_limit to default 30
    const updateTimeLimit = await sql`
      UPDATE questions
      SET time_limit = 30
      WHERE time_limit IS NULL
      RETURNING id
    `;
    
    // Update questions with NULL minimum_time_frame to default 5
    const updateMinTime = await sql`
      UPDATE questions
      SET minimum_time_frame = 5
      WHERE minimum_time_frame IS NULL
      RETURNING id
    `;
    
    return NextResponse.json(
      {
        message: 'Fixed question timings',
        updated_time_limit: updateTimeLimit.rows.length,
        updated_minimum_time_frame: updateMinTime.rows.length
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
