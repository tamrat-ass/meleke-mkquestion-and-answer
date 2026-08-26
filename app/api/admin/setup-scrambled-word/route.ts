import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * Setup endpoint to insert the scrambled_word question type
 * This is a one-time setup that can be called manually
 */
export async function POST(request: NextRequest) {
  try {
    // Check if scrambled_word type already exists
    const existing = await sql`
      SELECT id FROM question_types WHERE name = 'scrambled_word'
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          message: 'Scrambled Word question type already exists',
          question_type: existing.rows[0],
        },
        { status: 200 }
      );
    }

    // Insert the scrambled_word question type
    const result = await sql`
      INSERT INTO question_types (name, description)
      VALUES (
        'scrambled_word',
        'Scrambled Word Challenge - Players must identify the original word from scrambled letters'
      )
      RETURNING id, name, description
    `;

    return NextResponse.json(
      {
        message: 'Scrambled Word question type created successfully',
        question_type: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Setup scrambled word error:', error);
    return NextResponse.json(
      { error: 'Failed to setup scrambled word question type', details: String(error) },
      { status: 500 }
    );
  }
}
