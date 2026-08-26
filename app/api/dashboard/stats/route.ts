import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Fetch total games count
    const gamesResult = await sql<{ count: number }>`
      SELECT COUNT(*) as count FROM games
    `;
    const totalGames = parseInt(gamesResult.rows[0]?.count || '0');

    // Fetch total questions count
    const questionsResult = await sql<{ count: number }>`
      SELECT COUNT(*) as count FROM questions
    `;
    const totalQuestions = parseInt(questionsResult.rows[0]?.count || '0');

    // Fetch total rounds count
    const roundsResult = await sql<{ count: number }>`
      SELECT COUNT(*) as count FROM rounds
    `;
    const totalRounds = parseInt(roundsResult.rows[0]?.count || '0');

    // Fetch total active users count
    const activeUsersResult = await sql<{ count: number }>`
      SELECT COUNT(*) as count FROM users WHERE is_active = true
    `;
    const totalActiveUsers = parseInt(activeUsersResult.rows[0]?.count || '0');

    // Fetch recent activity
    const activityResult = await sql<{
      id: number;
      action: string;
      created_at: string;
    }>`
      SELECT id, action, created_at
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const recentActivity = activityResult.rows;

    const stats = {
      totalGames,
      totalQuestions,
      totalRounds,
      totalActiveUsers,
      recentActivity
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
