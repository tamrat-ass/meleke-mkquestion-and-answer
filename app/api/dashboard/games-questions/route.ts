import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get ALL rounds first
    const allRoundsResult = await sql`
      SELECT 
        r.id as round_id,
        r.name as round_name,
        r.round_number
      FROM rounds r
      ORDER BY r.round_number ASC
    `;

    // Get the question type breakdown for each round
    const typeResult = await sql`
      SELECT 
        r.id as round_id,
        r.name as round_name,
        r.round_number,
        qt.name as question_type,
        COUNT(DISTINCT q.id) as type_count
      FROM rounds r
      LEFT JOIN questions q ON r.id = q.round_id AND q.is_deleted = false
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      WHERE qt.name IS NOT NULL
      GROUP BY r.id, r.name, r.round_number, qt.name
      ORDER BY r.round_number ASC, qt.name ASC
    `;

    // Get summary data (games count per round)
    const summaryResult = await sql`
      SELECT 
        r.id as round_id,
        r.name as round_name,
        r.round_number,
        COUNT(DISTINCT g.id) as games_count
      FROM rounds r
      LEFT JOIN games g ON r.id = g.round_id
      GROUP BY r.id, r.name, r.round_number
      ORDER BY r.round_number ASC
    `;

    // Create maps for games and question types by round
    const gamesMap: { [key: string]: number } = {};
    summaryResult.rows.forEach((row: any) => {
      gamesMap[row.round_id] = parseInt(row.games_count || '0');
    });

    // Create initial map with ALL rounds
    const roundsMap: { [key: string]: any } = {};
    allRoundsResult.rows.forEach((row: any) => {
      roundsMap[row.round_id] = {
        round: row.round_name || 'No Round',
        roundNumber: row.round_number,
        games: gamesMap[row.round_id] || 0,
        questions: 0,
        questionTypes: []
      };
    });

    // Add question type data to existing rounds
    typeResult.rows.forEach((row: any) => {
      const roundKey = row.round_id;
      
      if (roundsMap[roundKey] && row.question_type) {
        const count = parseInt(row.type_count || '0');
        roundsMap[roundKey].questionTypes.push({
          type: row.question_type,
          count: count
        });
        // Add to total questions count
        roundsMap[roundKey].questions += count;
      }
    });

    const data = Object.values(roundsMap).sort((a: any, b: any) => a.roundNumber - b.roundNumber);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Games and questions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games and questions data' },
      { status: 500 }
    );
  }
}
