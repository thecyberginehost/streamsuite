'use client';

import { useEffect, useRef, useState } from 'react';

const STATS_API = 'https://va-bsc-01.streamsuite.io';

type Stats = {
  total_24h: number;
  errors_24h: number;
  blocked_24h: number;
  error_rate_pct: number | null;
  top_method: string | null;
  top_method_count: number;
  p50_ms_1h: number | null;
  p95_ms_1h: number | null;
  p99_ms_1h: number | null;
  last_seen_ms: number | null;
  method_counts_24h: Record<string, number>;
  tier: string;
};

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toLocaleString();
}

function fmtLatency(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n < 1) return '<1ms';
  if (n < 10) return n.toFixed(2) + 'ms';
  return n.toFixed(1) + 'ms';
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(2) + '%';
}

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-bg border border-border rounded-md p-3 sm:p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">{label}</p>
      <p className={`font-mono text-xl sm:text-2xl leading-tight ${loading ? 'text-muted/40 animate-pulse' : 'text-ink'}`}>
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] text-muted mt-1 truncate">{sub}</p>}
    </div>
  );
}

export function StatCards({ apiKey }: { apiKey: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`${STATS_API}/api/stats?key=${apiKey}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Stats;
        if (mounted) {
          setStats(data);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) {
          setLoading(false);
          timeoutId = setTimeout(poll, 10_000);
        }
      }
    }
    poll();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [apiKey]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        label="Requests (24h)"
        value={fmt(stats?.total_24h ?? 0)}
        sub={
          loading
            ? 'loading…'
            : stats && stats.total_24h === 0
            ? 'waiting on first call'
            : 'last 24 hours'
        }
        loading={loading}
      />
      <StatCard
        label="Top method"
        value={stats?.top_method ?? '—'}
        sub={stats?.top_method ? `${fmt(stats.top_method_count)} calls` : '—'}
        loading={loading}
      />
      <StatCard
        label="p50 latency"
        value={fmtLatency(stats?.p50_ms_1h)}
        sub={`p95 ${fmtLatency(stats?.p95_ms_1h)} · last 1h`}
        loading={loading}
      />
      <StatCard
        label="Error rate"
        value={fmtPct(stats?.error_rate_pct)}
        sub={`${fmt(stats?.errors_24h)} errors · 24h`}
        loading={loading}
      />
    </div>
  );
}

type TapeEvent = {
  ts_ms: number;
  method: string;
  status: number;
  request_ms: number;
  bytes: number;
};

function formatHMS(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`;
}

const MAX_TAPE_LINES = 80;

export function LiveTape({ apiKey }: { apiKey: string }) {
  const [events, setEvents] = useState<TapeEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`${STATS_API}/api/tape?key=${apiKey}`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data) as TapeEvent;
        setEvents((arr) => {
          const next = arr.length >= MAX_TAPE_LINES ? arr.slice(1) : arr.slice();
          next.push(e);
          return next;
        });
      } catch {}
    };
    return () => es.close();
  }, [apiKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted flex items-center gap-1.5">
          <span className={connected ? 'text-accent' : 'text-yellow-400'}>
            {connected ? '●' : '○'}
          </span>
          {connected ? 'live' : 'connecting…'}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {events.length}/{MAX_TAPE_LINES}
        </span>
      </div>
      <div
        ref={scrollRef}
        className="bg-bg border border-border rounded-md p-2 sm:p-3 font-mono text-[10px] sm:text-xs leading-relaxed h-56 sm:h-64 overflow-y-auto"
      >
        {events.length === 0 ? (
          <div className="text-muted">
            <span className="text-accent">●</span> Connected. Awaiting first RPC call…
          </div>
        ) : (
          events.map((e, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5 whitespace-nowrap">
              <span className="text-muted/60 shrink-0">{formatHMS(e.ts_ms)}</span>
              <span className="text-accent flex-1 truncate">{e.method || '(empty)'}</span>
              <span className={`shrink-0 ${e.status >= 400 ? 'text-red-400' : 'text-muted'}`}>
                {e.status}
              </span>
              <span className="text-muted shrink-0 hidden sm:inline">
                {e.request_ms < 1 ? '<1ms' : e.request_ms.toFixed(1) + 'ms'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function HealthDot({ apiKey }: { apiKey: string }) {
  const [health, setHealth] = useState<{ block: number | null; fresh: boolean; age: number | null } | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    async function check() {
      try {
        const res = await fetch(`${STATS_API}/api/health?key=${apiKey}`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (mounted) setHealth({ block: data.block, fresh: !!data.fresh, age: data.block_age_sec });
      } catch {
        if (mounted) setHealth({ block: null, fresh: false, age: null });
      } finally {
        if (mounted) timeoutId = setTimeout(check, 5000);
      }
    }
    check();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [apiKey]);

  if (!health) {
    return (
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-muted/40" />
        connecting
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
      <span
        className={`w-1.5 h-1.5 rounded-full ${health.fresh ? 'bg-accent' : 'bg-yellow-400'}`}
        style={health.fresh ? { boxShadow: '0 0 8px #34d399' } : {}}
      />
      <span className="text-ink">{health.block?.toLocaleString() ?? '—'}</span>
      <span className="opacity-60">{health.fresh && health.age !== null ? `${health.age}s` : 'stale'}</span>
    </span>
  );
}
