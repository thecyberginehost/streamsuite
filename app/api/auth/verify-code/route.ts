import { NextResponse } from 'next/server';
import { consumeMagicCode, createSession } from '@/lib/db';
import { attachSessionCookie, getClientIp, getUserAgent } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory IP rate limit. One pm2 fork instance, so a Map is fine.
// Resets on server restart, which is acceptable for a non-critical auth path
// (attackers also lose state and the underlying code rotation already
// throttles them).
type Bucket = { count: number; resetAt: number };
const ipBuckets = new Map<string, Bucket>();
const IP_WINDOW_MS = 60_000;
const IP_MAX_ATTEMPTS = 20;

function ipRateLimited(ip: string): boolean {
  const now = Date.now();
  const b = ipBuckets.get(ip);
  if (!b || b.resetAt < now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return false;
  }
  b.count += 1;
  return b.count > IP_MAX_ATTEMPTS;
}

function normalizeCode(s: unknown): string | null {
  if (typeof s !== 'string') return null;
  const digits = s.replace(/\D/g, '');
  return digits.length === 6 ? digits : null;
}

function isValidEmail(s: unknown): s is string {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;
  const code = normalizeCode(body?.code);
  if (!email || !isValidEmail(email) || !code) {
    return NextResponse.json({ error: 'Invalid email or code' }, { status: 400 });
  }

  const ip = (await getClientIp()) || 'unknown';
  if (ipRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a minute and try again.' },
      { status: 429 },
    );
  }

  const result = consumeMagicCode(email, code);
  if (result.result === 'expired') {
    return NextResponse.json(
      { error: 'No active sign-in code for this email. Request a new one.' },
      { status: 401 },
    );
  }
  if (result.result === 'locked') {
    return NextResponse.json(
      { error: 'Too many wrong codes. Request a new sign-in email.' },
      { status: 401 },
    );
  }
  if (result.result === 'invalid') {
    return NextResponse.json(
      { error: 'Wrong code. Check your email and try again.' },
      { status: 401 },
    );
  }

  // ok — create session, return JSON with redirect URL and set cookie
  const sessionToken = createSession(email, {
    ip,
    userAgent: await getUserAgent(),
  });

  const res = NextResponse.json({ ok: true, redirect: '/dashboard' });
  return attachSessionCookie(res, sessionToken);
}
