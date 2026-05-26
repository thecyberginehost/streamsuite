import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public health endpoint. Used by UptimeRobot + /status page.
// Returns 200 OK only if every dependency is healthy. UptimeRobot triggers
// on non-2xx, so degraded components flip the status code to 503.
//
// Intentionally NOT bearer-authed — UptimeRobot needs anonymous access.
// Already in the auth-bypass list in nginx.

const BSC_RPC_HEALTH_URL = process.env.BSC_HEALTH_URL || 'https://va-bsc-01.streamsuite.io/api/health';
const HEALTH_TIMEOUT_MS = 3000;

async function checkDb(): Promise<{ ok: boolean; error?: string }> {
  try {
    // Cheap probe — confirms SQLite file is open and responsive.
    const r = db().prepare('SELECT 1 as ok').get() as { ok: number } | undefined;
    return { ok: r?.ok === 1 };
  } catch (e: any) {
    return { ok: false, error: e?.message?.slice(0, 200) || 'db error' };
  }
}

async function checkBsc(): Promise<{ ok: boolean; block?: number; block_age_sec?: number; error?: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), HEALTH_TIMEOUT_MS);
    const res = await fetch(BSC_RPC_HEALTH_URL, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return { ok: false, error: `bsc http ${res.status}` };
    const j = await res.json() as { fresh?: boolean; block?: number; block_age_sec?: number };
    // Pass `block` through so the homepage <LiveBlockTicker /> can display it.
    return { ok: !!j.fresh, block: j.block, block_age_sec: j.block_age_sec };
  } catch (e: any) {
    return { ok: false, error: e?.name === 'AbortError' ? 'bsc timeout' : (e?.message?.slice(0, 200) || 'bsc error') };
  }
}

export async function GET() {
  const startedAt = Date.now();
  const [dbCheck, bscCheck] = await Promise.all([checkDb(), checkBsc()]);
  const allOk = dbCheck.ok && bscCheck.ok;
  const elapsed = Date.now() - startedAt;
  return NextResponse.json(
    {
      ok: allOk,
      ts: new Date().toISOString(),
      checks: {
        db: dbCheck,
        bsc: bscCheck,
      },
      elapsed_ms: elapsed,
    },
    { status: allOk ? 200 : 503 },
  );
}
