'use client';

import { useEffect, useState } from 'react';

type ColoGroupStatus = {
  id: string;
  hostname: string;
  region: string;
  max_slots: number;
  active_count: number;
  slots_remaining: number;
  status: 'open' | 'full' | 'provisioning' | 'archived';
  accepting_signups: boolean;
};

type ColoStatus = {
  active_group_id: string;
  groups: ColoGroupStatus[];
};

type Variant = 'pill' | 'stat' | 'card' | 'inline';

function pickGroup(data: ColoStatus | null): ColoGroupStatus | null {
  if (!data) return null;
  // Prefer the active group if it has any slots; otherwise pick the most-recent open
  // group; otherwise the active group (so 'FULL' state still renders).
  const active = data.groups.find(g => g.id === data.active_group_id);
  if (active && active.accepting_signups) return active;
  const anyOpen = data.groups.find(g => g.accepting_signups);
  return anyOpen ?? active ?? data.groups[0] ?? null;
}

function statusColor(g: ColoGroupStatus): { dot: string; text: string } {
  if (g.status === 'full' || g.slots_remaining === 0) {
    return { dot: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]', text: 'text-red-400' };
  }
  if (g.slots_remaining <= 2) {
    return { dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]', text: 'text-amber-400' };
  }
  return { dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]', text: 'text-emerald-400' };
}

function statusLabel(g: ColoGroupStatus): string {
  if (g.status === 'full' || g.slots_remaining === 0) return 'FULL';
  if (g.slots_remaining <= 2) return 'NEARLY FULL';
  return 'OPEN';
}

export default function ColoSlots({ variant = 'inline' }: { variant?: Variant }) {
  const [data, setData] = useState<ColoStatus | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch('/api/colo-status', { cache: 'no-store' });
        if (!res.ok) throw new Error('http ' + res.status);
        const j: ColoStatus = await res.json();
        if (!cancelled) {
          setData(j);
          setErrored(false);
        }
      } catch {
        if (!cancelled) setErrored(true);
      }
    }
    poll();
    const id = setInterval(poll, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const g = pickGroup(data);

  // ── PILL VARIANT: tiny inline pill for hero region of homepage ──────────
  if (variant === 'pill') {
    if (!g) {
      return (
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {errored ? '— slots —' : 'checking…'}
        </span>
      );
    }
    const c = statusColor(g);
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />
        <span className={c.text}>
          {g.slots_remaining} of {g.max_slots} slots open
        </span>
      </span>
    );
  }

  // ── STAT VARIANT: drop-in replacement for one cell in the hero stats grid ─
  if (variant === 'stat') {
    const value = g ? `${g.slots_remaining}/${g.max_slots}` : '—';
    const label = g
      ? (g.accepting_signups ? `Slots open · ${g.id}` : `${statusLabel(g)} · ${g.id}`)
      : 'Slots open';
    return (
      <div className="bg-panel px-5 py-6">
        <div className="text-2xl md:text-3xl font-bold accent-gradient font-mono">
          {value}
        </div>
        <div className="mt-1 text-xs md:text-sm text-muted uppercase tracking-wider">
          {label}
        </div>
      </div>
    );
  }

  // ── CARD VARIANT: full status card for the exclusivity section ──────────
  if (variant === 'card') {
    if (!g) {
      return (
        <div className="card p-5 mt-6 border-border/40 text-sm text-muted">
          {errored ? 'Slot status unavailable.' : 'Checking colocation group status…'}
        </div>
      );
    }
    const c = statusColor(g);
    const pct = Math.round((g.active_count / g.max_slots) * 100);
    return (
      <div className="card p-5 sm:p-6 mt-6 border-accent/20">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-1">
              Current colocation group
            </div>
            <div className="text-lg font-semibold text-ink font-mono">{g.id}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} />
              <span className={`font-mono text-xs uppercase tracking-wider font-semibold ${c.text}`}>
                {statusLabel(g)}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-ink mt-1">
              {g.slots_remaining} <span className="text-sm text-muted font-normal">/ {g.max_slots}</span>
            </div>
            <div className="text-[10px] text-muted font-mono uppercase tracking-wider">slots open</div>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full bg-bg overflow-hidden border border-border">
          <div
            className={g.slots_remaining === 0 ? 'h-full bg-red-400' : g.slots_remaining <= 2 ? 'h-full bg-amber-400' : 'h-full bg-accent'}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          When this group fills, we provision a new physical server rather than
          oversubscribing this one. Live count updates within ~30s of a new signup.
        </p>
      </div>
    );
  }

  // ── INLINE VARIANT (default): single line, e.g. next to a hostname ──────
  if (!g) {
    return (
      <span className="font-mono text-xs text-muted">
        {errored ? '' : ''}
      </span>
    );
  }
  const c = statusColor(g);
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span className={c.text}>
        {g.slots_remaining} of {g.max_slots} slots open · {g.id}
      </span>
    </span>
  );
}
