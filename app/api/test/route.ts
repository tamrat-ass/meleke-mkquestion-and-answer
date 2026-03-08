import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Fetch all users
    const usersResult = await sql`SELECT * FROM users`;
    
    // Fetch all roles
    const rolesResult = await sql`SELECT * FROM roles`;
    
    // Fetch all permissions
    const permissionsResult = await sql`SELECT * FROM permissions`;
    
    // Fetch all questions
    const questionsResult = await sql`SELECT * FROM questions`;
    
    // Fetch all games
    const gamesResult = await sql`SELECT * FROM games`;

    return NextResponse.json({
      users: usersResult.rows,
      roles: rolesResult.rows,
      permissions: permissionsResult.rows,
      questions: questionsResult.rows,
      games: gamesResult.rows,
      message: 'Data fetched successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    );
  }
}
