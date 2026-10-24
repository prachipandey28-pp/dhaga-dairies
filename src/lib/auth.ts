import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { AdminUser } from '@/types';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dhaga-diaries-super-secret-key-2026-production';
export const ADMIN_COOKIE_NAME = 'dhaga_admin_session';

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'owner' | 'manager';
}

export function hashPassword(plain: string): string {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(plain, salt);
}

export function comparePassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function createAdminToken(user: { id: string; email: string; name: string; role: 'admin' | 'owner' | 'manager' }): string {
  const payload: AdminSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminSession;
    return decoded;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
