import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Find user in database
    const result = await sql`
      SELECT 
        u.id,
        u.email,
        u.password_hash,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        r.name as role_name,
        u.is_active
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${email}
    `;

    if (result.rows.length === 0) {
      console.log(`Login attempt: User not found - ${email}`);
      return NextResponse.json(
        { error: 'Email not found. Please check your email or create an account.' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      console.log(`Login attempt: User inactive - ${email}`);
      return NextResponse.json(
        { error: 'This account is inactive. Please contact an administrator.' },
        { status: 401 }
      );
    }

    // Verify password using SHA256 (same as used during user creation)
    const passwordHash = createHash('sha256').update(password).digest('hex');

    console.log(`Login attempt for ${email}:`);
    console.log(`Provided password hash: ${passwordHash}`);
    console.log(`Stored password hash: ${user.password_hash}`);

    if (passwordHash !== user.password_hash) {
      console.log(`Login failed: Password mismatch for ${email}`);
      return NextResponse.json(
        { error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const timestamp = new Date().toISOString();

    // Log the successful login activity with username and timestamp
    const details = {
      username: user.email,
      full_name: user.full_name,
      timestamp: timestamp,
      role: user.role_name
    };

    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
      VALUES (${user.id}, 'LOGIN_SUCCESS', 'user', ${user.id}, ${JSON.stringify(details)}, ${ipAddress}, ${userAgent}, NOW())
    `;

    // Return user data without password
    const { password_hash, ...userWithoutPassword } = user;

    // Fetch user permissions (if any exist)
    const permissionsResult = await sql`
      SELECT permissions FROM users WHERE id = ${user.id}
    `;
    
    let permissions: string[] = [];
    if (permissionsResult.rows.length > 0 && permissionsResult.rows[0].permissions) {
      permissions = permissionsResult.rows[0].permissions;
    }

    console.log(`Login successful for ${email}`);
    return NextResponse.json(
      {
        user: {
          ...userWithoutPassword,
          permissions,
        },
        message: 'Login successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
