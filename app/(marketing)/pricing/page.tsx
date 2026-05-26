import Link from 'next/link';
import LatencyTester from "../../components/LatencyTester";
import ColoSlots from "../../components/ColoSlots";
import type { Metadata } from 'next';
import { getSessionEmail } from '@/lib/auth';
import { getCustomerByEmail, getAcceptingGroup, getColoGroupCountsByTier } from '@/lib/db';
import { getActiveGroup } from '@/lib/colo-groups';

export const dynamic = 'force-dynamic';   // need session lookup per request

export const metadata: Metadata = {
  title: 'Pricing | StreamSuite',
  description:
    'Bare-metal BSC RPC pricing. Real-Time ($399/mo), Mempool ($999/mo), Full Node ($2,499/mo). Custom chain nodes from $599/mo. Colocated bots from $5,000. Card and crypto accepted.',
};

type Tier = {
  id: string;
  link: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  best: string;
  features: string[];
  support: string;
  highlighted?: boolean;
  cta: string;
};

const bscTiers: Tier[] = [
  {
    id: 'realtime',
    link: 'https://buy.stripe.com/6oU8wPcfublja3W57waVa00',
    name: 'Real-Time',
    price: '$399',
    period: '/ mo',
    tagline: 'HTTP + WebSocket. No limits.',
    best: 'DApp backends, analytics, research, indexing',
    features: [
      'HTTP + WebSocket endpoints',
      'All standard methods (eth_*, net_*, web3_*)',
      'eth_call, eth_estimateGas, eth_sendRawTransaction',
      'newHeads and logs subscriptions',
      '~4.5 days block, log & receipt history (last 900k blocks)',
      '10 concurrent connections (HTTP + WS combined)',
      'Email support',
    ],
    support: 'Email',
    cta: 'Get Started',
  },
  {
    id: 'mempool',
    link: 'https://buy.stripe.com/00w7sLdjyahf6RKeI6aVa01',
    name: 'Mempool',
    price: '$999',
    period: '/ mo',
    tagline: 'Pending tx stream. For searchers.',
    best: 'MEV searchers, arbitrage bots, sniper bots, liquidation bots',
    features: [
      'Everything in Real-Time',
      'txpool_content, txpool_inspect, txpool_status',
      'newPendingTransactions WebSocket subscription (hashes or full tx objects)',
      '20 concurrent connections (HTTP + WS combined)',
      'Direct Telegram / Discord support (contact sent in welcome email)',
      'Priority response < 4 business hours',
    ],
    support: 'Telegram / Discord',
    highlighted: true,
    cta: 'Get Started',
  },
  {
    id: 'fullnode',
    link: 'https://buy.stripe.com/eVqaEXgvKgFDb80gQeaVa02',
    name: 'Full Node',
    price: '$2,499',
    period: '/ mo',
    tagline: 'Trace access. Priority delivery.',
    best: 'Advanced MEV, protocol research, custom tracing',
    features: [
      'Everything in Mempool',
      'debug_traceTransaction on the last ~128 blocks (~60 sec, chain-tip only)',
      'Sole debug-access tenant: only 1 Full Node customer per server',
      '30 concurrent connections (HTTP + WS combined)',
      'Need deeper trace history? Ask about the Archive add-on',
      'Direct Telegram to operator (contact sent in welcome email)',
      'Hardware-level diagnostics on request',
    ],
    support: 'Direct Telegram',
    cta: 'Get Started',
  },
];

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent flex-shrink-0 mt-0.5"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TierCard({
  t,
  activeTier,
  hasActiveSub,
  signupsBlocked,
  fullnodeAvailable,
  fullnodeCap,
  fullnodeUsed,
}: {
  t: Tier;
  activeTier?: string;
  hasActiveSub: boolean;
  signupsBlocked: boolean;
  fullnodeAvailable: boolean;
  fullnodeCap: number;
  fullnodeUsed: number;
}) {
  // Replace Stripe checkout CTA with dashboard link when the visitor already
  // has an active subscription — prevents accidental double-buys.
  //
  // Capacity gating happens at two levels:
  //   1. signupsBlocked: no colo group is currently 'open' with any slot →
  //      ALL tier CTAs swap to waitlist mailto.
  //   2. fullnode tier has its own hard cap (1 per box) because two debug
  //      tenants demonstrably lock geth — even if a group is otherwise
  //      open, Full Node tier alone can be sold out.
  const isCurrentTier = activeTier === t.id;
  const isFullNode = t.id === 'fullnode';
  const fullNodeSoldOut = isFullNode && !fullnodeAvailable;
  const showWaitlist = (signupsBlocked && !hasActiveSub) || (fullNodeSoldOut && !hasActiveSub);

  let ctaHref: string;
  let ctaLabel: string;
  if (isCurrentTier) {
    ctaHref = '/dashboard';
    ctaLabel = '✓ Current plan';
  } else if (hasActiveSub) {
    ctaHref = '/dashboard';
    ctaLabel = 'Manage subscription →';
  } else if (showWaitlist) {
    const subject = `Waitlist — ${t.name} tier`;
    const body = fullNodeSoldOut && !signupsBlocked
      ? `Hi — the Full Node slot on the current colocation group is taken. I'd like to be on the waitlist for the next opening (either when the current tenant leaves or when the next colocation group goes live).`
      : `Hi — I'd like to be notified when a new colocation group opens for the ${t.name} tier.`;
    ctaHref = `mailto:support@streamsuite.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    ctaLabel = 'Join waitlist →';
  } else {
    ctaHref = t.link;
    ctaLabel = t.cta;
  }

  const ctaClass = isCurrentTier
    ? 'btn-ghost w-full !opacity-70 !cursor-default pointer-events-none'
    : showWaitlist
      ? 'btn-ghost w-full'
      : t.highlighted
        ? 'btn-primary w-full'
        : 'btn-ghost w-full';

  return (
    <div
      className={`card p-7 flex flex-col ${
        t.highlighted ? 'border-accent/40 shadow-glow relative' : ''
      } ${isCurrentTier ? 'border-accent/60' : ''}`}
    >
      {t.highlighted && !isCurrentTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 pill !bg-accent !text-bg !border-accent">
          Most popular
        </div>
      )}
      {isCurrentTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 pill !bg-accent !text-bg !border-accent">
          Your plan
        </div>
      )}
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xl font-semibold text-ink">{t.name}</h3>
      </div>
      <p className="text-sm text-muted mb-3">{t.tagline}</p>

      {isFullNode && (
        <div
          className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded w-fit mb-3 border ${
            fullnodeAvailable
              ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
              : 'bg-red-400/10 text-red-400 border-red-400/30'
          }`}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              fullnodeAvailable
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]'
            }`}
          />
          {fullnodeUsed} of {fullnodeCap} Full Node slots · {fullnodeAvailable ? 'Available' : 'Taken'}
        </div>
      )}

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-4xl font-bold text-ink font-mono">{t.price}</span>
        <span className="text-muted text-sm">{t.period}</span>
      </div>
      <div className="text-xs text-muted mb-7">Billed monthly. Cancel anytime.</div>

      <ul className="flex flex-col gap-2.5 mb-8 flex-1">
        {t.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-ink/90 leading-snug">
            <Check />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="text-xs text-muted mb-5 pt-5 border-t border-border">
        <span className="font-mono uppercase tracking-wider text-muted/70">Best for:</span>{' '}
        <span className="text-ink/80">{t.best}</span>
      </div>

      <Link href={ctaHref} className={ctaClass}>
        {ctaLabel}
      </Link>

      {/* Crypto status — "coming soon" while NOWPayments integration is in
          final testing. Link still goes to /checkout/crypto/[tier] which now
          serves a waitlist page (preserves the URL for inbound search +
          early-interest capture). Re-enable as a live CTA once verified. */}
      {!isCurrentTier && !hasActiveSub && !showWaitlist && (
        <Link
          href={`/checkout/crypto/${t.id}`}
          className="block w-full text-center mt-2 text-[11px] text-muted/70 hover:text-muted underline-offset-2 hover:underline transition-colors"
        >
          crypto payment · coming soon →
        </Link>
      )}
    </div>
  );
}

const paymentChains = ['Ethereum', 'BSC', 'Base', 'Arbitrum', 'Optimism'];
const paymentTokens = ['USDC', 'USDT', 'ETH', 'BNB'];

export default async function Pricing() {
  // Per-request session lookup. If signed-in customer already has an active
  // (or grace-period past_due) subscription, swap the Stripe Payment Link
  // CTAs for a dashboard link. Stops accidental double-purchases — Payment
  // Links create a fresh Stripe Customer per checkout regardless of email
  // match, so two clicks = two subs billing the same person.
  const sessionEmail = await getSessionEmail();
  const existing = sessionEmail ? getCustomerByEmail(sessionEmail) : null;
  const hasActiveSub = !!(existing && (existing.status === 'active' || existing.status === 'past_due'));
  const activeTier = hasActiveSub ? existing!.tier : undefined;

  // Capacity gate: if no colo group is currently 'open' AND has slot capacity,
  // signups are blocked. TierCard swaps Stripe payment links for waitlist
  // mailto CTAs. Existing customers keep their dashboard access either way.
  //
  // Full Node tier has its own hard cap (1 per box). The fullnode-tier-aware
  // accepting check uses tier='fullnode' so the badge / waitlist gate fires
  // independently of overall group capacity.
  const acceptingGroup = getAcceptingGroup();
  const acceptingGroupForFullNode = getAcceptingGroup('fullnode');
  const signupsBlocked = acceptingGroup === null;
  const fullnodeAvailable = acceptingGroupForFullNode !== null;
  // For the visible "X of N Full Node slots" badge we show the cap + used
  // count of the configured ACTIVE group (the one new signups will land on),
  // regardless of which group ended up acceptingGroupForFullNode.
  const activeGroup = getActiveGroup();
  const fullnodeCap = activeGroup.tier_caps.fullnode;
  const fullnodeUsedRow = getColoGroupCountsByTier().find(
    r => r.colo_group === activeGroup.id && r.tier === 'fullnode'
  );
  const fullnodeUsed = fullnodeUsedRow?.active_count ?? 0;

  return (
    <>
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="pill mb-5">
          <span>Pricing</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink max-w-3xl">
          Bare-metal infrastructure.{' '}
          <span className="accent-gradient">Honest pricing.</span>
        </h1>
        <p className="mt-5 text-lg text-muted max-w-2xl">
          No seat fees. No compute units. No overages. Flat monthly rate, unlimited requests.
        </p>
      </section>


      {/* LATENCY TESTER — public, no signup */}
      <section className="max-w-7xl mx-auto px-6 py-8 md:py-10">
        <LatencyTester />
        <p className="mt-4 text-xs sm:text-sm text-muted leading-relaxed max-w-2xl">
          Quick check via your browser — adds ~1–3 ms of JS overhead and can't separate
          network from server-side latency. For the SLA-grade measurement, run our CLI:{' '}
          <Link href="/bench" className="text-accent hover:text-accent-bright underline underline-offset-2">
            streamsuite-bench &rarr;
          </Link>
        </p>
      </section>
      {/* BSC TIERS */}
      <section id="bsc" className="max-w-7xl mx-auto px-6 py-10 scroll-mt-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
              BSC RPC &middot; Live now
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-ink">BNB Chain endpoints</h2>
            <p className="text-muted text-sm mt-2 max-w-xl">
              Bare-metal BSC infrastructure. Each tier unlocks additional methods and support
              levels. Latency shown is server-side processing time. Your total round-trip depends on your network distance to Ashburn, VA. Active colocation group with open slots. Typical provisioning in under an hour.
            </p>
          </div>
          <div className="text-right text-xs text-muted font-mono flex flex-col items-end gap-1">
            <span>va-bsc-01.streamsuite.io</span>
            <ColoSlots variant="inline" />
          </div>
        </div>

        {/* FLAT-RATE CALLOUT */}
        <div className="card p-5 md:p-6 border-accent/30 bg-accent/5 mb-8 mt-4">
          <div className="flex items-start gap-3">
            <div className="text-accent text-xl mt-0.5 font-bold font-mono">&#9670;</div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-accent mb-1.5">
                Flat monthly rate
              </div>
              <p className="text-sm text-ink/90 leading-relaxed">
                Every tier is unmetered. No rate limits, no compute units, no overages.
                The number you see is the number you pay. Month-to-month, cancel anytime.
              </p>
            </div>
          </div>
        </div>

        {signupsBlocked && !hasActiveSub && (
          <div className="card p-5 md:p-6 border-amber-500/40 bg-amber-500/[0.04] mb-8">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-xl leading-none mt-0.5">⚠</span>
              <div className="text-sm leading-relaxed">
                <p className="font-semibold text-ink mb-1">All current colocation slots are full.</p>
                <p className="text-muted">
                  We don&apos;t oversubscribe. A new bare-metal server is being
                  provisioned (typically 1&ndash;2 weeks) — until it&apos;s live,
                  signups are paused. Click any tier to join the waitlist
                  for that price and we&apos;ll email you the moment a slot
                  opens.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 md:gap-5">
          {bscTiers.map((t) => (
            <TierCard
              key={t.id}
              t={t}
              activeTier={activeTier}
              hasActiveSub={hasActiveSub}
              signupsBlocked={signupsBlocked}
              fullnodeAvailable={fullnodeAvailable}
              fullnodeCap={fullnodeCap}
              fullnodeUsed={fullnodeUsed}
            />
          ))}
        </div>

        {/* Full Node single-tenant rationale */}
        <div className="card p-5 md:p-6 mt-6 border-accent/20">
          <div className="flex items-start gap-3">
            <div className="text-accent text-lg mt-0.5 font-mono">&#9670;</div>
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-ink mb-1">
                Why Full Node is capped at 1 per server.
              </p>
              <p className="text-muted">
                Two concurrent <code className="font-mono text-accent">debug_traceTransaction</code> tenants
                contend on geth&apos;s state trie hard enough to introduce ~hundreds of ms
                of cross-talk on every RPC method &mdash; we benchmarked it. So the
                Full Node tier gets the entire debug surface to itself, and the
                price reflects single-tenant economics: pays for the box and
                still leaves room for the 9 lighter operators to share the rest.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* NO-LIMITS FAQ */}
      <section className="max-w-7xl mx-auto px-6 py-10 scroll-mt-20">
        <div className="card p-6 md:p-8">
          <h3 className="text-lg font-semibold text-ink mb-3">
            &ldquo;What if I go over some limit?&rdquo;
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            No rate limits, no request caps, no compute-unit math. Fire as many
            requests per second as your bot can handle &mdash; we don&apos;t meter
            volume, we don&apos;t bill overages, and you won&apos;t get throttled.
          </p>
          <p className="text-sm text-muted leading-relaxed mt-3">
            The one cap that exists is on <span className="text-ink">simultaneous
            connections</span> per API key (10 / 20 / 30 depending on tier) &mdash;
            pure anti-abuse so one bad actor can&apos;t hog the node. A normal
            single-bot setup uses 5&ndash;11 connections, well under every cap.
            If you genuinely need more concurrent connections than the Full
            Node tier provides, ask about a <span className="text-ink">dedicated
            server</span> (unlisted tier, contact us).
          </p>
        </div>
      </section>

      {/* COLOCATION GROUPS EXPLAINED */}
      <section className="max-w-7xl mx-auto px-6 py-10 scroll-mt-20">
        <div className="card p-6 md:p-8">
          <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
            Architecture
          </div>
          <h3 className="text-xl font-semibold text-ink mb-4">
            Colocation groups, explained.
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            We use the term &ldquo;colocation group&rdquo; deliberately. It means a capped
            cohort of operators physically colocated on the same bare-metal
            server. Not a shared multi-tenant cloud instance.
          </p>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Each group has its own designated hostname (e.g., va-bsc-01.streamsuite.io),
            a known capacity ceiling, and measured performance characteristics
            under full load. Customers know which group they&apos;re on.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            When a group fills, we bring up a new one rather than squeezing more
            operators onto existing hardware. Dedicated (single-tenant) hardware is
            available separately for Custom Builds and colocated bot hosting.
          </p>
        </div>
      </section>

      {/* CUSTOM CHAIN */}
      <section id="custom" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="card p-8 md:p-10 grid md:grid-cols-5 gap-8 items-center">
          <div className="md:col-span-3">
            <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
              Custom chain nodes
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-ink mb-4">
              Dedicated node, your chain, 14 days.
            </h2>
            <p className="text-muted leading-relaxed mb-5">
              Solana, Ethereum, Base, Arbitrum, Optimism, or any EVM chain. We provision
              dedicated hardware and give you the endpoints. Same iron as BSC. Bare-metal,
              NVMe, Ashburn.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 text-sm">
              {['Solana', 'Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Any EVM, ask'].map(
                (c) => (
                  <li key={c} className="flex items-center gap-2 text-ink/90">
                    <Check /> {c}
                  </li>
                )
              )}
            </ul>
            <Link href="/request-access?plan=custom-chain" className="btn-primary">
              Request a Quote
            </Link>
          </div>
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="card !border-accent/20 p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-muted mb-1">
                Starting at
              </div>
              <div className="text-4xl font-bold font-mono text-ink">
                $599<span className="text-base text-muted font-normal"> / mo</span>
              </div>
              <div className="text-xs text-muted mt-2">
                Pricing varies by chain. Heavier chains (Solana, Ethereum archive) cost more.
              </div>
            </div>
            <div className="card !border-accent/20 p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-muted mb-1">
                Delivery
              </div>
              <div className="text-ink font-medium">Under 14 days</div>
              <div className="text-xs text-muted mt-1">
                From request to live endpoints. Usually faster.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOM BUILDS */}
      <section id="builds" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="card p-8 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-20 pointer-events-none" />
          <div className="relative">
            <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
              Custom builds &middot; Research &amp; execution
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-ink mb-4">
              We build it. You run it.
            </h2>
            <p className="text-muted leading-relaxed mb-8 max-w-3xl">
              From MEV research tooling to production trading bots. Tell us what you need.
              we scope it, build it, and optionally run it on our hardware with sub-millisecond IPC
              to the node. No network hops between your bot and the chain.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="card !bg-bg p-6">
                <div className="text-xs font-mono uppercase tracking-wider text-accent mb-3">
                  Research tooling
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">Custom analysis</h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  Mempool analytics, MEV opportunity scanners, token flow tracers,
                  on-chain forensics, backtest frameworks. Built to your spec against
                  live or historical chain data.
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>Mempool pattern detection</span></li>
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>MEV opportunity analysis</span></li>
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>Token flow &amp; wallet tracing</span></li>
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>Historical backtest engines</span></li>
                </ul>
              </div>

              <div className="card !bg-bg p-6">
                <div className="text-xs font-mono uppercase tracking-wider text-accent mb-3">
                  Bot development
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">Custom bots</h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  Arbitrage, liquidation, sniping, market making. Whatever the strategy.
                  Built in Rust or TypeScript, optimized for your edge, delivered
                  production-ready.
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>Strategy-specific architecture</span></li>
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>Rust or TypeScript</span></li>
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>Telegram/Discord controls</span></li>
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>PnL tracking &amp; dashboards</span></li>
                </ul>
              </div>

              <div className="card !bg-bg !border-accent/30 p-6">
                <div className="text-xs font-mono uppercase tracking-wider text-accent mb-3">
                  Colocation
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">Run on our iron</h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  Deploy your bot in an isolated Docker container on the same physical
                  machine as the RPC. Unix socket IPC. Sub-millisecond round trip, benchmarked under full operator load. Faster than
                  HTTP localhost. 3 IPC slots per colocation group.
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>sub-millisecond IPC to the node</span></li>
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>Dedicated CPU cores &amp; RAM</span></li>
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>Your keys stay in your container</span></li>
                  <li className="flex items-start gap-2 text-ink/90"><Check /><span>Start, stop, adjust via Telegram</span></li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="card !border-accent/20 p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-muted mb-1">
                  Research &amp; bot builds
                </div>
                <div className="text-3xl font-bold font-mono text-ink">
                  $5,000 &ndash; $10,000
                </div>
                <div className="text-xs text-muted mt-2">
                  One-time. Scoped per project. Fixed quote before we start.
                </div>
              </div>
              <div className="card !border-accent/20 p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-muted mb-1">
                  Colocation hosting
                </div>
                <div className="text-3xl font-bold font-mono text-ink">
                  $2,999<span className="text-base text-muted font-normal"> / mo</span>
                </div>
                <div className="text-xs text-muted mt-2">
                  Dedicated cores, RAM, IPC access. No additional RPC fees. Limited to 3 IPC slots per colocation group.
                </div>
              </div>
              <div className="card !border-accent/20 p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-muted mb-1">
                  Delivery
                </div>
                <div className="text-ink font-medium text-lg">Under 14 days</div>
                <div className="text-xs text-muted mt-2">
                  From scope agreement to production. Usually faster.
                </div>
              </div>
            </div>

            <Link href="/request-access?plan=colocated-bot" className="btn-primary">
              Request a Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* PAYMENT */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="card p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
                Payment
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-ink mb-3">
                Card now. Crypto next.
              </h2>
              <p className="text-muted leading-relaxed">
                Card billing live today &mdash; Visa, Mastercard, Amex via Stripe,
                automatic monthly renewal, cancel anytime. Crypto checkout
                (one-time 30-day windows on major EVM chains) is in final
                testing &mdash;{' '}
                <Link href="/checkout/crypto/realtime" className="text-accent hover:text-accent-bright underline-offset-2 hover:underline">
                  join the crypto waitlist
                </Link>{' '}
                and we&apos;ll email when it goes live (target: next 2 weeks).
              </p>
            </div>
            <div className="grid gap-5">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">
                  Card payments &middot; <span className="text-accent">live</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-md font-mono text-sm bg-panel-2 border border-border text-ink">
                    Visa
                  </span>
                  <span className="px-3 py-1.5 rounded-md font-mono text-sm bg-panel-2 border border-border text-ink">
                    Mastercard
                  </span>
                  <span className="px-3 py-1.5 rounded-md font-mono text-sm bg-panel-2 border border-border text-ink">
                    Amex
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">
                  Crypto tokens &middot; <span className="text-amber-400/80">coming soon</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {paymentTokens.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 rounded-md font-mono text-sm bg-panel-2 border border-border/60 text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">
                  Crypto chains &middot; <span className="text-amber-400/80">coming soon</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {paymentChains.map((c) => (
                    <span
                      key={c}
                      className="px-3 py-1.5 rounded-md font-mono text-sm bg-panel-2 border border-border/60 text-muted"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON FOOTER */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <p className="text-muted">
            Still deciding?{' '}
            <Link href="/docs" className="text-accent hover:text-accent-bright">
              Read the docs
            </Link>{' '}
            or{' '}
            <a
              href="mailto:support@streamsuite.io"
              className="text-accent hover:text-accent-bright"
            >
              email us directly
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
