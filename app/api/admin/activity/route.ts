import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await sql<{
      id: number;
      user_id: number | null;
      action: string;
      entity_type: string | null;
      entity_id: number | null;
      details: any;
      ip_address: string | null;
      user_agent: string | null;
      created_at: string;
      user_email?: string;
    }>`
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `;

    return NextResponse.json(
      {
        activities: result.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Activity logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
