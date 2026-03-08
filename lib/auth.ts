import bcryptjs from 'bcryptjs';
import { sql } from './db';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export async function createUser(email: string, password: string, fullName: string, roleId: number) {
  try {
    const passwordHash = await hashPassword(password);
    const result = await sql<{
      id: number;
      email: string;
      full_name: string;
      role_id: number;
      created_at: Date;
    }>`
      INSERT INTO users (email, password_hash, full_name, role_id)
      VALUES (${email}, ${passwordHash}, ${fullName}, ${roleId})
      RETURNING id, email, full_name, role_id, created_at
    `;

    return result.rows[0];
  } catch (error) {
    console.error(' Error creating user:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await sql`
      SELECT u.*, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${email} AND u.is_active = true
    `;
    const rows = result.rows;
    const row = Array.isArray(rows) ? rows[0] : null;
    return row || null;
  } catch (error) {
    console.error(' Error fetching user:', error);
    throw error;
  }
}

export async function getUserById(userId: number) {
  try {
    const result = await sql`
      SELECT u.*, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${userId}
    `;
    const rows = result.rows;
    const row = Array.isArray(rows) ? rows[0] : null;
    return row || null;
  } catch (error) {
    console.error('  Error fetching user by ID:', error);
    throw error;
  }
}

export async function getUserPermissions(userId: number) {
  try {
    const user = await getUserById(userId);
    if (!user) return [];

    const result = await sql`
      SELECT DISTINCT p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON rp.role_id = r.id
      WHERE r.id = ${ (user as any).role_id }
    `;
    const rows = result.rows;
    return (Array.isArray(rows) ? rows : []).map((row: any) => row.name);
  } catch (error) {
    console.error(' Error fetching user permissions:', error);
    return [];
  }
}

export async function logActivity(
  userId: number | null,
  action: string,
  entityType: string | null,
  entityId: number | null,
  details: any = null,
  ipAddress: string | null = null,
  userAgent: string | null = null
) {
  try {
    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
      VALUES (
        ${userId},
        ${action},
        ${entityType},
        ${entityId},
        ${details ? JSON.stringify(details) : null},
        ${ipAddress},
        ${userAgent}
      )
    `;
  } catch (error) {
    console.error(' Error logging activity:', error);
  }
}
