'use client';

import { useEffect, useState } from 'react';

const STATS_API = 'https://va-bsc-01.streamsuite.io';

type StatsLite = {
  total_24h: number;
  blocked_24h: number;
  last_seen_ms: number | null;
};

function useStatsLite(apiKey: string) {
  const [stats, setStats] = useState<StatsLite | null>(null);
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const res = await fetch(`${STATS_API}/api/stats?key=${apiKey}`, { cache: 'no-store' });
        if (res.ok) {
          const d = await res.json();
          if (mounted) setStats(d);
        }
      } catch {}
      if (mounted) timeoutId = setTimeout(poll, 10_000);
    }
    poll();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [apiKey]);
  return stats;
}

// ── First-call welcome banner ──────────────────────────────────────────────
const KEY_PLACEHOLDER = 'YOUR_API_KEY';

function maskKeyInUrl(url: string, apiKey: string): string {
  return apiKey ? url.split(apiKey).join(KEY_PLACEHOLDER) : url;
}

export function FirstCallBanner({ apiKey, httpsUrl }: { apiKey: string; httpsUrl: string }) {
  const stats = useStatsLite(apiKey);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!stats) return null;
  if (stats.total_24h > 0) return null;

  const displayUrl = revealed ? httpsUrl : maskKeyInUrl(httpsUrl, apiKey);
  const realSnippet = `curl -X POST '${httpsUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`;
  const displaySnippet = `curl -X POST '${displayUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(realSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="card p-5 sm:p-6 mb-4 sm:mb-6 border-accent/30">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80 mb-2">
        ── make your first call ──
      </p>
      <h2 className="text-lg sm:text-xl font-semibold mb-2">Your endpoint is ready. Try it now.</h2>
      <p className="text-muted text-sm mb-4">
        Paste this in your terminal — the dashboard will switch to live mode once your first RPC call lands.
      </p>
      <div className="flex items-center justify-end gap-1.5 mb-2">
        <button
          onClick={() => setRevealed(!revealed)}
          className="px-2 py-1 text-[10px] uppercase tracking-wider font-mono text-muted hover:text-ink border border-border rounded-sm"
          aria-label={revealed ? 'Hide API key' : 'Reveal API key'}
        >
          {revealed ? 'Hide key' : 'Reveal key'}
        </button>
        <button
          onClick={copy}
          className="px-2 py-1 text-[10px] uppercase tracking-wider font-mono text-accent hover:text-accent-bright border border-border rounded-sm"
        >
          {copied ? '✓ Copied' : 'Copy (with key)'}
        </button>
      </div>
      <pre className="bg-bg border border-border rounded-md p-3 text-[10px] sm:text-xs font-mono overflow-x-auto">
        {displaySnippet}
      </pre>
    </div>
  );
}

// ── Upsell banner: Real-Time customer hit Mempool features ────────────────
export function UpsellBanner({ apiKey, tier }: { apiKey: string; tier: string }) {
  const stats = useStatsLite(apiKey);
  if (!stats || tier !== 'realtime' || stats.blocked_24h === 0) return null;

  return (
    <div className="card p-4 sm:p-5 mb-4 sm:mb-6 border-yellow-500/40 bg-yellow-500/[0.03]">
      <div className="flex items-start gap-3 sm:items-center">
        <span className="text-yellow-400 text-xl leading-none shrink-0 mt-0.5 sm:mt-0">⚡</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base">
            <span className="font-semibold">{stats.blocked_24h.toLocaleString()} Mempool-tier calls blocked</span>
            <span className="text-muted"> in the last 24h. Your bot wants tier features.</span>
          </p>
          <p className="text-xs text-muted mt-1">
            Upgrade to <span className="text-accent">Mempool</span> for `txpool_*` and pending-tx subscriptions.
          </p>
        </div>
        <a
          href="/pricing"
          className="btn-primary !py-2 !px-3 text-xs sm:text-sm shrink-0 whitespace-nowrap"
        >
          Upgrade →
        </a>
      </div>
    </div>
  );
}

// ── Bot-idle detector ──────────────────────────────────────────────────────
export function BotIdleNotice({ apiKey }: { apiKey: string }) {
  const stats = useStatsLite(apiKey);
  if (!stats || !stats.last_seen_ms) return null;
  const ageSec = Math.floor((Date.now() - stats.last_seen_ms) / 1000);
  if (ageSec < 5 * 60) return null; // less than 5 min idle — fine
  if (stats.total_24h === 0) return null; // never called — first-call banner handles this

  const ageStr =
    ageSec < 3600
      ? `${Math.floor(ageSec / 60)}m`
      : ageSec < 86400
      ? `${Math.floor(ageSec / 3600)}h`
      : `${Math.floor(ageSec / 86400)}d`;

  return (
    <div className="bg-bg border border-yellow-500/30 rounded-md p-3 mb-3 sm:mb-4 flex items-center gap-2 text-xs">
      <span className="text-yellow-400">○</span>
      <span className="text-muted">
        Your bot last called <span className="text-ink font-mono">{ageStr}</span> ago. Intentional?
      </span>
    </div>
  );
}

// ── Multi-language quickstart tabs ────────────────────────────────────────
const QS_LANGS = ['curl', 'JS', 'Python', 'Go'] as const;
type QsLang = (typeof QS_LANGS)[number];

function qsSnippet(lang: QsLang, httpsUrl: string, wsUrl: string): string {
  switch (lang) {
    case 'curl':
      return `curl -X POST '${httpsUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`;
    case 'JS':
      return `// ethers v6
import { JsonRpcProvider, WebSocketProvider } from 'ethers';

const http = new JsonRpcProvider('${httpsUrl}');
const block = await http.getBlockNumber();
console.log('block:', block);

// real-time over WS
const ws = new WebSocketProvider('${wsUrl}');
ws.on('block', n => console.log('new block:', n));`;
    case 'Python':
      return `# web3.py
from web3 import Web3

w3 = Web3(Web3.HTTPProvider('${httpsUrl}'))
print('block:', w3.eth.block_number)

# WebSocket
ws = Web3(Web3.WebsocketProvider('${wsUrl}'))
print('ws block:', ws.eth.block_number)`;
    case 'Go':
      return `// go-ethereum
package main

import (
    "context"
    "fmt"
    "github.com/ethereum/go-ethereum/ethclient"
)

func main() {
    c, err := ethclient.Dial("${httpsUrl}")
    if err != nil { panic(err) }
    n, _ := c.BlockNumber(context.Background())
    fmt.Println("block:", n)
}`;
  }
}

