'use client';

import { useEffect, useRef, useState } from 'react';

const PING_URL = 'https://va-bsc-01.streamsuite.io/api/ping';
const IP_PROBE_URL = 'https://va-bsc-01.streamsuite.io/api/ip-probe';
const NUM_PINGS = 30;
const WARMUP_PINGS = 3;

type Mode = 'device' | 'vps';
type TestState = 'idle' | 'running' | 'done' | 'error';

type Result = {
  min: number;
  p50: number;
  p95: number;
  max: number;
  errors: number;
  source: 'browser' | 'server';
};

function quantile(sorted: number[], q: number): number {
  const i = Math.min(sorted.length - 1, Math.floor(sorted.length * q));
  return sorted[i];
}

async function singlePing(): Promise<number> {
  const t0 = performance.now();
  const res = await fetch(PING_URL, { cache: 'no-store', credentials: 'omit' });
  await res.text();
  const t1 = performance.now();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return t1 - t0;
}

function fmt(n: number): string {
  if (n < 1) return n.toFixed(2);
  if (n < 10) return n.toFixed(1);
  return Math.round(n).toString();
}

function ratingLabel(p50: number): { label: string; color: string } {
  if (p50 < 5) return { label: 'EXCELLENT', color: 'text-accent' };
  if (p50 < 20) return { label: 'GREAT', color: 'text-accent-bright' };
  if (p50 < 60) return { label: 'GOOD', color: 'text-cyan' };
  if (p50 < 150) return { label: 'OK', color: 'text-yellow-400' };
  return { label: 'HIGH', color: 'text-orange-400' };
}

