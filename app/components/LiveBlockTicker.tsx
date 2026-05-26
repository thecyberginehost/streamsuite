'use client';

import { useEffect, useState } from 'react';

type HealthResponse = {
  ok: boolean;
  checks?: {
    bsc?: { ok?: boolean; block?: number; block_age_sec?: number };
  };
};

type Status = 'loading' | 'fresh' | 'lagging' | 'down';

function formatBlock(n: number | undefined): string {
  if (!n || !Number.isFinite(n)) return '--,---,---';
  return n.toLocaleString('en-US');
}

function statusFor(ok: boolean, ageSec: number | undefined): Status {
  if (!ok) return 'down';
  if (ageSec === undefined) return 'loading';
  if (ageSec <= 5) return 'fresh';
  if (ageSec <= 30) return 'lagging';
  return 'down';
}

const colorMap: Record<Status, { dot: string; text: string; label: string }> = {
  loading: { dot: 'bg-muted/60', text: 'text-muted', label: 'CHECKING' },
  fresh:   { dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]', text: 'text-emerald-400', label: 'LIVE' },
  lagging: { dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',  text: 'text-amber-400',   label: 'LAGGING' },
  down:    { dot: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]',   text: 'text-red-400',     label: 'DOWN' },
};

export default function LiveBlockTicker() {
  const [block, setBlock] = useState<number | undefined>(undefined);
  const [ageSec, setAgeSec] = useState<number | undefined>(undefined);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const data: HealthResponse = await res.json();
        if (cancelled) return;
        const bsc = data?.checks?.bsc;
        setBlock(bsc?.block);
        setAgeSec(bsc?.block_age_sec);
        setOk(Boolean(data?.ok && bsc?.ok));
      } catch {
        if (cancelled) return;
        setOk(false);
      }
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const status = statusFor(ok, ageSec);
  const c = colorMap[status];

  return (
    <div
      className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-border bg-panel/60 px-3 py-2 font-mono text-xs sm:text-sm"
      role="status"
      aria-live="polite"
      aria-label="Live BSC node status"
    >
      <span className="inline-flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} />
        <span className={`uppercase tracking-wider text-[10px] sm:text-[11px] font-semibold ${c.text}`}>
          {c.label}
        </span>
      </span>
      <span className="text-muted hidden sm:inline">·</span>
      <span className="text-ink">
        Block <span className="text-accent-bright">{formatBlock(block)}</span>
      </span>
      <span className="text-muted hidden sm:inline">·</span>
      <span className="text-muted">
        {ageSec === undefined ? '—' : `${ageSec}s old`}
      </span>
      <span className="text-muted hidden md:inline">·</span>
      <span className="text-muted hidden md:inline">va-bsc-01.streamsuite.io</span>
    </div>
  );
}
