import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing \u2014 StreamSuite',
  description:
    'Dedicated BSC RPC pricing. Real-Time ($399/mo), Mempool ($999/mo), Full Node ($2,499/mo). Custom chain nodes from $599/mo. Colocated bots from $5,000. Card and crypto accepted.',
};

type Tier = {
  id: string;
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
    name: 'Real-Time',
    price: '$399',
    period: '/ mo',
    tagline: 'HTTP + WebSocket. No limits.',
    best: 'DApp backends, analytics, research, indexing',
    features: [
      'HTTP + WebSocket endpoints',
      'No rate limits, no request caps',
      'All standard methods (eth_*, net_*, web3_*)',
      'eth_call, eth_estimateGas, eth_sendRawTransaction',
      'newHeads and logs subscriptions',
      '~32 days block & log history',
      '~5 days receipt history',
      'Email support',
    ],
    support: 'Email',
    cta: 'Get Started',
  },
  {
    id: 'mempool',
    name: 'Mempool',
    price: '$999',
    period: '/ mo',
    tagline: 'Pending tx stream. For searchers.',
    best: 'MEV searchers, arbitrage bots, sniper bots, liquidation bots',
    features: [
      'Everything in Real-Time',
      'txpool_content, txpool_inspect, txpool_status',
      'pendingTransactions WebSocket subscription',
      'Direct Telegram / Discord support',
      'Priority response < 2h business hours',
    ],
    support: 'Telegram / Discord',
    highlighted: true,
    cta: 'Get Started',
  },
  {
    id: 'fullnode',
    name: 'Full Node',
    price: '$2,499',
    period: '/ mo',
    tagline: 'Trace access. Priority delivery.',
    best: 'Advanced MEV, protocol research, custom tracing',
    features: [
      'Everything in Mempool',
      'debug_traceTransaction on recent blocks',
      'Priority block delivery',
      'Direct Telegram to operator',
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

function TierCard({ t }: { t: Tier }) {
  return (
    <div
      className={`card p-7 flex flex-col ${
        t.highlighted ? 'border-accent/40 shadow-glow relative' : ''
      }`}
    >
      {t.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 pill !bg-accent !text-bg !border-accent">
          Most popular
        </div>
      )}
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xl font-semibold text-ink">{t.name}</h3>
      </div>
      <p className="text-sm text-muted mb-6">{t.tagline}</p>

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

      <Link
        href={`/request-access?plan=bsc-${t.id}`}
        className={t.highlighted ? 'btn-primary w-full' : 'btn-ghost w-full'}
      >
        {t.cta}
      </Link>
    </div>
  );
}

const paymentChains = ['Ethereum', 'BSC', 'Base', 'Arbitrum', 'Optimism'];
const paymentTokens = ['USDC', 'USDT', 'ETH', 'BNB'];

export default function Pricing() {
  return (
    <>
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="pill mb-5">
          <span>Pricing</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink max-w-3xl">
          Dedicated infrastructure.{' '}
          <span className="accent-gradient">Honest pricing.</span>
        </h1>
        <p className="mt-5 text-lg text-muted max-w-2xl">
          No seat fees. No compute units. No overages. Flat monthly rate, unlimited requests.
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
              levels. Same hardware, same zero rate limits across all tiers. Latency shown is server-side processing time — your total round-trip depends on your network distance to Ashburn, VA. Active colocation group with open slots — typical provisioning in under an hour.
            </p>
          </div>
          <div className="text-right text-xs text-muted font-mono">va-bsc-01.streamsuite.io</div>
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
                Every tier is unmetered &mdash; no rate limits, no compute units, no overages.
                The number you see is the number you pay. Month-to-month, cancel anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-5">
          {bscTiers.map((t) => (
            <TierCard key={t.id} t={t} />
          ))}
        </div>
      </section>


      {/* NO-LIMITS FAQ */}
      <section className="max-w-7xl mx-auto px-6 py-10 scroll-mt-20">
        <div className="card p-6 md:p-8">
          <h3 className="text-lg font-semibold text-ink mb-3">
            &ldquo;What if I go over some limit?&rdquo;
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            You won&apos;t &mdash; there isn&apos;t one. No rate limits, no request caps, no CUs.
            We&apos;d rather sell you a tier that fits your workload than bill you
            extra when you exceed it. The tiers differ by which methods are
            exposed and support level, not by volume.
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
            server &mdash; not a shared multi-tenant cloud instance. Each group has
            its own designated hostname (e.g., va-bsc-01.streamsuite.io), a
            known capacity ceiling, and measured performance characteristics
            under full load. Customers know which group they&apos;re on. When a
            group fills, we bring up a new one rather than squeezing more
            operators onto existing hardware.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Dedicated (single-tenant) hardware is available separately for
            Custom Builds and colocated bot hosting.
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
              dedicated hardware and give you the endpoints. Same iron as BSC — bare-metal,
              NVMe, Ashburn. No rate limits.
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
              From MEV research tooling to production trading bots. Tell us what you need &mdash;
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
                  Arbitrage, liquidation, sniping, market making &mdash; whatever the strategy.
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
                  machine as the RPC. Unix socket IPC. Sub-millisecond round trip &mdash; benchmarked under full operator load. Faster than
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
                Card or crypto. Your call.
              </h2>
              <p className="text-muted leading-relaxed">
                Pay by credit card for automatic monthly billing, or pay in crypto on any major
                EVM chain. One deposit address — send on the chain that&apos;s cheapest for you.
              </p>
            </div>
            <div className="grid gap-5">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">
                  Card payments
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
                  Crypto tokens
                </div>
                <div className="flex flex-wrap gap-2">
                  {paymentTokens.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 rounded-md font-mono text-sm bg-panel-2 border border-border text-ink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">
                  Crypto chains
                </div>
                <div className="flex flex-wrap gap-2">
                  {paymentChains.map((c) => (
                    <span
                      key={c}
                      className="px-3 py-1.5 rounded-md font-mono text-sm bg-panel-2 border border-border text-ink"
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
              href="mailto:hello@streamsuite.io"
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
