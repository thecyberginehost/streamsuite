'use client';

import { useState } from 'react';

// ── Types ──

interface Endpoint {
  method: string;
  path: string;
  title: string;
  description: string;
  params?: { name: string; type: string; default: string; description: string }[];
  response: string;
  example: {
    curl: string;
    js: string;
    python: string;
  };
}

// ── Endpoint Data ──

const BASE_URL = 'https://streamsuite.io';

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/archiver/stats',
    title: 'Platform Statistics',
    description: 'Returns live platform-wide statistics including total trades archived, tokens tracked, unique wallets analyzed, and smart wallet count. Updated every 60 seconds.',
    response: `{
  "tokens": 271878,
  "trades": 14546141,
  "dbSizeMB": 3984.5,
  "bufferSize": 20,
  "subscribedCount": 76,
  "wsMessages": 1567,
  "wsCreates": 76,
  "wsTrades": 1414,
  "wallets": 429404,
  "smartWallets": 2282,
  "updatedAt": 1772764354147
}`,
    example: {
      curl: `curl ${BASE_URL}/api/archiver/stats`,
      js: `const res = await fetch('${BASE_URL}/api/archiver/stats');
const data = await res.json();
console.log(data.trades);  // 14546141
console.log(data.wallets); // 429404`,
      python: `import requests

data = requests.get('${BASE_URL}/api/archiver/stats').json()
print(f"Trades: {data['trades']:,}")
print(f"Wallets: {data['wallets']:,}")`,
    },
  },
  {
    method: 'GET',
    path: '/api/archiver/volume',
    title: 'Hourly Trade Volume',
    description: 'Returns hourly aggregated trade volume and token counts. Useful for charting activity over time.',
    params: [
      { name: 'hours', type: 'integer', default: '24', description: 'Number of hours to look back (1-168)' },
    ],
    response: `[
  {
    "hour": 1772712000000,
    "trades": 18432,
    "tokens": 2841
  },
  {
    "hour": 1772715600000,
    "trades": 21087,
    "tokens": 3102
  }
]`,
    example: {
      curl: `curl "${BASE_URL}/api/archiver/volume?hours=24"`,
      js: `const res = await fetch('${BASE_URL}/api/archiver/volume?hours=24');
const hourly = await res.json();

hourly.forEach(h => {
  const time = new Date(h.hour).toISOString();
  console.log(\`\${time}: \${h.trades} trades, \${h.tokens} tokens\`);
});`,
      python: `import requests
from datetime import datetime

hourly = requests.get('${BASE_URL}/api/archiver/volume', params={'hours': 24}).json()
for h in hourly:
    time = datetime.fromtimestamp(h['hour'] / 1000).strftime('%H:%M')
    print(f"{time}: {h['trades']} trades, {h['tokens']} tokens")`,
    },
  },
  {
    method: 'GET',
    path: '/api/archiver/recent-tokens',
    title: 'Recent Token Launches',
    description: 'Returns the most recently created pump.fun tokens with metadata including symbol, name, market cap, and initial buy size.',
    params: [
      { name: 'limit', type: 'integer', default: '20', description: 'Number of tokens to return (1-100)' },
    ],
    response: `[
  {
    "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "symbol": "SAMO",
    "name": "Samoyed Coin",
    "createdAt": 1772764200000,
    "marketCapSol": 32.5,
    "initialBuy": 1.2
  }
]`,
    example: {
      curl: `curl "${BASE_URL}/api/archiver/recent-tokens?limit=10"`,
      js: `const res = await fetch('${BASE_URL}/api/archiver/recent-tokens?limit=10');
const tokens = await res.json();

tokens.forEach(t => {
  console.log(\`\${t.symbol} — \${t.marketCapSol.toFixed(1)} SOL mcap\`);
});`,
      python: `import requests

tokens = requests.get('${BASE_URL}/api/archiver/recent-tokens', params={'limit': 10}).json()
for t in tokens:
    print(f"{t['symbol']} — {t['marketCapSol']:.1f} SOL mcap")`,
    },
  },
  {
    method: 'GET',
    path: '/api/archiver/smart-wallets',
    title: 'Smart Wallet List',
    description: 'Returns the full list of wallets that passed the smart wallet qualification criteria: minimum 5 tokens traded, 2+ moonshots (>100% gain), 15%+ moonshot rate, 40%+ hit rate, and 2+ unique symbols. Rescored every 30 minutes from a 30-day rolling window of on-chain data.',
    response: `{
  "count": 2282,
  "wallets": [
    "BMtqyA1oKXYhnBwzbqXsUx92ptcLGHFk8w2QfgEgWivq",
    "9hCDxo3UF9PZ8gNv1LfztUA9B4GRMGq6L5mDHwLwEGnB",
    "..."
  ],
  "updatedAt": 1772764354478
}`,
    example: {
      curl: `curl ${BASE_URL}/api/archiver/smart-wallets`,
      js: `const res = await fetch('${BASE_URL}/api/archiver/smart-wallets');
const { count, wallets, updatedAt } = await res.json();

console.log(\`\${count} smart wallets (updated \${new Date(updatedAt).toISOString()})\`);

// Check if a specific wallet is smart
const target = 'BMtqyA1oKXYhnBwzbqXsUx92ptcLGHFk8w2QfgEgWivq';
console.log(\`\${target}: \${wallets.includes(target) ? 'SMART' : 'not qualified'}\`);`,
      python: `import requests

data = requests.get('${BASE_URL}/api/archiver/smart-wallets').json()
print(f"{data['count']} smart wallets")

# Check if a wallet is smart
target = 'BMtqyA1oKXYhnBwzbqXsUx92ptcLGHFk8w2QfgEgWivq'
print(f"{target}: {'SMART' if target in data['wallets'] else 'not qualified'}")`,
    },
  },
  {
    method: 'GET',
    path: '/api/archiver/wallet/:addr',
    title: 'Wallet Reputation Lookup',
    description: 'Look up any wallet address to check if it is a qualified smart wallet and see its trading activity summary: total trades, unique tokens, SOL volume, and first/last seen timestamps.',
    params: [
      { name: 'addr', type: 'string', default: '(required)', description: 'Solana wallet address (base58, 32-44 chars)' },
    ],
    response: `{
  "address": "BMtqyA1oKXYhnBwzbqXsUx92ptcLGHFk8w2QfgEgWivq",
  "isSmartWallet": true,
  "found": true,
  "totalTrades": 24,
  "uniqueTokens": 18,
  "totalBuySol": 30.429,
  "totalSellSol": 6.595,
  "firstSeen": 1771741523883,
  "lastSeen": 1772710242675
}`,
    example: {
      curl: `curl ${BASE_URL}/api/archiver/wallet/BMtqyA1oKXYhnBwzbqXsUx92ptcLGHFk8w2QfgEgWivq`,
      js: `const addr = 'BMtqyA1oKXYhnBwzbqXsUx92ptcLGHFk8w2QfgEgWivq';
const res = await fetch(\`${BASE_URL}/api/archiver/wallet/\${addr}\`);
const wallet = await res.json();

if (wallet.found) {
  console.log(\`Smart wallet: \${wallet.isSmartWallet}\`);
  console.log(\`Trades: \${wallet.totalTrades} across \${wallet.uniqueTokens} tokens\`);
  console.log(\`Volume: \${wallet.totalBuySol} SOL bought, \${wallet.totalSellSol} SOL sold\`);
} else {
  console.log('Wallet not found in archive');
}`,
      python: `import requests

addr = 'BMtqyA1oKXYhnBwzbqXsUx92ptcLGHFk8w2QfgEgWivq'
wallet = requests.get(f'${BASE_URL}/api/archiver/wallet/{addr}').json()

if wallet['found']:
    status = 'SMART' if wallet['isSmartWallet'] else 'Regular'
    print(f"[{status}] {wallet['totalTrades']} trades, {wallet['uniqueTokens']} tokens")
    print(f"Volume: {wallet['totalBuySol']} SOL bought, {wallet['totalSellSol']} SOL sold")
else:
    print('Wallet not found in archive')`,
    },
  },
];

