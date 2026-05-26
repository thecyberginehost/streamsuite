// Admin auth — fully isolated from customer auth.
// - Separate cookie name (`streamsuite_admin_session`)
// - Separate session table (`admin_sessions`)
// - Bcrypt-hashed passwords with per-account lockout
// - Shorter session TTL (24h) than customer (30d)
// - When served under `admin.streamsuite.io`, the host-scoped cookie cannot
//   leak to/from `streamsuite.io` — additional architectural isolation.

import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';
import {
  getAdminByUsername,
  getAdminById,
  getAdminSession,
  createAdminSession,
  deleteAdminSession,
  markAdminLoginSuccess,
  markAdminLoginFailure,
  type Admin,
} from './db';

export const ADMIN_SESSION_COOKIE = 'streamsuite_admin_session';
const BCRYPT_COST = 12;

const ADMIN_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,   // stricter than customer cookie
  path: '/',
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try { return await bcrypt.compare(plain, hash); } catch { return false; }
}

export type LoginResult =
  | { ok: true; admin: Admin; sessionToken: string }
  | { ok: false; reason: 'not_found' | 'locked' | 'wrong_password' };

// Email-format admin usernames must start with `adm.` — a hard prefix rule
// enforced both at creation (in create-admin.js) and login. Defense-in-depth:
// even with a leaked DB attackers can't probe `aamore@streamsuite.io`-style
// guesses; the request is rejected before bcrypt even runs.
function violatesUsernamePrefix(username: string): boolean {
  if (!username.includes('@')) return false;   // plain handle
  return !username.startsWith('adm.');
}

export async function attemptAdminLogin(
  username: string,
  password: string,
  ctx: { ip?: string; userAgent?: string },
): Promise<LoginResult> {
  if (violatesUsernamePrefix(username)) {
    // Spend bcrypt time before returning so timing doesn't reveal the rule.
    await bcrypt.compare(password, '$2a$12$' + 'x'.repeat(53));
    return { ok: false, reason: 'not_found' };
  }
  const admin = getAdminByUsername(username);
  if (!admin) {
    // Spend ~bcrypt time on a dummy hash to keep response time uniform —
    // prevents username-existence enumeration via timing.
    await bcrypt.compare(password, '$2a$12$' + 'x'.repeat(53));
    return { ok: false, reason: 'not_found' };
  }
  if (admin.locked_until && admin.locked_until > Date.now()) {
    return { ok: false, reason: 'locked' };
  }
  const passwordOk = await verifyPassword(password, admin.password_hash);
  if (!passwordOk) {
    markAdminLoginFailure(admin.id);
    return { ok: false, reason: 'wrong_password' };
  }
  markAdminLoginSuccess(admin.id);
  const sessionToken = createAdminSession(admin.id, ctx);
  return { ok: true, admin, sessionToken };
}

export function attachAdminSessionCookie(res: NextResponse, token: string, maxAgeSec = 24 * 60 * 60): NextResponse {
  res.cookies.set(ADMIN_SESSION_COOKIE, token, { ...ADMIN_COOKIE_OPTS, maxAge: maxAgeSec });
  return res;
}

export function clearAdminSessionCookieOn(res: NextResponse): NextResponse {
  res.cookies.set(ADMIN_SESSION_COOKIE, '', { ...ADMIN_COOKIE_OPTS, maxAge: 0 });
  return res;
}

export async function getAdminFromRequest(): Promise<Admin | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const sess = getAdminSession(token);
  if (!sess) return null;
  return getAdminById(sess.adminId);
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdminFromRequest();
  if (!admin) {
    redirect('/admin/login');
  }
  return admin;
}

export async function logoutAdmin(): Promise<void> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (token) deleteAdminSession(token);
}

export async function getAdminClientIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    undefined
  );
}

export async function getAdminUserAgent(): Promise<string | undefined> {
  return (await headers()).get('user-agent') ?? undefined;
}
