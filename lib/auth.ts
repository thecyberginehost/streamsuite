import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';
import { getSession } from './db';

export const SESSION_COOKIE = 'streamsuite_session';
export const OAUTH_STATE_COOKIE = 'streamsuite_oauth_state';

export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
};

// Attach session cookie directly to a NextResponse — required when issuing a
// redirect from a Route Handler. Using cookies().set() alone does not reliably
// attach Set-Cookie to NextResponse.redirect() responses across Next versions.
export function attachSessionCookie(res: NextResponse, token: string, maxAgeSec = 30 * 24 * 60 * 60): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    ...SESSION_COOKIE_OPTS,
    maxAge: maxAgeSec,
  });
  return res;
}

export function clearSessionCookieOn(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, '', {
    ...SESSION_COOKIE_OPTS,
    maxAge: 0,
  });
  return res;
}

export async function getSessionEmail(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sess = getSession(token);
  return sess?.email ?? null;
}

export async function requireSession(): Promise<string> {
  const email = await getSessionEmail();
  if (!email) {
    redirect('/login');
  }
  return email;
}

export async function getClientIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    undefined
  );
}

export async function getUserAgent(): Promise<string | undefined> {
  return (await headers()).get('user-agent') ?? undefined;
}