// ── Code Tab Component ──

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-[#0a1128] rounded-lg p-4 text-xs sm:text-sm overflow-x-auto text-slate-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function TabbedCode({ example }: { example: Endpoint['example'] }) {
  const [tab, setTab] = useState<'curl' | 'js' | 'python'>('curl');

  const tabs: { key: 'curl' | 'js' | 'python'; label: string }[] = [
    { key: 'curl', label: 'cURL' },
    { key: 'js', label: 'JavaScript' },
    { key: 'python', label: 'Python' },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === t.key
                ? 'bg-accent/15 text-accent border border-accent/20'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CodeBlock code={example[tab]} lang={tab} />
    </div>
  );
}

// ── Endpoint Section ──

function EndpointSection({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div id={endpoint.path.replace(/[/:]/g, '-').replace(/^-/, '')} className="scroll-mt-16">
      <div className="glass-card rounded-xl p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
            {endpoint.method}
          </span>
          <code className="text-sm sm:text-base text-white font-mono break-all">{endpoint.path}</code>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">{endpoint.title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">{endpoint.description}</p>

        {/* Parameters */}
        {endpoint.params && endpoint.params.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Parameters</h4>
            <div className="bg-[#0a1128] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs">Name</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs">Type</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs">Default</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs hidden sm:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((p) => (
                    <tr key={p.name} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2 font-mono text-accent text-xs">{p.name}</td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{p.type}</td>
                      <td className="px-4 py-2 text-slate-500 font-mono text-xs">{p.default}</td>
                      <td className="px-4 py-2 text-slate-400 text-xs hidden sm:table-cell">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Example Request */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Example Request</h4>
          <TabbedCode example={endpoint.example} />
        </div>

        {/* Example Response */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Example Response</h4>
          <CodeBlock code={endpoint.response} lang="json" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──

export default function DocsPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">API Documentation</h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
          Free, open API for Solana pump.fun market data. No API key required.
          All endpoints return JSON and support CORS for browser-based applications.
        </p>
      </section>

      <div className="divider max-w-2xl mx-auto" />

      {/* Quick Start */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Quick Start</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">
          The API is available at <code className="text-accent bg-accent/10 px-1.5 py-0.5 rounded text-xs">{BASE_URL}</code>.
          No authentication needed. Just make an HTTP request from any language, tool, or browser.
        </p>

        <div className="space-y-5">
          {/* Try in browser */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Try It in Your Browser</h3>
            <p className="text-slate-400 text-sm mb-3">
              The simplest way to see the API in action. Just click or paste this URL into your browser address bar:
            </p>
            <CodeBlock
              code={`${BASE_URL}/api/archiver/stats`}
              lang="text"
            />
          </div>

          {/* Terminal */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">From Your Terminal</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-500">macOS / Linux</span>
                </div>
                <p className="text-slate-400 text-xs mb-2">
                  Open Terminal (macOS: Cmd+Space, type &quot;Terminal&quot;) or any Linux terminal.
                  <code className="text-accent bg-accent/10 px-1 py-0.5 rounded ml-1">curl</code> is pre-installed.
                </p>
                <CodeBlock code={`curl ${BASE_URL}/api/archiver/stats`} lang="bash" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-500">Windows</span>
                </div>
                <p className="text-slate-400 text-xs mb-2">
                  Open PowerShell (Win+X, select &quot;Windows PowerShell&quot;) or Command Prompt.
                </p>
                <CodeBlock code={`curl ${BASE_URL}/api/archiver/stats`} lang="bash" />
                <p className="text-slate-500 text-xs mt-2">
                  Windows 10+ includes curl. On older versions, use <code className="text-accent bg-accent/10 px-1 py-0.5 rounded">Invoke-WebRequest</code> in PowerShell instead.
                </p>
              </div>
            </div>
          </div>

          {/* Code */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">From Your Code</h3>
            <TabbedCode
              example={{
                curl: `curl ${BASE_URL}/api/archiver/stats`,
                js: `// Node.js / Browser — no packages needed
const res = await fetch('${BASE_URL}/api/archiver/stats');
const stats = await res.json();
console.log(\`\${stats.trades.toLocaleString()} trades archived\`);
console.log(\`\${stats.smartWallets} smart wallets qualified\`);`,
                python: `# pip install requests
import requests

stats = requests.get('${BASE_URL}/api/archiver/stats').json()
print(f"{stats['trades']:,} trades archived")
print(f"{stats['smartWallets']} smart wallets qualified")`,
              }}
            />
          </div>
        </div>
      </section>

      <div className="divider max-w-2xl mx-auto" />

      {/* Base URL */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Base URL</h2>
        <CodeBlock code={BASE_URL} lang="text" />
        <div className="mt-4 space-y-2 text-sm text-slate-400">
          <p><span className="text-white font-medium">Rate limit:</span> 50 requests per second per IP</p>
          <p><span className="text-white font-medium">Auth:</span> None required (public API)</p>
          <p><span className="text-white font-medium">Format:</span> All responses are JSON with <code className="text-accent bg-accent/10 px-1 py-0.5 rounded text-xs">Content-Type: application/json</code></p>
          <p><span className="text-white font-medium">CORS:</span> Enabled for all origins</p>
        </div>
      </section>

      <div className="divider max-w-2xl mx-auto" />

      {/* Endpoints */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">Endpoints</h2>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
            {ENDPOINTS.length} live
          </span>
        </div>

        {/* Quick nav */}
        <div className="glass-card rounded-xl p-4 mb-8">
          <div className="space-y-2 font-mono text-xs sm:text-sm">
            {ENDPOINTS.map((ep) => (
              <a
                key={ep.path}
                href={`#${ep.path.replace(/[/:]/g, '-').replace(/^-/, '')}`}
                className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
              >
                <span className="text-emerald-400 font-bold w-8 shrink-0">{ep.method}</span>
                <span className="text-slate-300">{ep.path}</span>
                <span className="text-slate-600 hidden sm:inline">— {ep.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Endpoint details */}
        <div className="space-y-8">
          {ENDPOINTS.map((ep) => (
            <EndpointSection key={ep.path} endpoint={ep} />
          ))}
        </div>
      </section>

      <div className="divider max-w-2xl mx-auto" />

      {/* Coming Soon */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Coming Soon</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">
          These endpoints are planned and under development. They are not yet available.
        </p>
        <div className="glass-card rounded-xl p-4 font-mono text-xs sm:text-sm">
          <div className="space-y-2.5 text-slate-500">
            <div><span className="text-emerald-400/40">GET</span> <span className="text-slate-500">/api/trades</span> <span className="hidden sm:inline text-slate-600">— Historical trade queries with filtering</span></div>
            <div><span className="text-emerald-400/40">GET</span> <span className="text-slate-500">/api/tokens/:mint</span> <span className="hidden sm:inline text-slate-600">— Token trade history + metrics</span></div>
            <div><span className="text-emerald-400/40">GET</span> <span className="text-slate-500">/api/trending</span> <span className="hidden sm:inline text-slate-600">— Real-time trending tokens with momentum scores</span></div>
            <div><span className="text-emerald-400/40">GET</span> <span className="text-slate-500">/api/export</span> <span className="hidden sm:inline text-slate-600">— Parquet data export (self-serve historical data)</span></div>
          </div>
        </div>
      </section>

      <div className="divider max-w-2xl mx-auto" />

      {/* Response Codes */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Response Codes</h2>
        <div className="bg-[#0a1128] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs">Code</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              <tr className="border-b border-white/5"><td className="px-4 py-2 font-mono text-emerald-400">200</td><td className="px-4 py-2">Success</td></tr>
              <tr className="border-b border-white/5"><td className="px-4 py-2 font-mono text-yellow-400">400</td><td className="px-4 py-2">Bad request (invalid parameters)</td></tr>
              <tr className="border-b border-white/5"><td className="px-4 py-2 font-mono text-yellow-400">429</td><td className="px-4 py-2">Rate limited (too many requests)</td></tr>
              <tr><td className="px-4 py-2 font-mono text-red-400">500</td><td className="px-4 py-2">Server error</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
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
