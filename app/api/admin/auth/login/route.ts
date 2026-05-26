import { NextResponse } from 'next/server';
import { attemptAdminLogin, attachAdminSessionCookie, getAdminClientIp, getAdminUserAgent } from '@/lib/admin-auth';
import { adminLoginByIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = (await getAdminClientIp()) || 'unknown';
  const ipCheck = adminLoginByIp.check(ip);
  if (!ipCheck.ok) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${ipCheck.resetIn ?? 60}s.` },
      { status: 429 },
    );
  }

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
  }

  const result = await attemptAdminLogin(username, password, {
    ip,
    userAgent: await getAdminUserAgent(),
  });

  if (!result.ok) {
    // Uniform "invalid credentials" message regardless of reason — except
    // locked, which is distinct because the user needs to know to wait.
    if (result.reason === 'locked') {
      return NextResponse.json(
        { error: 'Account locked after too many wrong passwords. Try again in 15 minutes.' },
        { status: 401 },
      );
    }
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, redirect: '/admin/customers' });
  return attachAdminSessionCookie(res, result.sessionToken);
}
