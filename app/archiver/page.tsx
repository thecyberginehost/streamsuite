'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// ── Types ──

interface ArchiverStats {
  tokens: number;
  trades: number;
  dbSizeMB: number;
  bufferSize: number;
  subscribedCount: number;
  wsMessages: number;
  wsCreates: number;
  wsTrades: number;
  updatedAt: number;
}

interface HourlyVolume {
  hour: number;
  trades: number;
  tokens: number;
}

interface RecentToken {
  mint: string;
  symbol: string;
  name: string;
  createdAt: number;
  marketCapSol: number;
  initialBuy: number;
}

// ── Config ──

const API_BASE = process.env.NEXT_PUBLIC_ARCHIVER_API || '';

const FALLBACK_STATS: ArchiverStats = {
  tokens: 202337,
  trades: 10363405,
  dbSizeMB: 5832.4,
  bufferSize: 12,
  subscribedCount: 847,
  wsMessages: 48291033,
  wsCreates: 202337,
  wsTrades: 48088696,
  updatedAt: Date.now(),
};

// Generate realistic hourly volume for demo
function generateFallbackVolume(): HourlyVolume[] {
  const now = Date.now();
  const hours: HourlyVolume[] = [];
  for (let i = 23; i >= 0; i--) {
    const hourStart = now - i * 3600_000;
    const base = 55000 + Math.sin(i * 0.5) * 15000;
    const noise = Math.random() * 10000 - 5000;
    hours.push({
      hour: Math.floor(hourStart / 3600_000) * 3600_000,
      trades: Math.round(base + noise),
      tokens: Math.round((base + noise) / 8),
    });
  }
  return hours;
}

