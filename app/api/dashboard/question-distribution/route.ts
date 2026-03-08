import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await sql<{
      question_type_id: number;
      type_name: string;
      count: number;
    }>`
      SELECT 
        qt.id as question_type_id,
        qt.name as type_name,
        COUNT(q.id) as count
      FROM question_types qt
      LEFT JOIN questions q ON qt.id = q.question_type_id
      GROUP BY qt.id, qt.name
      ORDER BY count DESC
    `;

    const distribution = result.rows.map((row) => ({
      name: row.type_name,
      value: parseInt(row.count || '0'),
    }));

    return NextResponse.json({ distribution }, { status: 200 });
  } catch (error) {
    console.error('Question distribution error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question distribution' },
      { status: 500 }
    );
  }
}
