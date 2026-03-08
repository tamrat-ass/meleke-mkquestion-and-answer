import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await sql`
      SELECT id, name, round_number, description, created_at
      FROM rounds
      WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { round: result.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get round error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch round', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Round name is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE rounds 
      SET name = ${name}, description = ${description || null}
      WHERE id = ${id}
      RETURNING id, name, round_number, description, created_at
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { round: result.rows[0], message: 'Round updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update round error:', error);
    return NextResponse.json(
      { error: 'Failed to update round', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await sql`
      DELETE FROM rounds WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Round deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete round error:', error);
    return NextResponse.json(
      { error: 'Failed to delete round', details: String(error) },
      { status: 500 }
    );
  }
}