export function QuickstartTabs({
  apiKey,
  httpsUrl,
  wsUrl,
}: {
  apiKey: string;
  httpsUrl: string;
  wsUrl: string;
}) {
  const [active, setActive] = useState<QsLang>('curl');
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const displayHttps = revealed ? httpsUrl : maskKeyInUrl(httpsUrl, apiKey);
  const displayWs = revealed ? wsUrl : maskKeyInUrl(wsUrl, apiKey);
  const realCode = qsSnippet(active, httpsUrl, wsUrl);
  const displayCode = qsSnippet(active, displayHttps, displayWs);

  async function copy() {
    try {
      await navigator.clipboard.writeText(realCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-3 overflow-x-auto -mx-1 px-1">
        {QS_LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setActive(l)}
            className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-mono rounded-sm whitespace-nowrap transition-colors ${
              active === l ? 'bg-accent text-bg' : 'text-muted hover:text-ink border border-border'
            }`}
          >
            {l}
          </button>
        ))}
        <button
          onClick={() => setRevealed(!revealed)}
          className="ml-auto px-3 py-1.5 text-[11px] uppercase tracking-wider font-mono text-muted hover:text-ink border border-border rounded-sm shrink-0"
          aria-label={revealed ? 'Hide API key' : 'Reveal API key'}
        >
          {revealed ? 'Hide key' : 'Reveal key'}
        </button>
        <button
          onClick={copy}
          className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-mono text-accent hover:text-accent-bright border border-border rounded-sm shrink-0"
        >
          {copied ? '✓ Copied' : 'Copy (with key)'}
        </button>
      </div>
      <pre className="code-block text-[10px] sm:text-xs overflow-x-auto whitespace-pre">{displayCode}</pre>
    </div>
  );
}

// ── Inline RPC method playground ──────────────────────────────────────────
const PLAYGROUND_PRESETS: { method: string; params: string }[] = [
  { method: 'eth_blockNumber', params: '[]' },
  { method: 'eth_chainId', params: '[]' },
  { method: 'eth_gasPrice', params: '[]' },
  { method: 'eth_getBalance', params: '["0x0000000000000000000000000000000000000000","latest"]' },
  { method: 'eth_getBlockByNumber', params: '["latest", false]' },
  { method: 'net_version', params: '[]' },
];

export function MethodPlayground({ httpsUrl }: { httpsUrl: string }) {
  const [method, setMethod] = useState('eth_blockNumber');
  const [paramsStr, setParamsStr] = useState('[]');
  const [resp, setResp] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setErr(null);
    setResp('');
    setLatencyMs(null);
    let params: any;
    try {
      params = JSON.parse(paramsStr);
    } catch {
      setErr('params must be valid JSON');
      setRunning(false);
      return;
    }
    const t0 = performance.now();
    try {
      const res = await fetch(httpsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
      });
      const t1 = performance.now();
      setLatencyMs(t1 - t0);
      const text = await res.text();
      try {
        setResp(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResp(text);
      }
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">presets:</span>
        {PLAYGROUND_PRESETS.map((p) => (
          <button
            key={p.method}
            onClick={() => {
              setMethod(p.method);
              setParamsStr(p.params);
              setResp('');
              setLatencyMs(null);
            }}
            className="font-mono text-[10px] text-accent hover:text-accent-bright px-2 py-0.5 border border-border rounded-sm"
          >
            {p.method}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
        <input
          type="text"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          placeholder="method"
          className="input !py-2 font-mono text-sm"
        />
        <input
          type="text"
          value={paramsStr}
          onChange={(e) => setParamsStr(e.target.value)}
          placeholder="params (JSON)"
          className="input !py-2 font-mono text-sm"
        />
        <button onClick={run} disabled={running} className="btn-primary !py-2 !px-4 text-sm">
          {running ? 'Running…' : 'Run →'}
        </button>
      </div>
      {(resp || err || latencyMs !== null) && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">response</span>
            {latencyMs !== null && (
              <span className="font-mono text-[10px] text-accent">
                {latencyMs < 1 ? '<1ms' : latencyMs.toFixed(1) + 'ms'} round-trip
              </span>
            )}
          </div>
          {err ? (
            <pre className="bg-bg border border-red-500/40 rounded-md p-3 text-xs text-red-300 whitespace-pre-wrap break-all">
              {err}
            </pre>
          ) : (
            <pre className="bg-bg border border-border rounded-md p-3 text-[10px] sm:text-xs font-mono overflow-x-auto max-h-64 whitespace-pre">
              {resp}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── Billing portal button ─────────────────────────────────────────────────
export function BillingButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function open() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErr(data.error || 'Could not open billing portal');
        return;
      }
      window.location.href = data.url;
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <button onClick={open} disabled={loading} className="btn-ghost !py-2 !px-3 text-xs font-mono uppercase tracking-wider w-full">
        {loading ? 'Opening…' : 'Manage billing →'}
      </button>
      {err && <p className="text-xs text-red-400 mt-2 font-mono">{err}</p>}
    </div>
  );
}
