import { NextResponse } from 'next/server';
import { logoutAdmin, clearAdminSessionCookieOn } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_BASE = process.env.NEXTAUTH_URL || 'https://streamsuite.io';

async function handle() {
  await logoutAdmin();
  return clearAdminSessionCookieOn(NextResponse.redirect(`${PUBLIC_BASE}/admin/login`, 303));
}

export async function POST() { return handle(); }
export async function GET() { return handle(); }
