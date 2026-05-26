import { NextResponse } from 'next/server';
import { consumeMagicToken, createSession } from '@/lib/db';
import { attachSessionCookie, getClientIp, getUserAgent } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Always redirect to the public base URL, not req.url — Next.js behind nginx
// sees req.url as http://localhost:3001, which would 404 in the browser.
const PUBLIC_BASE = process.env.NEXTAUTH_URL || 'https://streamsuite.io';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(`${PUBLIC_BASE}/login?error=missing_token`);
  }

  const result = consumeMagicToken(token);
  if (!result) {
    return NextResponse.redirect(`${PUBLIC_BASE}/login?error=invalid_token`);
  }

  const sessionToken = createSession(result.email, {
    ip: await getClientIp(),
    userAgent: await getUserAgent(),
  });

  return attachSessionCookie(NextResponse.redirect(`${PUBLIC_BASE}/dashboard`), sessionToken);
}