export default function LatencyTester() {
  const [mode, setMode] = useState<Mode>('device');
  const [state, setState] = useState<TestState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveSamples, setLiveSamples] = useState<number[]>([]);
  const [vpsIp, setVpsIp] = useState('');
  const [vpsPort, setVpsPort] = useState<'443' | '80'>('443');
  const abortRef = useRef(false);

  function reset() {
    setState('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    setLiveSamples([]);
  }

  async function runDeviceTest() {
    setState('running');
    setProgress(0);
    setResult(null);
    setError(null);
    setLiveSamples([]);
    abortRef.current = false;

    const samples: number[] = [];
    let errors = 0;

    try {
      for (let i = 0; i < WARMUP_PINGS; i++) {
        if (abortRef.current) return;
        try { await singlePing(); } catch {}
      }
      for (let i = 0; i < NUM_PINGS; i++) {
        if (abortRef.current) return;
        try {
          const ms = await singlePing();
          samples.push(ms);
          setLiveSamples((s) => [...s, ms]);
        } catch {
          errors++;
        }
        setProgress(((i + 1) / NUM_PINGS) * 100);
        await new Promise((r) => setTimeout(r, 30));
      }
      if (samples.length === 0) {
        setState('error');
        setError('All requests failed — check your connection or VPN.');
        return;
      }
      const sorted = [...samples].sort((a, b) => a - b);
      setResult({
        min: sorted[0],
        p50: quantile(sorted, 0.5),
        p95: quantile(sorted, 0.95),
        max: sorted[sorted.length - 1],
        errors,
        source: 'browser',
      });
      setState('done');
    } catch (e: any) {
      setState('error');
      setError(String(e?.message || e));
    }
  }

  async function runVpsTest() {
    const ip = vpsIp.trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      setState('error');
      setError('Enter a valid IPv4 address (e.g., 203.0.113.42)');
      return;
    }
    setState('running');
    setProgress(0);
    setResult(null);
    setError(null);
    setLiveSamples([]);

    const start = Date.now();
    const fakeProgress = setInterval(() => {
      const t = Math.min(95, ((Date.now() - start) / 3500) * 100);
      setProgress(t);
    }, 100);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20_000);
      const res = await fetch(
        `${IP_PROBE_URL}?ip=${encodeURIComponent(ip)}&port=${vpsPort}&count=10`,
        { cache: 'no-store', credentials: 'omit', signal: controller.signal },
      );
      clearTimeout(timeoutId);
      clearInterval(fakeProgress);

      // Read raw body — server might return a non-JSON body on rate-limit etc.
      const raw = await res.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch {}

      if (res.status === 429) {
        setState('error');
        setError('Rate limited — please wait a minute and try again. (Public probes are capped at 10/min per IP.)');
        return;
      }
      if (!res.ok) {
        setState('error');
        setError(`Server returned HTTP ${res.status}${raw ? ` — ${raw.slice(0, 120)}` : ''}`);
        return;
      }
      if (!data || data.error || data.ok === false) {
        setState('error');
        setError(
          (data && data.error) ||
          'Probe failed — the IP didn\'t respond on the chosen port. Try the other port (80 ↔ 443).'
        );
        return;
      }
      setProgress(100);
      setResult({
        min: data.min_ms,
        p50: data.p50_ms,
        p95: data.p95_ms,
        max: data.max_ms,
        errors: (data.attempted ?? 0) - (data.reachable ?? 0),
        source: 'server',
      });
      setState('done');
    } catch (e: any) {
      clearInterval(fakeProgress);
      setState('error');
      const msg = String(e?.message || e);
      if (msg.includes('abort') || msg.includes('Abort')) {
        setError('Request timed out (20s). The IP may not be responding.');
      } else if (msg.toLowerCase().includes('failed to fetch')) {
        setError('Network error reaching va-bsc-01.streamsuite.io. Check connection and try again.');
      } else {
        setError(msg);
      }
    }
  }

  function run() {
    if (mode === 'device') runDeviceTest();
    else runVpsTest();
  }

  useEffect(() => {
    return () => { abortRef.current = true; };
  }, []);

  const rating = result ? ratingLabel(result.p50) : null;

  return (
    <div className="card p-5 sm:p-7 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-accent/90">
          ── latency tester ──
        </p>
        <span className="font-mono text-[10px] text-muted">va-bsc-01 · ashburn, va</span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-5 p-1 bg-bg border border-border rounded-md">
        <button
          onClick={() => { setMode('device'); reset(); }}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-mono uppercase tracking-wider rounded-sm transition-colors ${
            mode === 'device' ? 'bg-accent text-bg' : 'text-muted hover:text-ink'
          }`}
        >
          From this device
        </button>
        <button
          onClick={() => { setMode('vps'); reset(); }}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-mono uppercase tracking-wider rounded-sm transition-colors ${
            mode === 'vps' ? 'bg-accent text-bg' : 'text-muted hover:text-ink'
          }`}
        >
          From a VPS IP
        </button>
      </div>

      {state === 'idle' && mode === 'device' && (
        <div className="text-center py-2">
          <p className="text-muted text-sm mb-5">
            30 quick round-trips from this device to our BSC node.
            Mobile / wifi will see your network last-mile latency.
            Your <strong className="text-ink">bot</strong> running on a VPS will see lower.
          </p>
          <button onClick={run} className="btn-primary !py-3 !px-6 w-full sm:w-auto">
            Test from this device →
          </button>
        </div>
      )}

      {state === 'idle' && mode === 'vps' && (
        <div className="py-2">
          <p className="text-muted text-sm mb-4">
            Enter the public IP of the VPS where your bot will run. We&apos;ll
            measure TCP handshake time from our Ashburn node to that IP.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 mb-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={vpsIp}
              onChange={(e) => setVpsIp(e.target.value)}
              placeholder="203.0.113.42"
              className="input !py-2 font-mono text-sm"
            />
            <select
              value={vpsPort}
              onChange={(e) => setVpsPort(e.target.value as '443' | '80')}
              className="input !py-2 !px-3 font-mono text-sm appearance-none sm:w-24"
            >
              <option value="443">:443</option>
              <option value="80">:80</option>
            </select>
            <button onClick={run} className="btn-primary !py-2 !px-4 text-sm">
              Test →
            </button>
          </div>
          <p className="text-xs text-muted">
            Your VPS must have port 80 or 443 open (most do — web server, monitoring, etc).
            Private/reserved IPs are rejected.
          </p>
        </div>
      )}

      {state === 'running' && (
        <div className="py-2">
          <div className="flex items-center justify-between mb-2 font-mono text-xs">
            <span className="text-accent">
              ● {mode === 'device' ? `pinging ${liveSamples.length}/${NUM_PINGS}` : `probing ${vpsIp}:${vpsPort}`}
            </span>
            <span className="text-muted">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-bg border border-border rounded-sm overflow-hidden mb-3">
            <div className="h-full bg-accent transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
          {mode === 'device' && liveSamples.length > 0 && (
            <div className="font-mono text-xs text-muted space-y-0.5 max-h-32 overflow-y-auto">
              {liveSamples.slice(-12).reverse().map((s, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-ink">ping</span>
                  <span>{fmt(s)}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {state === 'error' && (
        <div className="text-center py-3">
          <p className="text-red-400 font-mono text-sm mb-4 break-all">{error}</p>
          <button onClick={reset} className="btn-ghost !py-2 !px-4 text-sm">Try again</button>
        </div>
      )}

      {state === 'done' && result && rating && (
        <div>
          <div className="text-center mb-5">
            <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${rating.color} mb-2`}>
              {rating.label}
            </p>
            <p className="font-mono text-4xl sm:text-5xl text-ink leading-none mb-1">
              {fmt(result.p50)}<span className="text-2xl sm:text-3xl text-muted">ms</span>
            </p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {result.source === 'browser' ? 'median round-trip from this device' : `median TCP handshake · va-bsc-01 → ${vpsIp}:${vpsPort}`}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
            <Stat label="min" value={`${fmt(result.min)}ms`} />
            <Stat label="p50" value={`${fmt(result.p50)}ms`} />
            <Stat label="p95" value={`${fmt(result.p95)}ms`} />
            <Stat label="max" value={`${fmt(result.max)}ms`} />
          </div>

          <div className="bg-bg border border-border rounded-md p-3 sm:p-4 mb-5 font-mono text-xs">
            <p className="text-[10px] uppercase tracking-wider text-muted mb-2">── for context ──</p>
            {result.source === 'browser' ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Your round-trip (p50)</span>
                  <span className="text-ink">{fmt(result.p50)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Server-side processing</span>
                  <span className="text-ink">&lt;1ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">VPS in same DC (typical)</span>
                  <span className="text-ink">&lt;5ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Public BSC RPC (typical)</span>
                  <span className="text-muted opacity-70">~80–200ms</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">va-bsc-01 → {vpsIp} (p50)</span>
                  <span className="text-ink">{fmt(result.p50)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">RPC processing added</span>
                  <span className="text-ink">&lt;1ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Expected RPC RTT for your bot</span>
                  <span className="text-ink">~{fmt(result.p50 + 1)}ms</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={reset} className="btn-ghost !py-2 !px-4 text-sm flex-1">
              Run another test
            </button>
            <a href="/pricing#bsc" className="btn-primary !py-2 !px-4 text-sm flex-1 text-center">
              See plans →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg border border-border rounded-md p-2 sm:p-3 text-center">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-0.5">{label}</p>
      <p className="font-mono text-sm sm:text-base text-ink">{value}</p>
    </div>
  );
}
