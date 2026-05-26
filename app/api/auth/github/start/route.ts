import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { OAUTH_STATE_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_BASE = process.env.NEXTAUTH_URL || 'https://streamsuite.io';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;

const STATE_TTL_SEC = 10 * 60;

export async function GET() {
  if (!GITHUB_CLIENT_ID) {
    return NextResponse.redirect(`${PUBLIC_BASE}/login?error=oauth_unconfigured`);
  }

  const state = crypto.randomBytes(24).toString('base64url');
  const redirectUri = `${PUBLIC_BASE}/api/auth/github/callback`;

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', 'read:user user:email');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('allow_signup', 'false');

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_TTL_SEC,
  });
  return res;
}
