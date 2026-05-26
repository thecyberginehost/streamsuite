import type { Metadata } from 'next';
import Link from 'next/link';
import ColoSlots from '../../components/ColoSlots';

export const metadata: Metadata = {
  title: 'Stress Test Benchmarks | StreamSuite',
  description:
    'StreamSuite BSC RPC stress test: 10-client synthetic load against a production-configured BSC full node. p50, p99, cross-talk analysis, and full methodology.',
};

type Row = { method: string; n: string; p50: string; p90: string; p95: string; p99: string; p999: string; max: string; jitter: string };

// ── Group A — 1× Tier-3 Full Node ($2,499/mo) ──────────────────────────────
const GROUP_A: Row[] = [
  { method: 'debug_traceTransaction', n: '8,030',  p50: '6.41ms',  p90: '13.37ms', p95: '15.78ms', p99: '20.94ms', p999: '31.53ms', max: '44.15ms', jitter: '1.94ms' },
  { method: 'eth_call',               n: '300',    p50: '0.24ms',  p90: '0.34ms',  p95: '0.39ms',  p99: '0.50ms',  p999: '1.15ms',  max: '1.15ms',  jitter: '0.04ms' },
];

// ── Group B — 3× Tier-2 Mempool ($999/mo) ──────────────────────────────────
const GROUP_B: Row[] = [
  { method: 'eth_call',                 n: '2,688', p50: '0.23ms', p90: '0.33ms', p95: '0.37ms', p99: '0.43ms', p999: '1.74ms', max: '1.88ms', jitter: '0.01ms' },
  { method: 'eth_getTransactionReceipt', n: '900',  p50: '0.20ms', p90: '0.34ms', p95: '0.42ms', p99: '0.69ms', p999: '1.54ms', max: '1.54ms', jitter: '0.02ms' },
  { method: 'eth_sendRawTransaction',    n: '18',   p50: '0.17ms', p90: '0.25ms', p95: '0.26ms', p99: '0.26ms', p999: '0.26ms', max: '0.26ms', jitter: '0.04ms' },
];

// ── Group C — 6× Tier-1 Real-Time ($399/mo) ────────────────────────────────
const GROUP_C: Row[] = [
  { method: 'eth_call',                n: '1,080', p50: '0.22ms', p90: '0.33ms', p95: '0.37ms',  p99: '0.51ms',   p999: '1.12ms',  max: '1.16ms',  jitter: '0.02ms' },
  { method: 'eth_getBalance',          n: '360',   p50: '0.16ms', p90: '0.25ms', p95: '0.27ms',  p99: '0.41ms',   p999: '0.60ms',  max: '0.60ms',  jitter: '0.04ms' },
  { method: 'eth_getLogs',             n: '72',    p50: '0.30ms', p90: '0.50ms', p95: '20.69ms', p99: '20.82ms',  p999: '20.82ms', max: '20.82ms', jitter: '5.64ms' },
  { method: 'eth_getTransactionCount', n: '360',   p50: '0.15ms', p90: '0.20ms', p95: '0.22ms',  p99: '0.26ms',   p999: '0.29ms',  max: '0.29ms',  jitter: '0.02ms' },
];

