import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    // Validate inputs request to create new user name and password
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Mock user creation (in production, save to database)
    const newUser = {
      id: Math.floor(Math.random() * 10000),
      email,
      full_name: fullName,
      role_id: 3, // Default to player role
      role_name: 'player',
      is_active: 1
    };

    return NextResponse.json(
      {
        user: newUser,
        message: 'Signup successful',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Signup API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