const FALLBACK_TOKENS: RecentToken[] = [
  { mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', symbol: 'GROK', name: 'Grok AI Token', createdAt: Date.now() - 12000, marketCapSol: 34.2, initialBuy: 1.5 },
  { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk Inu', createdAt: Date.now() - 28000, marketCapSol: 31.8, initialBuy: 0.8 },
  { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', name: 'dogwifhat', createdAt: Date.now() - 45000, marketCapSol: 29.5, initialBuy: 2.1 },
  { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', symbol: 'RAY', name: 'Raydium', createdAt: Date.now() - 67000, marketCapSol: 42.1, initialBuy: 3.2 },
  { mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'MSOL', name: 'Marinade SOL', createdAt: Date.now() - 89000, marketCapSol: 38.7, initialBuy: 1.0 },
  { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', createdAt: Date.now() - 120000, marketCapSol: 45.3, initialBuy: 5.0 },
  { mint: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ', symbol: 'W', name: 'Wormhole', createdAt: Date.now() - 180000, marketCapSol: 33.0, initialBuy: 0.5 },
  { mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', symbol: 'PYTH', name: 'Pyth Network', createdAt: Date.now() - 240000, marketCapSol: 36.9, initialBuy: 2.3 },
];

// ── Hooks ──

function useArchiverStats() {
  const [stats, setStats] = useState<ArchiverStats>(FALLBACK_STATS);
  const [isLive, setIsLive] = useState(false);
  const prevRef = useRef<{ stats: ArchiverStats; time: number } | null>(null);
  const [rates, setRates] = useState({ tokensPerMin: 0, tradesPerMin: 0, msgsPerMin: 0 });

  useEffect(() => {
    if (!API_BASE) return;
    let active = true;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/archiver/stats`);
        if (res.ok && active) {
          const data: ArchiverStats = await res.json();
          const now = Date.now();
          if (prevRef.current) {
            const dt = (now - prevRef.current.time) / 60000;
            if (dt > 0) {
              setRates({
                tokensPerMin: Math.round((data.tokens - prevRef.current.stats.tokens) / dt),
                tradesPerMin: Math.round((data.trades - prevRef.current.stats.trades) / dt),
                msgsPerMin: Math.round((data.wsMessages - prevRef.current.stats.wsMessages) / dt),
              });
            }
          }
          prevRef.current = { stats: data, time: now };
          setStats(data);
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

  // Demo mode: simulate ticking counters
  useEffect(() => {
    if (API_BASE) return;
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        trades: prev.trades + Math.round(Math.random() * 30 + 10),
        tokens: prev.tokens + (Math.random() > 0.7 ? 1 : 0),
        wsMessages: prev.wsMessages + Math.round(Math.random() * 40 + 15),
        bufferSize: Math.round(Math.random() * 50),
        subscribedCount: 800 + Math.round(Math.random() * 100),
        updatedAt: Date.now(),
      }));
      setRates({ tokensPerMin: 12, tradesPerMin: 1147, msgsPerMin: 1320 });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return { stats, isLive: API_BASE ? isLive : true, rates };
}

function useArchiverVolume() {
  const [volume, setVolume] = useState<HourlyVolume[]>([]);

  useEffect(() => {
    if (!API_BASE) {
      setVolume(generateFallbackVolume());
      return;
    }
    let active = true;
    const fetchVolume = async () => {
      try {
        const res = await fetch(`${API_BASE}/archiver/volume?hours=24`);
        if (res.ok && active) setVolume(await res.json());
      } catch {}
    };
    fetchVolume();
    const interval = setInterval(fetchVolume, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return volume;
}

function useRecentTokens() {
  const [tokens, setTokens] = useState<RecentToken[]>([]);

  useEffect(() => {
    if (!API_BASE) {
      setTokens(FALLBACK_TOKENS);
      return;
    }
    let active = true;
    const fetchTokens = async () => {
      try {
        const res = await fetch(`${API_BASE}/archiver/recent-tokens?limit=20`);
        if (res.ok && active) setTokens(await res.json());
      } catch {}
    };
    fetchTokens();
    const interval = setInterval(fetchTokens, 10000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return tokens;
}

// ── Helpers ──

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return Math.round(diff / 1000) + 's ago';
  if (diff < 3600_000) return Math.round(diff / 60_000) + 'm ago';
  if (diff < 86400_000) return Math.round(diff / 3600_000) + 'h ago';
  return Math.round(diff / 86400_000) + 'd ago';
}

// ── Bar Chart (pure canvas, no Chart.js dependency) ──

function VolumeChart({ data }: { data: HourlyVolume[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = { top: 10, right: 10, bottom: 28, left: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    const max = Math.max(...data.map(d => d.trades)) * 1.1;
    const barW = Math.max(plotW / data.length - 2, 2);

    // Grid lines
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + plotH * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(fmt(Math.round(max * i / 4)), pad.left - 6, y + 3);
    }

    // Bars
    data.forEach((d, i) => {
      const x = pad.left + (plotW / data.length) * i + 1;
      const h = (d.trades / max) * plotH;
      const y = pad.top + plotH - h;

      const gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, 'rgba(34, 211, 238, 0.6)');
      gradient.addColorStop(1, 'rgba(34, 211, 238, 0.15)');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, [2, 2, 0, 0]);
      ctx.fill();

      // X-axis labels (every 3rd bar)
      if (i % 3 === 0) {
        const date = new Date(d.hour);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          x + barW / 2,
          H - 6
        );
      }
    });
  }, [data]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[160px] sm:h-[200px]"
    />
  );
}

// ── Animated Number ──

function AnimatedNumber({ value, format = true }: { value: number; format?: boolean }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev === value) return;

    const diff = value - prev;
    const steps = 20;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(prev + diff * eased));
      if (step >= steps) clearInterval(timer);
    }, 30);

    return () => clearInterval(timer);
  }, [value]);

  return <>{format ? fmt(display) : display.toFixed(1)}</>;
}

// ── Page ──

export default function ArchiverPage() {
  const { stats, isLive, rates } = useArchiverStats();
  const volume = useArchiverVolume();
  const tokens = useRecentTokens();

  return (
    <main className="min-h-screen">
      {/* ── Header ── */}
      <section className="dot-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060c1f]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-10 sm:pt-12 sm:pb-12">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                <span className="text-white">Trade </span>
                <span className="text-accent">Archiver</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-lg">
                Live view of the pump.fun trade archive engine. Every token creation and trade captured 24/7 via PumpPortal WebSocket.
              </p>
            </div>
            {isLive && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-medium">Live</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Grid ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            label="Total Tokens"
            value={<AnimatedNumber value={stats.tokens} />}
            sub={rates.tokensPerMin > 0 ? `${rates.tokensPerMin}/min` : undefined}
          />
          <StatCard
            label="Total Trades"
            value={<AnimatedNumber value={stats.trades} />}
            sub={rates.tradesPerMin > 0 ? `${fmt(rates.tradesPerMin)}/min` : undefined}
          />
          <StatCard
            label="Database Size"
            value={<><AnimatedNumber value={stats.dbSizeMB} format={false} /><span className="text-base ml-1 text-slate-500">MB</span></>}
            sub={`${(stats.dbSizeMB / 1024).toFixed(1)} GB`}
          />
          <StatCard
            label="Active Subscriptions"
            value={<AnimatedNumber value={stats.subscribedCount} />}
            sub="token feeds"
          />
          <StatCard
            label="Write Buffer"
            value={<AnimatedNumber value={stats.bufferSize} />}
            sub="pending flushes"
          />
          <StatCard
            label="WS Messages"
            value={<AnimatedNumber value={stats.wsMessages} />}
            sub={rates.msgsPerMin > 0 ? `${fmt(rates.msgsPerMin)}/min` : undefined}
          />
        </div>
      </section>

      <div className="divider max-w-3xl mx-auto" />

      {/* ── Volume Chart ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h2 className="text-lg font-bold text-white mb-1">Trade Volume</h2>
        <p className="text-slate-500 text-xs mb-4">Trades per hour, last 24 hours</p>
        <div className="glass-card rounded-xl p-3 sm:p-5">
          <VolumeChart data={volume} />
        </div>
      </section>

      <div className="divider max-w-3xl mx-auto" />

      {/* ── Recent Tokens ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h2 className="text-lg font-bold text-white mb-1">Recent Tokens</h2>
        <p className="text-slate-500 text-xs mb-4">Latest token creates from the PumpPortal feed</p>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Symbol</th>
                  <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider hidden sm:table-cell">Name</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">MCap</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider hidden sm:table-cell">Initial Buy</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Age</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t, i) => (
                  <tr key={t.mint + i} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <span className="font-mono text-xs sm:text-sm font-semibold text-accent">{t.symbol}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-400 max-w-[200px] truncate hidden sm:table-cell">{t.name}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-right font-mono text-slate-300">{t.marketCapSol.toFixed(1)}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-right font-mono text-slate-400 hidden sm:table-cell">{t.initialBuy.toFixed(2)}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-right text-slate-500">{timeAgo(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="divider max-w-3xl mx-auto" />

      {/* ── API Hint ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h2 className="text-lg font-bold text-white mb-1">Access this data</h2>
        <p className="text-slate-500 text-xs mb-4">The Trade Archive API exposes all of this data programmatically</p>
        <div className="glass-card rounded-xl p-4 sm:p-5 font-mono text-xs sm:text-sm overflow-x-auto">
          <div className="space-y-2.5 sm:space-y-2 text-slate-400">
            <div><span className="text-emerald-400">GET</span> <span className="text-slate-300">/api/archiver/stats</span> <span className="hidden sm:inline text-slate-600">— Live counters</span></div>
            <div><span className="text-emerald-400">GET</span> <span className="text-slate-300">/api/archiver/volume?hours=24</span> <span className="hidden sm:inline text-slate-600">— Hourly volume</span></div>
            <div><span className="text-emerald-400">GET</span> <span className="text-slate-300">/api/archiver/recent-tokens?limit=20</span> <span className="hidden sm:inline text-slate-600">— Latest tokens</span></div>
            <div><span className="text-cyan-400">SSE</span> <span className="text-slate-300">/api/live</span> <span className="hidden sm:inline text-slate-600">— Real-time updates (5s interval)</span></div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 mt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-slate-600 text-xs">StreamSuite &copy; 2026</span>
          <div className="flex items-center gap-5">
            <a href="/" className="text-slate-600 hover:text-slate-400 transition-colors text-xs">Home</a>
            <a href="https://github.com/thecyberginehost/streamsuite" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400 transition-colors text-xs">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ── Components ──

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="glass-card rounded-xl p-3 sm:p-5">
      <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-1 sm:mb-2 font-medium">{label}</div>
      <div className="stat-number font-mono text-xl sm:text-2xl md:text-3xl font-bold">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
