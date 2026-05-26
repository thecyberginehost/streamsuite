import Link from 'next/link';
import LiveBlockTicker from '../components/LiveBlockTicker';
import ColoSlots from '../components/ColoSlots';

// Note: the "slots open" position in the stats grid is rendered separately
// via <ColoSlots variant="stat" /> so it can fetch live data — it's not in
// this static array.
const stats = [
  { value: '<6ms', label: 'Server-side latency' },
  { value: '0', label: 'Rate limits' },
  { value: '1hr', label: 'Sev-1 SLA · 24/7' },
];

const specs = [
  { k: 'Server-side latency', v: '< 1ms median, < 6ms p99 (eth_call under 10-client production load)' },
  { k: 'IPC latency', v: '< 1ms median (colocation tier, benchmarked under full load)' },
  { k: 'Rate limits', v: 'None. Unlimited requests, unlimited subscriptions.' },
  { k: 'Location', v: 'Ashburn, VA. Tier-III datacenter (N+1 power & cooling, SOC 2 Type II, ISO 27001)' },
  { k: 'Operators per group', v: '10 max.' },
  { k: 'Uptime target', v: '99.9%. Bare-metal, not virtualized, not load-balanced' },
];

const products = [
  {
    tag: 'Live now',
    tagLive: true,
    title: 'BSC RPC Access',
    body: 'BSC endpoints over HTTP and WebSocket. Three access tiers: Real-Time, Mempool, and Full Node. From $399/mo.',
    cta: 'See BSC pricing',
    href: '/pricing#bsc',
  },
  {
    tag: '< 14 day delivery',
    tagLive: false,
    title: 'Custom Chain Nodes',
    body: 'Dedicated Solana, Ethereum, Base, Arbitrum, Optimism, or any EVM. Provisioned on our bare-metal hardware. You get the endpoints, we handle the ops.',
    cta: 'Request a quote',
    href: '/pricing#custom',
  },
  {
    tag: 'Research \u0026 execution',
    tagLive: false,
    title: 'Custom Builds',
    body: 'MEV research tooling, trading bots, on-chain analytics. Built to your spec in Rust or TypeScript. Optional colocation on our hardware with sub-millisecond IPC to the node.',
    cta: 'Learn more',
    href: '/pricing#builds',
  },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="pill mb-6 flex-wrap gap-x-3 gap-y-1">
            <span className="pulse-dot" />
            <span className="font-mono">ASHBURN / VA &middot; BARE METAL</span>
            <span className="hidden sm:inline text-muted/60">&middot;</span>
            <ColoSlots variant="pill" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-5xl">
            <span className="text-ink">Bare-metal blockchain</span>
            <br />
            <span className="accent-gradient">infrastructure.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
            Single-digit millisecond latency. Zero rate limits. Your edge, our iron.
          </p>

          <p className="mt-4 text-base text-muted/80 max-w-2xl">
            StreamSuite runs bare-metal infrastructure for serious operators: MEV
            searchers, arbitrage desks, market makers, liquidation bots. Not a shared cloud RPC.
            Not a freemium dashboard. Bare-metal hardware, direct endpoints, one team that answers
            on Telegram.
          </p>

          <div className="mt-8">
            <LiveBlockTicker />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pricing" className="btn-primary">
              Get started
              <span className="ml-2">&rarr;</span>
            </Link>
            <Link href="/bench" className="btn-ghost">
              Test latency from your bot &rarr;
            </Link>
          </div>

          {/* STATS */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {stats.map((s) => (
              <div key={s.label} className="bg-panel px-5 py-6">
                <div className="text-2xl md:text-3xl font-bold accent-gradient font-mono">
                  {s.value}
                </div>
                <div className="mt-1 text-xs md:text-sm text-muted uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
            <ColoSlots variant="stat" />
          </div>
          <p className="mt-4 text-xs text-muted/60 max-w-2xl">
            Latency shown is server-side processing time, benchmarked under full operator load.
            Your total round-trip latency = our processing time + your network distance to Ashburn, VA.
          </p>
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto" />

      {/* HARDWARE SPECS */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-24">
        <div className="grid md:grid-cols-5 gap-10 md:gap-16 items-start">
          <div className="md:col-span-2">
            <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
              Performance
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight">
              Benchmarked. Not estimated.
            </h2>
            <p className="mt-5 text-muted leading-relaxed">
              Every number on this page was measured under full load with all operator
              slots active. Not synthetic benchmarks, not &ldquo;up to&rdquo; marketing.
              Real traffic, real contention, real results.
            </p>
            <Link
              href="/benchmarks"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-bright transition-colors"
            >
              See the full stress-test report
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="md:col-span-3 card p-6 md:p-8">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {specs.map((s) => (
                <div key={s.k}>
                  <dt className="text-[11px] font-mono uppercase tracking-widest text-muted/80 mb-1">
                    {s.k}
                  </dt>
                  <dd className="text-sm md:text-base text-ink font-medium">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          Offerings
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-ink mb-12 max-w-2xl">
          Three ways to run on our iron.
        </h2>

        <div className="grid md:grid-cols-3 gap-5">
          {products.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="card p-6 md:p-7 flex flex-col group"
            >
              <div
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded w-fit mb-5 ${
                  p.tagLive
                    ? 'bg-accent/10 text-accent-bright border border-accent/30'
                    : 'bg-panel-2 text-muted border border-border'
                }`}
              >
                {p.tagLive && <span className="pulse-dot !w-1.5 !h-1.5" />}
                {p.tag}
              </div>
              <h3 className="text-xl font-semibold text-ink mb-3">{p.title}</h3>
              <p className="text-sm text-muted leading-relaxed flex-1">{p.body}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-accent group-hover:text-accent-bright transition-colors">
                {p.cta}
                <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* OPERATIONAL POSTURE */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="card p-6 md:p-8 border-accent/20">
          <div className="flex items-start gap-4">
            <div className="text-accent text-2xl mt-0.5">&#9670;</div>
            <div>
              <h3 className="text-lg font-semibold text-ink mb-2">Operational hardening</h3>
              <p className="text-sm text-muted leading-relaxed">
                Rate-limited reverse proxy, automated certificate management, intrusion
                detection, and DDoS mitigation at the edge. Endpoints support IP whitelisting
                on request. Same security posture serious operators would build themselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / EXCLUSIVITY */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-30 pointer-events-none" />
          <div className="relative max-w-3xl">
            <div className="pill mb-5">
              <span>Limited availability</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-ink">
              Ten operators per colocation group. When we&apos;re full, we&apos;re full.
            </h2>
            <p className="mt-5 text-muted leading-relaxed text-lg">
              We provision new hardware instead of oversubscribing existing boxes.
              That physical cap is why we can offer flat-rate pricing with no
              rate limits or overages: the hardware is never shared beyond what
              it can handle cleanly.
            </p>
            <p className="mt-3 text-muted leading-relaxed">
              If you&apos;re a retail dapp that needs 100 requests per second, you don&apos;t
              need us. There are cheaper ways to do that. If you&apos;re running infrastructure
              where a few milliseconds matters and you can&apos;t afford to be rate-limited
              mid-block, we&apos;re the right call.
            </p>
            <ColoSlots variant="card" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pricing" className="btn-primary">
                Get started
              </Link>
              <Link href="/pricing" className="btn-ghost">
                See full pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
