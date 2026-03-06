'use client';

import { useEffect, useState } from 'react';

// ── Stats ──

const FALLBACK_STATS = {
  trades: 14500000,
  wallets: 428000,
  tokens: 270000,
  smartWallets: 4230,
};

const API_BASE = process.env.NEXT_PUBLIC_ARCHIVER_API || '';

function useStats() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!API_BASE) return;
    let active = true;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/archiver/stats`);
        if (res.ok && active) {
          const data = await res.json();
          if (data) {
            setStats({
              trades: data.trades ?? FALLBACK_STATS.trades,
              wallets: data.wallets ?? FALLBACK_STATS.wallets,
              tokens: data.tokens ?? FALLBACK_STATS.tokens,
              smartWallets: data.smartWallets ?? FALLBACK_STATS.smartWallets,
            });
            setIsLive(true);
          }
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

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

// ── Page ──

export default function Home() {
  const { stats, isLive } = useStats();

  return (
    <main className="min-h-screen">
      {/* ── Hero ── */}
      <section className="dot-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060c1f]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-14 sm:pt-16 sm:pb-20 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-white">Stream</span>
            <span className="text-accent">Suite</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg leading-relaxed mb-8 sm:mb-10">
            Open-source data infrastructure for Solana markets.
            Real-time trade archival, wallet scoring, and ML signals — powering the next generation of developer tools.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://github.com/thecyberginehost/streamsuite"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              GitHub
            </a>
            <a
              href="https://github.com/thecyberginehost/streamsuite#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Documentation
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="glass-card rounded-xl p-4 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { value: fmt(stats.trades), label: 'Trades Archived' },
            { value: fmt(stats.wallets), label: 'Wallets Analyzed' },
            { value: fmt(stats.tokens), label: 'Tokens Tracked' },
            { value: fmt(stats.smartWallets), label: 'Wallets Scored' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="stat-number font-mono text-2xl sm:text-3xl md:text-4xl font-bold">{s.value}</div>
              <div className="text-slate-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        {isLive && (
          <div className="flex justify-center mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        )}
      </section>

      <div className="divider max-w-2xl mx-auto" />

      {/* ── For Developers ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3">What Powers StreamSuite</h2>
        <p className="text-slate-500 text-center mb-8 sm:mb-12 max-w-lg mx-auto text-sm">
          Four production engines running 24/7. Public APIs coming soon.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {[
            {
              title: 'Trade Archive',
              desc: 'Real-time archiver capturing every pump.fun trade into DuckDB. 14M+ records and growing, with 60% columnar compression. Public query API coming soon.',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />
                </svg>
              ),
            },
            {
              title: 'Smart Wallet Scoring',
              desc: 'Dynamic reputation engine scoring wallets on hit rate, moonshot rate, and diversity. 4,200+ wallets scored, refreshed every 30 minutes from live data.',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              ),
            },
            {
              title: 'Caller PnL Tracker',
              desc: 'Cross-references influencer calls against on-chain outcomes. Computes verified PnL at 30s, 60s, 90s, and 120s intervals. Public leaderboard coming soon.',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              ),
            },
            {
              title: 'ML Classifiers',
              desc: 'XGBoost entry and exit models trained on 60,000+ price action samples. Pure TypeScript inference, no Python runtime. Open model weights planned.',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                </svg>
              ),
            },
          ].map((engine) => (
            <div key={engine.title} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-accent">{engine.icon}</div>
                <h3 className="text-sm font-semibold text-white">{engine.title}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{engine.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider max-w-2xl mx-auto" />

      {/* ── API Preview ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3">API</h2>
        <p className="text-slate-500 text-center mb-8 sm:mb-10 max-w-lg mx-auto text-sm">
          Live endpoints available now. Full public API coming soon.
        </p>
        <div className="glass-card rounded-xl p-4 sm:p-5 font-mono text-xs sm:text-sm overflow-x-auto">
          <div className="space-y-2.5 sm:space-y-2 text-slate-400">
            <div className="text-slate-600 text-xs mb-2 font-sans">LIVE</div>
            <div><span className="text-emerald-400">GET</span> <span className="text-slate-300">/api/archiver/stats</span> <span className="hidden sm:inline text-slate-600">— Live platform statistics</span></div>
            <div><span className="text-emerald-400">GET</span> <span className="text-slate-300">/api/archiver/volume</span> <span className="hidden sm:inline text-slate-600">— Hourly trade volume aggregation</span></div>
            <div><span className="text-emerald-400">GET</span> <span className="text-slate-300">/api/archiver/recent-tokens</span> <span className="hidden sm:inline text-slate-600">— Latest token launches</span></div>
            <div className="text-slate-600 text-xs mt-4 mb-2 font-sans">COMING SOON</div>
            <div className="opacity-50"><span className="text-emerald-400">GET</span> <span className="text-slate-300">/api/trades</span> <span className="hidden sm:inline text-slate-600">— Historical trade queries with filtering</span></div>
            <div className="opacity-50"><span className="text-emerald-400">GET</span> <span className="text-slate-300">/api/wallets/:addr</span> <span className="hidden sm:inline text-slate-600">— Wallet reputation score + history</span></div>
            <div className="opacity-50"><span className="text-emerald-400">GET</span> <span className="text-slate-300">/api/callers</span> <span className="hidden sm:inline text-slate-600">— Caller leaderboard with verified PnL</span></div>
            <div className="opacity-50"><span className="text-cyan-400">WSS</span> <span className="text-slate-300">/stream/trades</span> <span className="hidden sm:inline text-slate-600">— Real-time trade events</span></div>
          </div>
        </div>
      </section>

      <div className="divider max-w-2xl mx-auto" />

      {/* ── Roadmap ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3">Roadmap</h2>
        <p className="text-slate-500 text-center mb-8 sm:mb-10 max-w-lg mx-auto text-sm">
          What&apos;s shipped and what&apos;s next.
        </p>
        <div className="max-w-md mx-auto space-y-3">
          {[
            { done: true, text: 'Trade archive engine (14M+ trades)' },
            { done: true, text: 'DuckDB columnar storage (60% compression)' },
            { done: true, text: 'Smart wallet scoring engine (4,200+ wallets)' },
            { done: true, text: 'ML exit/entry classifiers (60K+ training samples)' },
            { done: true, text: 'Caller PnL tracker (17 influencers)' },
            { done: true, text: 'Live archiver API (stats, volume, tokens)' },
            { done: false, text: 'Public REST API (trades, wallets, callers)' },
            { done: false, text: 'Real-time WebSocket feeds' },
            { done: false, text: 'Public dashboard & caller leaderboard' },
            { done: false, text: 'TypeScript + Python SDKs' },
            { done: false, text: 'API documentation + integration guides' },
            { done: false, text: 'Multi-pool expansion (Raydium, Orca, Jupiter)' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              {item.done ? (
                <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0" />
              )}
              <span className={`text-sm ${item.done ? 'text-slate-300' : 'text-slate-500'}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="divider max-w-2xl mx-auto" />

      {/* ── Open Source CTA ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Open source, free tier, MIT license</h2>
        <p className="text-slate-500 max-w-md mx-auto text-sm mb-8 leading-relaxed">
          Developer tooling that gives every builder in the Solana ecosystem
          the same data and signals that were previously only accessible to insiders.
        </p>
        <a
          href="https://github.com/thecyberginehost/streamsuite"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
          View on GitHub
        </a>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-slate-600 text-xs">StreamSuite &copy; 2026</span>
          <div className="flex items-center gap-5">
            <a href="https://github.com/thecyberginehost/streamsuite" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400 transition-colors text-xs">GitHub</a>
            <a href="https://x.com/streamsuite" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400 transition-colors text-xs">Twitter</a>
            <a href="mailto:hello@streamsuite.io" className="text-slate-600 hover:text-slate-400 transition-colors text-xs">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
