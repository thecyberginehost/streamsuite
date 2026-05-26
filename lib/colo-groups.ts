// Colocation-group registry.
//
// One entry per physical bare-metal server. `status`:
//   - 'open'         — server is LIVE and accepting new signups
//   - 'full'         — capacity reached, no new signups, existing customers continue
//   - 'provisioning' — server is on order / being set up; listed in the registry
//                      so the marketing site can show "coming soon" but signups
//                      are BLOCKED until status flips to 'open' (only flip after
//                      the box is live: geth synced, DNS resolves, cert valid).
//   - 'archived'     — server retired or migrated; preserved here so customer
//                      history (customers.colo_group) still maps to something
//
// Signup gating: pricing-page CTAs are replaced with a waitlist message when
// NO group has status='open' AND slots_remaining > 0. See isAcceptingSignups()
// in this file and `getAcceptingGroup()` in lib/db.ts.
//
// Flipping from va-bsc-01 (full) to va-bsc-02 (live):
//   1. Procure new bare-metal server (1-7 days)
//   2. Add new entry here as status='provisioning', set ACTIVE_GROUP_ID to it
//   3. Deploy. Pricing page now shows "Waitlist only" because no group is open.
//   4. Once the new box is verified live (geth synced + DNS + cert + smoke test):
//      flip previous group to 'full', flip new group to 'open', redeploy.
//   5. New signups start landing on the new group.
// Existing customers stay on whichever group their customers.colo_group row
// already points to — they do not get auto-migrated.

export type ColoStatus = 'open' | 'full' | 'provisioning' | 'archived';

// Per-tier hard caps within a single colo group. Independent of total
// max_slots — these enforce workload-driven limits.
//
// Full Node tier is capped at 1 per box because two concurrent
// debug_traceTransaction tenants demonstrably lock up geth (see benchmarks).
// Mempool / Real-Time have no per-tier cap beyond max_slots.
export type TierCaps = {
  fullnode: number;
};

export type ColoGroup = {
  id: string;            // matches customers.colo_group value
  hostname: string;      // public RPC hostname for this group
  region: string;        // human label, e.g. "Ashburn, VA"
  max_slots: number;     // total operator capacity for this physical box
  tier_caps: TierCaps;   // per-tier hard caps within this group
  status: ColoStatus;
  // Optional human-readable note for 'provisioning' state.
  // Shown on the marketing site, e.g. "Live ~2026-05-25".
  provisioning_note?: string;
};

export const COLO_GROUPS: ColoGroup[] = [
  {
    id: 'va-bsc-01',
    hostname: 'va-bsc-01.streamsuite.io',
    region: 'Ashburn, VA',
    max_slots: 10,
    tier_caps: { fullnode: 1 },
    status: 'open',
  },
  // When va-bsc-01 fills:
  //  1. Order the next server. Add this BEFORE it lands:
  //     {
  //       id: 'va-bsc-02',
  //       hostname: 'va-bsc-02.streamsuite.io',
  //       region: 'Ashburn, VA',
  //       max_slots: 10,
  //       status: 'provisioning',
  //       provisioning_note: 'Live ~2026-XX-XX',
  //     },
  //  2. Also flip the line above (va-bsc-01) to status='full'.
  //  3. Update ACTIVE_GROUP_ID below to 'va-bsc-02'.
  //  4. Pricing CTAs auto-switch to waitlist until status flips 'open'.
];

// New-signup placement target. When the next box arrives, point this at the new
// group BEFORE provisioning completes — that way the moment you flip status to
// 'open', customers land on the right box. While the target group is in
// 'provisioning', the pricing page blocks signups outright.
export const ACTIVE_GROUP_ID: string = 'va-bsc-01';

export function getActiveGroup(): ColoGroup {
  const group = COLO_GROUPS.find(g => g.id === ACTIVE_GROUP_ID);
  if (!group) {
    throw new Error(`ACTIVE_GROUP_ID "${ACTIVE_GROUP_ID}" not found in COLO_GROUPS registry`);
  }
  return group;
}

// Pure config check — does ANY group in the registry have status='open'?
// Doesn't know about slot counts; callers should also check live remaining.
export function hasAnyOpenGroup(): boolean {
  return COLO_GROUPS.some(g => g.status === 'open');
}
