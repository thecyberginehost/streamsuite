import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/db';
import { clearSessionCookieOn, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_BASE = process.env.NEXTAUTH_URL || 'https://streamsuite.io';

export async function POST(req: Request) {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (token) {
    deleteSession(token);
  }
  return clearSessionCookieOn(NextResponse.redirect(PUBLIC_BASE, 303));
}

export async function GET(req: Request) {
  return POST(req);
}
