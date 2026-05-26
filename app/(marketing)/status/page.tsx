export const metadata = {
  title: 'Status — StreamSuite',
  description: 'Live status of StreamSuite BSC RPC infrastructure.',
};

// Server-side fetch: keep cache short (5s) for near-live data.
export const revalidate = 5;
export const dynamic = 'force-dynamic';

const HEALTH_URL = process.env.HEALTH_URL || 'https://va-bsc-01.streamsuite.io/api/health';

type Health = { block: number; block_age_sec: number; fresh: boolean; checked_at: number };

async function fetchHealth(): Promise<{ ok: true; data: Health } | { ok: false; reason: string }> {
  try {
    const res = await fetch(HEALTH_URL, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, reason: err?.name === 'TimeoutError' ? 'timeout' : (err?.message || 'unreachable') };
  }
}

export default async function StatusPage() {
  const h = await fetchHealth();
  const healthy = h.ok && h.data.fresh && h.data.block_age_sec < 30;
  const degraded = h.ok && !healthy;
  const down = !h.ok;

  const indicator = healthy ? { color: '#34d399', label: 'All systems operational' } :
                    degraded ? { color: '#fbbf24', label: 'Degraded performance' } :
                               { color: '#f87171', label: 'Service disruption' };

  return (
    <main className="min-h-screen px-4 py-12">
      <article className="max-w-3xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">┌── status ──┐</p>
        <h1 className="text-3xl font-semibold mb-2">System status</h1>
        <p className="text-muted text-sm mb-8">Live data from the StreamSuite BSC node. Page auto-refreshes every 5 seconds.</p>

        <div className="card p-6 mb-8 border-l-4" style={{ borderLeftColor: indicator.color }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: indicator.color, boxShadow: `0 0 12px ${indicator.color}` }}></span>
            <h2 className="text-xl font-semibold">{indicator.label}</h2>
          </div>
          <p className="text-muted text-xs font-mono">
            checked {new Date().toISOString().replace('T', ' ').slice(0, 19)}Z
          </p>
        </div>

        <h2 className="text-xs font-mono uppercase tracking-wider text-muted mb-3">Components</h2>

        <div className="space-y-2 mb-8">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">BSC RPC (HTTP + WSS)</p>
              <p className="text-xs text-muted font-mono mt-1">va-bsc-01.streamsuite.io · Ashburn, VA</p>
            </div>
            <div className="text-right">
              {h.ok ? (
                <>
                  <p className={`text-sm font-mono font-semibold ${healthy ? 'text-accent' : degraded ? 'text-amber-400' : 'text-red-400'}`}>
                    {healthy ? '● operational' : degraded ? '● lagging' : '● down'}
                  </p>
                  <p className="text-[11px] text-muted font-mono mt-1">
                    block {h.data.block.toLocaleString()} · {h.data.block_age_sec}s old
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-mono font-semibold text-red-400">● unreachable</p>
                  <p className="text-[11px] text-muted font-mono mt-1">{h.reason}</p>
                </>
              )}
            </div>
          </div>

          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Dashboard + Auth</p>
              <p className="text-xs text-muted font-mono mt-1">streamsuite.io · serving this page</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-semibold text-accent">● operational</p>
              <p className="text-[11px] text-muted font-mono mt-1">if you can read this, it&apos;s up</p>
            </div>
          </div>

          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Stripe billing</p>
              <p className="text-xs text-muted font-mono mt-1">third-party · payments + portal</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-semibold text-muted">— external</p>
              <p className="text-[11px] text-muted font-mono mt-1">
                <a href="https://status.stripe.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent">status.stripe.com →</a>
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5 text-sm text-muted">
          <p className="mb-2">
            Affected by an incident? Email{' '}
            <a href="mailto:support@streamsuite.io" className="text-accent hover:underline">support@streamsuite.io</a>
            {' '}with <strong>[SEV-1]</strong> in the subject if your bot is offline due to our infrastructure.
          </p>
          <p className="text-xs">
            See <a href="/support" className="text-accent hover:underline">/support</a> for response targets.
          </p>
        </div>

        <p className="text-muted text-[11px] font-mono mt-8 text-center">
          single-region (Ashburn, VA) · multi-region failover planned · last refresh on page load
        </p>
      </article>
      {/* Auto-refresh via meta tag every 5s */}
      <meta httpEquiv="refresh" content="5" />
    </main>
  );
}
