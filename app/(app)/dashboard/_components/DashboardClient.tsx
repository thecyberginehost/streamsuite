'use client';

import { useState } from 'react';
import { StatCards, LiveTape, HealthDot } from './StatsLive';
import {
  FirstCallBanner,
  UpsellBanner,
  BotIdleNotice,
  QuickstartTabs,
  MethodPlayground,
  BillingButton,
} from './Widgets';
import { CredentialsBlock } from './CredentialsBlock';

type Tab = 'overview' | 'credentials' | 'playground' | 'billing';

const TABS: { id: Tab; label: string; mobileLabel: string; glyph: string }[] = [
  { id: 'overview', label: 'Overview', mobileLabel: 'Stats', glyph: '∼' },
  { id: 'credentials', label: 'Credentials', mobileLabel: 'Keys', glyph: '⎘' },
  { id: 'playground', label: 'Playground', mobileLabel: 'Play', glyph: '⊞' },
  { id: 'billing', label: 'Billing', mobileLabel: 'Bill', glyph: '$' },
];

export function DashboardClient({
  email,
  operatorId,
  status,
  tier,
  label,
  price,
  apiKey,
  endpointHost,
}: {
  email: string;
  operatorId: string;
  status: string;
  tier: string;
  label: string;
  price: string;
  apiKey: string;
  endpointHost: string;
}) {
  const [tab, setTab] = useState<Tab>('overview');

  const httpsUrl = `https://${endpointHost}/?key=${apiKey}`;
  const wssUrl = `wss://${endpointHost}/ws?key=${apiKey}`;

  return (
    <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-6xl mx-auto pb-24 lg:pb-10">
      {/* Status bar (always visible) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="pulse-dot" aria-hidden />
          <span className="font-mono text-base sm:text-lg tracking-wider text-ink">
            {operatorId}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 border border-border-strong rounded text-accent-bright">
            {status}
          </span>
          <HealthDot apiKey={apiKey} />
        </div>
        <div className="flex items-center gap-4 flex-wrap text-xs font-mono text-muted">
          <span className="flex items-center gap-1.5">
            <span className="opacity-60">tier</span>
            <span className="text-ink">{label}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="opacity-60">billing</span>
            <span className="text-ink">{price}</span>
          </span>
        </div>
      </div>

      {/* Desktop tabs */}
      <nav className="hidden lg:flex items-center gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 font-mono text-xs uppercase tracking-[0.18em] border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-accent text-accent-bright'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Mobile tab label */}
      <p className="lg:hidden font-mono text-[11px] uppercase tracking-[0.2em] text-accent/80 mb-4">
        ── {TABS.find((t) => t.id === tab)?.label.toLowerCase()} ──
      </p>

      {/* Active tab panel */}
      {tab === 'overview' && (
        <div>
          <FirstCallBanner apiKey={apiKey} httpsUrl={httpsUrl} />
          <UpsellBanner apiKey={apiKey} tier={tier} />
          <BotIdleNotice apiKey={apiKey} />

          <section className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent/90">
                ── usage · last 24h ──
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">live</span>
            </div>
            <StatCards apiKey={apiKey} />
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent/90">
                ── live tape ──
              </h2>
            </div>
            <LiveTape apiKey={apiKey} />
          </section>
        </div>
      )}

      {tab === 'credentials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <section className="card p-5 sm:p-6">
            <CredentialsBlock apiKey={apiKey} endpointHost={endpointHost} />
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent/90 mb-3">
              ── quickstart ──
            </h2>
            <QuickstartTabs apiKey={apiKey} httpsUrl={httpsUrl} wsUrl={wssUrl} />
          </section>
        </div>
      )}

      {tab === 'playground' && (
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent/90">
              ── rpc playground ──
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">browser → your endpoint</span>
          </div>
          <MethodPlayground httpsUrl={httpsUrl} />
        </section>
      )}

      {tab === 'billing' && (
        <section className="card p-5 sm:p-6 max-w-xl">
          <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent/90 mb-4">
            ── billing ──
          </h2>
          <div className="flex flex-col gap-2 mb-5 font-mono text-sm">
            <Row label="Account" value={email} />
            <Row label="Operator ID" value={operatorId} />
            <Row label="Plan" value={label} />
            <Row label="Price" value={price} />
            <Row label="Status" value={status.toUpperCase()} valueClass="text-accent-bright" />
          </div>
          <BillingButton />
          <p className="text-xs font-mono text-muted mt-4 leading-relaxed">
            Update card, view invoices, or cancel subscription via Stripe&apos;s billing portal.
          </p>
        </section>
      )}

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-panel border-t border-border flex items-center justify-around py-2 z-40">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              tab === t.id ? 'text-accent' : 'text-muted'
            }`}
          >
            <span className="font-mono text-base leading-none">{t.glyph}</span>
            <span className="font-mono text-[10px] uppercase tracking-wider">{t.mobileLabel}</span>
          </button>
        ))}
      </nav>

      {/* Desktop hotkey hint */}
      <div className="hidden lg:flex items-center gap-4 mt-12 pt-6 border-t border-border font-mono text-[11px] uppercase tracking-wider text-muted">
        <span className="ml-auto">v1 · phase 1.5</span>
      </div>
    </main>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-3 break-all">
      <span className="text-muted opacity-60 shrink-0">{label}</span>
      <span className={`text-ink ${valueClass || ''}`}>{value}</span>
    </div>
  );
}
