'use client';

import { useEffect, useState } from 'react';

// ── Icons (inline SVG to avoid dependencies) ──

function DatabaseIcon() {
  return (
    <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-5 h-5 text-accent/40 hidden lg:block" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// ── Stats with live fetch ──

const FALLBACK_STATS = {
  trades: 10363405,
  wallets: 333427,
  tokens: 202337,
  smartWallets: 4230,
};

const STATS_API = process.env.NEXT_PUBLIC_STATS_API || '';

function useStats() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!STATS_API) return;

    let active = true;
    const fetchStats = async () => {
      try {
        const res = await fetch(STATS_API);
        if (res.ok && active) {
          const data = await res.json();
          setStats({
            trades: data.trades ?? FALLBACK_STATS.trades,
            wallets: data.wallets ?? FALLBACK_STATS.wallets,
            tokens: data.tokens ?? FALLBACK_STATS.tokens,
            smartWallets: data.smartWallets ?? FALLBACK_STATS.smartWallets,
          });
          setIsLive(true);
        }
      } catch {
        if (active) setIsLive(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return { stats, isLive };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M+';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K+';
  return n.toLocaleString() + '+';
}

// ── Page ──

export default function Home() {
  const { stats, isLive } = useStats();

  return (
    <main className="min-h-screen">
      {/* ── Hero ── */}
      <section className="dot-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050a18]" />
        <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-2">
            <span className="text-white">Stream</span>
            <span className="text-accent">Suite</span>
          </h1>
          <p className="text-lg sm:text-xl text-accent/80 font-medium mb-6">
            Real-Time Intelligence for Solana Memecoin Markets
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Wallet reputation scores, influencer accountability, ML-driven market signals
            &mdash; all open-source, all verifiable on-chain.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors font-medium"
            >
              <GithubIcon />
              View on GitHub
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors font-medium"
            >
              Read the Docs
            </a>
          </div>
        </div>
      </section>

      {/* ── What We Built ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">What We Built</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Four production engines running 24/7, processing every trade on pump.fun in real time.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trade Archive */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10"><DatabaseIcon /></div>
              <h3 className="text-lg font-semibold text-white">Trade Archive</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time archiver capturing every pump.fun trade. 10M+ records and growing.
              Open SQLite database with free historical data for backtesting and research.
              Ingests via PumpPortal WebSocket at zero cost.
            </p>
          </div>

          {/* Smart Wallet Scoring */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10"><WalletIcon /></div>
              <h3 className="text-lg font-semibold text-white">Smart Wallet Scoring</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dynamic wallet reputation engine scoring 4,200+ wallets based on hit rate,
              moonshot rate, and trading diversity across 30-day rolling windows.
              Updated every 30 minutes from live on-chain data.
            </p>
          </div>

          {/* Caller PnL Tracker */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10"><ChartIcon /></div>
              <h3 className="text-lg font-semibold text-white">Caller PnL Tracker</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Cross-references Twitter influencer calls against actual on-chain outcomes.
              Computes PnL at 30s, 60s, 90s, 120s intervals by matching mints to the trade
              archive. Proves who&apos;s profitable vs who&apos;s dumping on followers.
            </p>
          </div>

          {/* ML Price Classifier */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10"><CpuIcon /></div>
              <h3 className="text-lg font-semibold text-white">ML Price Classifier</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              XGBoost models trained on 60,000+ pump.fun price action samples. Exit classifier
              (300 trees, 27 features) and entry classifier (155 trees, 31 features). Open model
              weights and training pipeline.
            </p>
          </div>
        </div>
      </section>

      <div className="glow-line max-w-3xl mx-auto" />

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center justify-center gap-3 mb-12">
          <h2 className="text-3xl font-bold text-white text-center">Live Data</h2>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="stat-number font-mono text-4xl sm:text-5xl font-bold mb-2">
              {formatNumber(stats.trades)}
            </div>
            <div className="text-slate-400 text-sm font-medium">Trades Archived</div>
          </div>
          <div className="text-center">
            <div className="stat-number font-mono text-4xl sm:text-5xl font-bold mb-2">
              {formatNumber(stats.wallets)}
            </div>
            <div className="text-slate-400 text-sm font-medium">Wallets Analyzed</div>
          </div>
          <div className="text-center">
            <div className="stat-number font-mono text-4xl sm:text-5xl font-bold mb-2">
              {formatNumber(stats.tokens)}
            </div>
            <div className="text-slate-400 text-sm font-medium">Tokens Tracked</div>
          </div>
          <div className="text-center">
            <div className="stat-number font-mono text-4xl sm:text-5xl font-bold mb-2">
              {formatNumber(stats.smartWallets)}
            </div>
            <div className="text-slate-400 text-sm font-medium">Wallets Scored</div>
          </div>
        </div>
      </section>

      <div className="glow-line max-w-3xl mx-auto" />

      {/* ── How It Works ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">How It Works</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Three-stage pipeline from raw blockchain data to actionable intelligence.
        </p>
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-4">
          {/* Step 1 */}
          <div className="glass-card rounded-xl p-6 flex-1 max-w-sm text-center">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-accent font-mono font-bold text-sm">1</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Ingest</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              PumpPortal WebSocket streams every pump.fun trade in real-time.
              All trades buffered in memory and flushed to SQLite every 5 seconds.
            </p>
          </div>

          <ArrowIcon />

          {/* Step 2 */}
          <div className="glass-card rounded-xl p-6 flex-1 max-w-sm text-center">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-accent font-mono font-bold text-sm">2</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Score</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              ML models and statistical engines process wallet behavior, caller accuracy,
              and price patterns. Smart wallet list regenerated every 30 minutes.
            </p>
          </div>

          <ArrowIcon />

          {/* Step 3 */}
          <div className="glass-card rounded-xl p-6 flex-1 max-w-sm text-center">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-accent font-mono font-bold text-sm">3</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Serve</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Open API and dashboard for developers, researchers, and the community.
              Free tier for public good, paid tiers for scale.
            </p>
          </div>
        </div>
      </section>

      <div className="glow-line max-w-3xl mx-auto" />

      {/* ── Built In Production ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Not a whitepaper. Already running.
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          StreamSuite&apos;s core engines have been running in production since February 2026,
          archiving every pump.fun trade and scoring wallets 24/7. The grant funds the public
          API, documentation, and open-source release &mdash; not R&amp;D.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: '8+', label: 'Days Continuous Uptime' },
            { value: '160MB', label: 'New Data Ingested Daily' },
            { value: '30min', label: 'Scoring Refresh Cycle' },
            { value: '$0', label: 'External API Costs' },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-card rounded-xl p-5 text-center"
            >
              <div className="font-mono text-2xl font-bold text-white mb-1">
                {item.value}
              </div>
              <div className="text-slate-400 text-xs font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="glow-line max-w-3xl mx-auto" />

      {/* ── Open Source ── */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="glass-card rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-4">Open Source</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Built as a public good for the Solana ecosystem. All core engines, models,
            and data will be open-source under MIT license.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors font-medium"
          >
            <GithubIcon />
            View on GitHub
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm">
            StreamSuite &copy; 2026
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
              GitHub
            </a>
            <a href="#" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
              Twitter
            </a>
            <a href="#" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
              Email
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