const CROSSTALK = [
  { group: 'Group A — 1× Full Node ($2,499/mo) — heavy debug',  p50: '0.24ms', p99: '0.50ms' },
  { group: 'Group B — 3× Mempool ($999/mo)',                    p50: '0.24ms', p99: '0.43ms' },
  { group: 'Group C — 6× Real-Time ($399/mo)',                  p50: '0.22ms', p99: '0.60ms' },
];

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-panel-2 text-left text-[10px] sm:text-[11px] uppercase tracking-wider text-muted font-mono">
              <th className="px-3 sm:px-4 py-2.5">Method</th>
              <th className="px-2 sm:px-3 py-2.5 text-right">n</th>
              <th className="px-2 sm:px-3 py-2.5 text-right">p50</th>
              <th className="px-2 sm:px-3 py-2.5 text-right hidden sm:table-cell">p90</th>
              <th className="px-2 sm:px-3 py-2.5 text-right">p95</th>
              <th className="px-2 sm:px-3 py-2.5 text-right">p99</th>
              <th className="px-2 sm:px-3 py-2.5 text-right hidden md:table-cell">p99.9</th>
              <th className="px-2 sm:px-3 py-2.5 text-right">max</th>
              <th className="px-2 sm:px-3 py-2.5 text-right hidden md:table-cell">jitter</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.method} className="border-b border-border/60 last:border-b-0">
                <td className="px-3 sm:px-4 py-2 font-mono text-accent-bright whitespace-nowrap">{r.method}</td>
                <td className="px-2 sm:px-3 py-2 text-right text-muted font-mono">{r.n}</td>
                <td className="px-2 sm:px-3 py-2 text-right text-ink font-mono">{r.p50}</td>
                <td className="px-2 sm:px-3 py-2 text-right text-ink font-mono hidden sm:table-cell">{r.p90}</td>
                <td className="px-2 sm:px-3 py-2 text-right text-ink font-mono">{r.p95}</td>
                <td className="px-2 sm:px-3 py-2 text-right text-ink font-mono">{r.p99}</td>
                <td className="px-2 sm:px-3 py-2 text-right text-ink font-mono hidden md:table-cell">{r.p999}</td>
                <td className="px-2 sm:px-3 py-2 text-right text-muted font-mono">{r.max}</td>
                <td className="px-2 sm:px-3 py-2 text-right text-muted font-mono hidden md:table-cell">{r.jitter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Benchmarks() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-16 pb-24 md:pt-20">
      {/* HERO */}
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80 mb-3">
        ┌── stress test ──┐
      </p>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink mb-5">
        10-client stress test
      </h1>
      <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
        Synthetic load test against a production-configured BSC full node.
        Ten simulated operators &mdash; one Full Node, three Mempool, six
        Real-Time &mdash; pounding the box for 60 seconds after a 2-minute
        warmup. Real numbers, real contention, real cross-talk.
      </p>

      {/* DISCLOSURE BAR */}
      <div className="card p-4 sm:p-5 mt-8 border-amber-500/40 bg-amber-500/[0.04]">
        <div className="flex items-start gap-3">
          <span className="text-amber-400 text-lg leading-none mt-0.5">⚠</span>
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-ink mb-1">This is a stress test, not production telemetry.</p>
            <p className="text-muted">
              Load was generated by a Go harness on the production box itself
              (no network/TLS overhead). Ten concurrent &ldquo;clients&rdquo; are
              simulated goroutines. Real customer traffic adds your network
              distance to Ashburn, VA plus TLS overhead (~0.5&ndash;2ms for most
              connections). This page exists so you can verify the claims on
              the rest of the site against real measured numbers.
            </p>
          </div>
        </div>
      </div>

      {/* TEST CONDITIONS */}
      <section className="mt-12">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Conditions</h2>
        <div className="card p-5 sm:p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {[
              ['Date',           '2026-05-17 01:11 UTC'],
              ['Test duration',  '60s (after 2-min warmup)'],
              ['Hardware',       'Dedicated bare-metal, NVMe storage, 10 GbE uplink'],
              ['Location',       'Ashburn, VA · Tier-III datacenter'],
              ['BSC client',     'geth, pruning mode, ~440ms blocks'],
              ['Clients',        '10 simulated operators (1×A + 3×B + 6×C)'],
              ['Harness',        'Go, persistent HTTP/WS connections, ns-resolution timestamps'],
              ['Transport',      'HTTP + WebSocket via loopback (no nginx/TLS)'],
              ['Errors',         '0'],
              ['WS reconnects',  '0'],
              ['Missed blocks',  '0'],
              ['Dropped subs',   '0'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-mono uppercase tracking-widest text-muted/80 mb-0.5">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* GROUP A */}
      <section className="mt-12">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Group A</h2>
        <h3 className="text-xl sm:text-2xl font-semibold text-ink mb-2">
          1× Full Node ($2,499/mo) — trace every tx every block
        </h3>
        <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
          Worst-case Tier-3 customer: WebSocket subscribes to <code className="font-mono text-accent">newHeads</code>,
          fetches every tx in every block, fans out{' '}
          <code className="font-mono text-accent">debug_traceTransaction</code> across
          8 concurrent worker goroutines. Forensic indexer / heavy MEV analyst pattern.
        </p>
        <Table rows={GROUP_A} />
      </section>

      {/* GROUP B */}
      <section className="mt-12">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Group B</h2>
        <h3 className="text-xl sm:text-2xl font-semibold text-ink mb-2">3× Mempool ($999/mo)</h3>
        <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
          MEV searcher / arbitrage bot pattern: <code className="font-mono text-accent">eth_call</code> &middot;{' '}
          <code className="font-mono text-accent">eth_getTransactionReceipt</code> &middot;{' '}
          <code className="font-mono text-accent">eth_sendRawTransaction</code> plus pending-tx WS subscriptions.
        </p>
        <Table rows={GROUP_B} />
      </section>

      {/* GROUP C */}
      <section className="mt-12">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Group C</h2>
        <h3 className="text-xl sm:text-2xl font-semibold text-ink mb-2">6× Real-Time ($399/mo)</h3>
        <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
          DApp backend / indexer pattern: <code className="font-mono text-accent">eth_call</code> &middot;{' '}
          <code className="font-mono text-accent">eth_getBalance</code> &middot;{' '}
          <code className="font-mono text-accent">eth_getLogs</code> &middot;{' '}
          <code className="font-mono text-accent">eth_getTransactionCount</code>.
        </p>
        <Table rows={GROUP_C} />
      </section>

      {/* CROSS-TALK */}
      <section className="mt-14">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Cross-talk</h2>
        <h3 className="text-xl sm:text-2xl font-semibold text-ink mb-2">
          Does heavy debug load slow other tiers?
        </h3>
        <p className="text-sm text-muted mb-5 leading-relaxed max-w-3xl">
          The same method (<code className="font-mono text-accent">eth_call</code>) measured
          simultaneously across all three groups. If the Full Node tenant&apos;s heavy
          tracing degraded shared resources, you&apos;d see latency climb in Groups B and C.
          It doesn&apos;t.
        </p>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel-2 text-left text-[11px] uppercase tracking-wider text-muted font-mono">
                  <th className="px-4 py-3">Group</th>
                  <th className="px-3 py-3 text-right">eth_call p50</th>
                  <th className="px-3 py-3 text-right">eth_call p99</th>
                </tr>
              </thead>
              <tbody>
                {CROSSTALK.map((r) => (
                  <tr key={r.group} className="border-b border-border/60 last:border-b-0">
                    <td className="px-4 py-2.5 text-ink">{r.group}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-accent-bright">{r.p50}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-accent-bright">{r.p99}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed max-w-3xl">
          The Full Node tenant doing constant trace work has the <em>same</em>{' '}
          <code className="font-mono text-accent">eth_call</code> p99 as the lighter tiers.
          CPU pinning (geth on dedicated cores) and the 131&nbsp;GB geth cache absorb
          the contention &mdash; tracing competes with itself, not with other operators&apos;
          standard RPC.
        </p>
      </section>

      {/* METHODOLOGY */}
      <section className="mt-14">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Methodology &amp; known weaknesses</h2>
        <div className="card p-5 sm:p-6 space-y-4 text-sm leading-relaxed">
          <div>
            <p className="font-semibold mb-1">1. Same-box generation.</p>
            <p className="text-muted">
              Load was generated on the production node itself. This adds ~2&ndash;5%
              CPU overhead from the harness but avoids network noise. Remote clients
              will see TLS handshake + TCP RTT + nginx proxy on top
              (~0.5&ndash;2ms added once the connection is warm).
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">2. Loopback, not the 10&nbsp;GbE NIC.</p>
            <p className="text-muted">
              HTTP/WS traffic used loopback. The network bandwidth numbers in our
              monitoring reflect only BSC P2P, not RPC.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">3. Measurement precision.</p>
            <p className="text-muted">
              Go <code className="font-mono text-accent">time.Now()</code> uses{' '}
              <code className="font-mono text-accent">CLOCK_MONOTONIC</code> with
              ~20ns resolution on Linux. Per-sample overhead is &lt;1µs &mdash; negligible
              relative to the signal we&apos;re measuring.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">4. <code className="font-mono text-accent">eth_sendRawTransaction</code> uses intentionally invalid txs.</p>
            <p className="text-muted">
              Measures the RPC round-trip and validation path, not actual mempool
              insertion or peer relay.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">5. <code className="font-mono text-accent">debug_traceTransaction</code> is chain-tip only.</p>
            <p className="text-muted">
              Trace state is available for the most recent ~128 blocks (~60 sec).
              The test traces transactions immediately after they land in the latest
              block, which is the realistic Full Node tier workload.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">6. <code className="font-mono text-accent">eth_getLogs</code> p95 tail is real.</p>
            <p className="text-muted">
              Note Group C&apos;s p95=20.7ms for getLogs. Log queries scan ranges and
              are I/O-sensitive. p50 stays under 1ms but the tail is wider than
              other methods. If your workload is getLogs-heavy, this is the metric
              to look at.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-14">
        <div className="card p-6 sm:p-8 text-center border-accent/20">
          <h3 className="text-xl sm:text-2xl font-semibold text-ink mb-2">
            Want to test it from your own location?
          </h3>
          <p className="text-muted text-sm mb-5">
            Pricing page has a public latency tester &mdash; runs in your browser, no signup.
            Or run your own benchmarks against the live endpoint with a paid tier.
          </p>
          <ColoSlots variant="inline" />
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/pricing" className="btn-primary">See pricing</Link>
            <Link href="/docs" className="btn-ghost">Read the docs</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
