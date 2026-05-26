import { NextResponse } from 'next/server';
import { COLO_GROUPS, ACTIVE_GROUP_ID } from '@/lib/colo-groups';
import { getColoGroupCounts, getColoGroupCountsByTier } from '@/lib/db';

// Public endpoint — no auth. Returns slot availability for every known
// colocation group, including per-tier breakdown so the marketing site can
// gate Full Node tier independently (capped at 1 per box).
//
// Cached briefly (10s) because slot counts only move on signup/cancel.
export const revalidate = 10;
export const dynamic = 'force-dynamic';

export async function GET() {
  const counts = new Map<string, number>();
  for (const row of getColoGroupCounts()) counts.set(row.colo_group, row.active_count);

  const byTier = new Map<string, number>();
  for (const row of getColoGroupCountsByTier()) {
    byTier.set(`${row.colo_group}|${row.tier}`, row.active_count);
  }

  const groups = COLO_GROUPS.map(g => {
    const active = counts.get(g.id) ?? 0;
    const remaining = Math.max(0, g.max_slots - active);
    const fullnode_used = byTier.get(`${g.id}|fullnode`) ?? 0;
    const fullnode_remaining = Math.max(0, g.tier_caps.fullnode - fullnode_used);
    return {
      id: g.id,
      hostname: g.hostname,
      region: g.region,
      max_slots: g.max_slots,
      active_count: active,
      slots_remaining: remaining,
      status: g.status,
      accepting_signups: g.status === 'open' && remaining > 0,
      tiers: {
        fullnode: {
          cap: g.tier_caps.fullnode,
          used: fullnode_used,
          remaining: fullnode_remaining,
          accepting: g.status === 'open' && fullnode_remaining > 0 && remaining > 0,
        },
      },
    };
  });

  return NextResponse.json(
    {
      active_group_id: ACTIVE_GROUP_ID,
      groups,
      ts: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=10, s-maxage=10',
      },
    }
  );
}
