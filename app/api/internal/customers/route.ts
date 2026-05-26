import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYNC_SECRET = process.env.STREAMSUITE_SYNC_SECRET;

export async function GET(req: Request) {
  if (!SYNC_SECRET) {
    return NextResponse.json({ error: 'Sync not configured' }, { status: 503 });
  }

  const auth = (await headers()).get('authorization') || '';
  const presented = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  // constant-time-ish compare
  if (presented.length !== SYNC_SECRET.length) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let mismatch = 0;
  for (let i = 0; i < presented.length; i++) {
    mismatch |= presented.charCodeAt(i) ^ SYNC_SECRET.charCodeAt(i);
  }
  if (mismatch !== 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Include past_due so customers in dunning still have RPC access during
  // Stripe retry window. They lose access only on cancellation/unpaid.
  const rows = db().prepare(`
    SELECT email, api_key, tier, operator_id, status, updated_at
    FROM customers
    WHERE status IN ('active', 'past_due') AND api_key IS NOT NULL
  `).all() as Array<{
    email: string;
    api_key: string;
    tier: string;
    operator_id: string;
    status: string;
    updated_at: number;
  }>;

  return NextResponse.json({
    generated_at: Date.now(),
    count: rows.length,
    customers: rows,
  });
}
