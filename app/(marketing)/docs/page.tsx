import Link from 'next/link';
import type { Metadata } from 'next';
import DocsTOC from '../../components/DocsTOC';
import { CodeBlock } from '../../components/CodeBlock';
import { CodeTabs } from '../../components/CodeTabs';

export const metadata: Metadata = {
  title: 'Docs | StreamSuite',
  description:
    'BSC RPC API reference. HTTP and WebSocket endpoints, supported methods by tier, migration from Alchemy/QuickNode/Chainstack, and code examples in TypeScript (viem), JavaScript (ethers.js), Python (web3.py), and Rust (alloy).',
};

type MethodRow = {
  method: string;
  anchor: string;   // stable hash fragment; primary canonical method name
  desc: string;
  realtime: boolean;
  mempool: boolean;
  fullnode: boolean;
};

// Each entry has an explicit anchor (lowercased, single canonical method).
// These are exposed at /docs#<anchor> and emitted in sitemap.ts so search
// engines index per-method "this provider supports X" pages.
const methods: MethodRow[] = [
  { method: 'eth_blockNumber',                       anchor: 'eth_blocknumber',         desc: 'Latest block number',                                  realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_getBlockByNumber / Hash',           anchor: 'eth_getblockbynumber',    desc: 'Block data',                                            realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_getTransactionByHash',              anchor: 'eth_gettransactionbyhash',desc: 'Transaction lookup',                                    realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_getTransactionReceipt',             anchor: 'eth_gettransactionreceipt',desc: 'Receipt (~4.5d history)',                              realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_getBalance',                        anchor: 'eth_getbalance',          desc: 'Account balance',                                       realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_getCode',                           anchor: 'eth_getcode',             desc: 'Contract bytecode',                                     realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_getStorageAt',                      anchor: 'eth_getstorageat',        desc: 'Storage slot read',                                     realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_call',                              anchor: 'eth_call',                desc: 'Read-only contract call',                               realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_estimateGas',                       anchor: 'eth_estimategas',         desc: 'Gas estimation',                                        realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_sendRawTransaction',                anchor: 'eth_sendrawtransaction',  desc: 'Submit signed tx',                                      realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_getLogs',                           anchor: 'eth_getlogs',             desc: 'Event logs (~4.5d history)',                            realtime: true,  mempool: true,  fullnode: true },
  { method: 'eth_gasPrice / maxPriorityFeePerGas',   anchor: 'eth_gasprice',            desc: 'Gas pricing',                                           realtime: true,  mempool: true,  fullnode: true },
  { method: 'net_version / web3_clientVersion',      anchor: 'net_version',             desc: 'Node identity',                                         realtime: true,  mempool: true,  fullnode: true },
  { method: 'txpool_content',                        anchor: 'txpool_content',          desc: 'Full mempool contents',                                 realtime: false, mempool: true,  fullnode: true },
  { method: 'txpool_inspect',                        anchor: 'txpool_inspect',          desc: 'Mempool summary',                                       realtime: false, mempool: true,  fullnode: true },
  { method: 'txpool_status',                         anchor: 'txpool_status',           desc: 'Pending / queued counts',                               realtime: false, mempool: true,  fullnode: true },
  { method: 'debug_traceTransaction',                anchor: 'debug_tracetransaction',  desc: 'Execution trace (last ~128 blocks, chain-tip only)',    realtime: false, mempool: false, fullnode: true },
];

export { methods as DOCS_METHODS };

type SubRow = {
  name: string;
  desc: string;
  realtime: boolean;
  mempool: boolean;
  fullnode: boolean;
};

const subs: SubRow[] = [
  { name: 'newHeads', desc: 'New block headers', realtime: true, mempool: true, fullnode: true },
  { name: 'logs', desc: 'Filtered event logs', realtime: true, mempool: true, fullnode: true },
  { name: 'newPendingTransactions', desc: 'Tx hashes by default. Pass true as the second param ("newPendingTransactions", true) to receive full tx objects instead.', realtime: false, mempool: true, fullnode: true },
];

function Tick({ on }: { on: boolean }) {
  return on ? (
    <span className="text-accent">&#10003;</span>
  ) : (
    <span className="text-muted/40">-</span>
  );
}

const jsExample = `import { JsonRpcProvider, WebSocketProvider } from 'ethers';

const HTTP_URL = 'https://va-bsc-01.streamsuite.io/?key=YOUR_API_KEY';
const WS_URL   = 'wss://va-bsc-01.streamsuite.io/ws?key=YOUR_API_KEY';

// HTTP
const http = new JsonRpcProvider(HTTP_URL);
const block = await http.getBlockNumber();
console.log('Head block:', block);

// WebSocket: subscribe to new blocks
const ws = new WebSocketProvider(WS_URL);
ws.on('block', (n) => console.log('newHeads', n));

// Mempool tier+: pending transactions
ws.on('pending', async (txHash) => {
  const tx = await ws.getTransaction(txHash);
  if (!tx) return;
  console.log('pending', tx.hash, tx.to, tx.value.toString());
});`;

const pyExample = `from web3 import Web3
import asyncio, json, websockets

HTTP_URL = "https://va-bsc-01.streamsuite.io/?key=YOUR_API_KEY"
WS_URL   = "wss://va-bsc-01.streamsuite.io/ws?key=YOUR_API_KEY"

# HTTP
w3 = Web3(Web3.HTTPProvider(HTTP_URL))
print("Head block:", w3.eth.block_number)

# Mempool tier+: raw WS subscription
async def watch_mempool():
    async with websockets.connect(WS_URL) as ws:
        await ws.send(json.dumps({
            "jsonrpc": "2.0", "id": 1,
            "method": "eth_subscribe",
            "params": ["newPendingTransactions"]
        }))
        async for msg in ws:
            evt = json.loads(msg)
            if "params" in evt:
                print("pending:", evt["params"]["result"])

asyncio.run(watch_mempool())`;

const rustExample = `use alloy::providers::{Provider, ProviderBuilder, WsConnect};
use futures_util::StreamExt;

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let ws = WsConnect::new("wss://va-bsc-01.streamsuite.io/ws?key=YOUR_API_KEY");
    let provider = ProviderBuilder::new().on_ws(ws).await?;

    // Subscribe to newHeads
    let mut heads = provider.subscribe_blocks().await?.into_stream();
    while let Some(block) = heads.next().await {
        println!("newHead #{}", block.header.number);
    }
    Ok(())
}`;

// ── Sanity-check curl. Universal, no SDK, works in any terminal ───────────
const curlExample = `# Latest block — sub-millisecond server-side; total = our processing time + your RTT to Ashburn, VA
curl -X POST 'https://va-bsc-01.streamsuite.io/?key=YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Batched call (RPC supports JSON arrays — processed in parallel server-side)
curl -X POST 'https://va-bsc-01.streamsuite.io/?key=YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '[
    {"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1},
    {"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":2},
    {"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":3}
  ]'

# Bearer auth (equivalent to ?key=, keeps key out of URL logs)
curl -X POST 'https://va-bsc-01.streamsuite.io/' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Gzipped response — ~80% smaller on full-block / large-log queries
curl --compressed -X POST 'https://va-bsc-01.streamsuite.io/?key=YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest",true],"id":1}'`;

// ── viem (modern TS default — has eclipsed ethers v6 in new projects) ─────
const viemExample = `import { createPublicClient, http, webSocket } from 'viem';
import { bsc } from 'viem/chains';

const HTTP_URL = 'https://va-bsc-01.streamsuite.io/?key=YOUR_API_KEY';
const WS_URL   = 'wss://va-bsc-01.streamsuite.io/ws?key=YOUR_API_KEY';

// HTTP
const client = createPublicClient({ chain: bsc, transport: http(HTTP_URL) });
const block = await client.getBlockNumber();
console.log('Head block:', block);

// WebSocket: watch new blocks
const ws = createPublicClient({ chain: bsc, transport: webSocket(WS_URL) });
const unwatch = ws.watchBlocks({
  onBlock: (b) => console.log('newHead', b.number),
});

// Mempool tier+: subscribe to pending transactions
const unwatchPending = ws.watchPendingTransactions({
  onTransactions: (hashes) => console.log('pending:', hashes.length, 'tx'),
});`;

// ── WebSocket reconnection — required pattern for serious bot operators ───
const wsReconnectExample = `// Production-ready WebSocket pattern: exponential backoff + resubscribe.
// The connection WILL drop occasionally (network blip, server restart,
// nginx idle timeout). Your bot's job is to reconnect transparently.

import WebSocket from 'ws';

const WS_URL = 'wss://va-bsc-01.streamsuite.io/ws?key=YOUR_API_KEY';
let backoffMs = 250;
const MAX_BACKOFF = 30_000;

function connect() {
  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    backoffMs = 250;                 // reset backoff on successful connect
    // resubscribe to whatever channels your bot needs
    ws.send(JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'eth_subscribe',
      params: ['newHeads'],
    }));
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.method === 'eth_subscription') {
      handleEvent(msg.params.result);   // your handler
    }
  });

  ws.on('close', (code, reason) => {
    console.warn('ws closed', code, reason.toString(), 'retry in', backoffMs);
    setTimeout(connect, backoffMs);
    backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF);
  });

  ws.on('error', (err) => {
    console.error('ws error', err.message);
    // close handler will fire next; don't double-reconnect here
  });
}

function handleEvent(_evt: unknown) { /* your bot logic */ }
connect();`;

// Table of contents — drives both the desktop sidebar and the mobile
// floating TOC sheet. Keep in sync with the <section id="..."> ids below.
const DOCS_TOC: Array<{ href: string; label: string }> = [
  { href: '#endpoints',      label: 'Endpoints' },
  { href: '#curl',           label: '5-second curl' },
  { href: '#migration',      label: 'Switching providers' },
  { href: '#methods',        label: 'Methods by tier' },
  { href: '#subscriptions',  label: 'WS subscriptions' },
  { href: '#code-examples',  label: 'Code examples' },
  { href: '#reconnect',      label: 'WS reconnection' },
  { href: '#bsc',            label: 'BSC quirks' },
  { href: '#rate-limits',    label: 'Rate limits' },
  { href: '#node-details',   label: 'Node details' },
  { href: '#errors',         label: 'Errors' },
  { href: '#best-practices', label: 'Best practices' },
];

export default function Docs() {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-20 md:flex md:gap-10 lg:gap-12">
      {/* Renders desktop sticky sidebar + mobile floating "Contents" FAB
          with slide-up sheet. Scroll-spy highlights active section. */}
      <DocsTOC items={DOCS_TOC} />

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1">
      {/* HERO */}
      <div className="pill mb-5">
        <span>API Reference</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink mb-5">
        BSC RPC Docs
      </h1>
      <p className="text-lg text-muted max-w-2xl leading-relaxed">
        Standard Ethereum JSON-RPC with BSC semantics. Use any JSON-RPC client: ethers, web3.py,
        viem, alloy, go-ethereum, whatever you have. No custom SDK required.
      </p>

      {/* QUICK START */}
      <section id="endpoints" className="mt-14 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          Quick start
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-6">Endpoints</h3>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-6">
            <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">HTTP</div>
            <CodeBlock className="text-sm break-all whitespace-pre-wrap">
              https://va-bsc-01.streamsuite.io/?key=YOUR_API_KEY
            </CodeBlock>
            <p className="text-xs text-muted mt-3">
              Standard JSON-RPC POST. Methods go in the body. The API key can be
              sent in the query string (<code className="font-mono text-accent">?key=...</code>)
              or as a bearer header (<code className="font-mono text-accent">Authorization: Bearer ...</code>) &mdash;
              both are equivalent. The query form is fine for quick testing; the
              header form keeps the key out of access logs and URL-scrubbing
              tools (curl history, CI logs, observability dashboards).
            </p>
          </div>
          <div className="card p-6">
            <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">WebSocket</div>
            <CodeBlock className="text-sm break-all whitespace-pre-wrap">
              wss://va-bsc-01.streamsuite.io/ws?key=YOUR_API_KEY
            </CodeBlock>
            <p className="text-xs text-muted mt-3">
              Persistent connection for subscriptions. Use{' '}
              <code className="font-mono text-accent">eth_subscribe</code> with one of the
              supported channels below.
            </p>
          </div>
        </div>
      </section>

      {/* CURL QUICKSTART — universal, fastest sanity check ─────────────── */}
      <section id="curl" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          5-second curl
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-3">
          Sanity-check it works
        </h3>
        <p className="text-muted text-sm leading-relaxed mb-6 max-w-3xl">
          Paste any of these into a terminal. No SDK install required. If your
          first call doesn&apos;t return in &lt;100ms (plus your network distance
          to Ashburn, VA), something&apos;s wrong &mdash; tell us.
        </p>
        <CodeBlock framed label="curl" hint="any shell" className="text-[10px] sm:text-xs overflow-x-auto whitespace-pre">
          {curlExample}
        </CodeBlock>
      </section>

      {/* MIGRATION FROM INCUMBENTS — switching cost = one line ───────────── */}
      <section id="migration" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          Switching from another provider
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-3">
          Migration is a URL swap
        </h3>
        <p className="text-muted text-sm leading-relaxed mb-6 max-w-3xl">
          We expose plain JSON-RPC. There&apos;s no proprietary protocol, custom
          SDK, or compute-unit math. If you&apos;re currently paying for BSC RPC
          somewhere else, the migration is one line of code.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="card p-5">
            <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">From Alchemy</div>
            <pre className="code-block text-[10px] sm:text-xs whitespace-pre-wrap break-all leading-relaxed">{`- https://bnb-mainnet.g.alchemy.com/v2/KEY
+ https://va-bsc-01.streamsuite.io/?key=KEY`}</pre>
            <p className="text-xs text-muted mt-3 leading-relaxed">
              No compute units, no per-method pricing tiers. Flat rate.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">From QuickNode</div>
            <pre className="code-block text-[10px] sm:text-xs whitespace-pre-wrap break-all leading-relaxed">{`- https://...quiknode.pro/KEY/
+ https://va-bsc-01.streamsuite.io/?key=KEY`}</pre>
            <p className="text-xs text-muted mt-3 leading-relaxed">
              No request-rate billing. Unlimited subs included.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2">From Chainstack</div>
            <pre className="code-block text-[10px] sm:text-xs whitespace-pre-wrap break-all leading-relaxed">{`- https://bsc-mainnet.core.chainstack.com/KEY
+ https://va-bsc-01.streamsuite.io/?key=KEY`}</pre>
            <p className="text-xs text-muted mt-3 leading-relaxed">
              Dedicated bare-metal slot instead of shared pool.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted mt-4 leading-relaxed max-w-3xl">
          All standard methods (<code className="font-mono text-accent">eth_*</code>,{' '}
          <code className="font-mono text-accent">net_*</code>,{' '}
          <code className="font-mono text-accent">web3_*</code>) work identically.
          Tier-gated extras (<code className="font-mono text-accent">txpool_*</code>,{' '}
          <code className="font-mono text-accent">debug_*</code>) are listed in the
          methods table below. WebSocket subscription channel names match standard
          go-ethereum: <code className="font-mono text-accent">newHeads</code>,{' '}
          <code className="font-mono text-accent">logs</code>,{' '}
          <code className="font-mono text-accent">newPendingTransactions</code>.
        </p>
      </section>

      {/* METHODS BY TIER */}
      <section id="methods" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          Methods by tier
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-6">What's included</h3>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel-2">
                  <th className="text-left px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
                    Method
                  </th>
                  <th className="text-left px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium hidden sm:table-cell">
                    Description
                  </th>
                  <th className="text-center px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
                    Real-Time
                  </th>
                  <th className="text-center px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
                    Mempool
                  </th>
                  <th className="text-center px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
                    Full Node
                  </th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.anchor} id={m.anchor} className="group border-b border-border/60 last:border-b-0 scroll-mt-20">
                    <td className="px-5 py-2.5 font-mono text-accent-bright text-xs md:text-sm whitespace-nowrap">
                      <a
                        href={`#${m.anchor}`}
                        className="hover:underline decoration-accent/40 underline-offset-4"
                        aria-label={`Permalink to ${m.method}`}
                      >
                        {m.method}
                        <span className="ml-1.5 text-muted/50 opacity-0 group-hover:opacity-100 transition-opacity">#</span>
                      </a>
                    </td>
                    <td className="px-5 py-2.5 text-muted text-xs md:text-sm hidden sm:table-cell">
                      {m.desc}
                    </td>
                    <td className="text-center px-3 py-2.5"><Tick on={m.realtime} /></td>
                    <td className="text-center px-3 py-2.5"><Tick on={m.mempool} /></td>
                    <td className="text-center px-3 py-2.5"><Tick on={m.fullnode} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SUBSCRIPTIONS */}
      <section id="subscriptions" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          WebSocket subscriptions
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-6">eth_subscribe channels</h3>

        <div className="card overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel-2">
                  <th className="text-left px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">Channel</th>
                  <th className="text-left px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium hidden sm:table-cell">Description</th>
                  <th className="text-center px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">Real-Time</th>
                  <th className="text-center px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">Mempool</th>
                  <th className="text-center px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">Full Node</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.name} className="border-b border-border/60 last:border-b-0">
                    <td className="px-5 py-2.5 font-mono text-accent-bright text-xs md:text-sm">{s.name}</td>
                    <td className="px-5 py-2.5 text-muted text-xs md:text-sm hidden sm:table-cell">{s.desc}</td>
                    <td className="text-center px-3 py-2.5"><Tick on={s.realtime} /></td>
                    <td className="text-center px-3 py-2.5"><Tick on={s.mempool} /></td>
                    <td className="text-center px-3 py-2.5"><Tick on={s.fullnode} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <CodeBlock>{`// Raw eth_subscribe over WebSocket
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_subscribe",
  "params": ["newHeads"]
}

// Logs with topic filter
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "eth_subscribe",
  "params": ["logs", {
    "address": "0x...",
    "topics": ["0xddf252ad..."]
  }]
}

// Pending tx hashes (Mempool and Full Node tiers) — hashes only
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "eth_subscribe",
  "params": ["newPendingTransactions"]
}

// Pending tx FULL OBJECTS (Mempool and Full Node tiers) — pass true as second param
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "eth_subscribe",
  "params": ["newPendingTransactions", true]
}`}</CodeBlock>
      </section>

      {/* CODE EXAMPLES */}
      <section id="code-examples" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          Code examples
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-6">Connect from anywhere</h3>

        <CodeTabs
          tabs={[
            { id: 'viem',    label: 'TS · viem',     hint: 'node / edge / browser',                                            code: viemExample },
            { id: 'ethers',  label: 'JS · ethers',   hint: 'node / browser',                                                   code: jsExample },
            { id: 'web3py',  label: 'Python · web3', hint: 'python 3.10+',                                                     code: pyExample },
            { id: 'alloy',   label: 'Rust · alloy',  hint: 'tokio runtime · alloy 1.x renames .on_ws() → .connect_ws()',       code: rustExample },
          ]}
          defaultTab="viem"
        />
      </section>

      {/* WEBSOCKET RECONNECTION — production-essential pattern ─────────── */}
      <section id="reconnect" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          WebSocket reconnection
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-3">
          Reconnect &amp; resubscribe pattern
        </h3>
        <p className="text-muted text-sm leading-relaxed mb-6 max-w-3xl">
          The connection will drop occasionally &mdash; network blips, server
          restarts, idle timeouts. Our 30-minute stress test recorded 0 WS reconnects,
          but production is messy. Bots that don&apos;t handle reconnect
          silently stop receiving events. Pattern below: exponential backoff,
          resubscribe on reconnect, reset backoff on success.
        </p>
        <CodeBlock framed label="TypeScript · ws" hint="node">
          {wsReconnectExample}
        </CodeBlock>
        <p className="text-xs text-muted mt-3 leading-relaxed max-w-3xl">
          ethers&apos; <code className="font-mono text-accent">WebSocketProvider</code> and
          viem&apos;s <code className="font-mono text-accent">webSocket</code> transport
          both have built-in reconnection but the resubscribe semantics vary by
          version. If you&apos;re subscribing to anything stateful, prefer the
          manual pattern above &mdash; you control exactly what gets re-armed.
        </p>
      </section>

      {/* BSC-SPECIFIC QUIRKS — competitors don't articulate these ───────── */}
      <section id="bsc" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          BSC-specific
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-3">
          Things BSC does differently than Ethereum
        </h3>
        <p className="text-muted text-sm leading-relaxed mb-6 max-w-3xl">
          BSC is a geth fork with significant changes. If you&apos;re coming from
          ETH mainnet experience, read these once.
        </p>

        <div className="card p-5 sm:p-6 space-y-5 text-sm leading-relaxed">
          <div>
            <p className="font-semibold text-ink mb-1">Block time: ~440ms (not 12s).</p>
            <p className="text-muted">
              Eight blocks per validator turn, 13 validators in active rotation.
              If you poll <code className="font-mono text-accent">eth_blockNumber</code>{' '}
              instead of subscribing to <code className="font-mono text-accent">newHeads</code>,
              you&apos;ll burn requests AND lag the chain. Use the subscription.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">Fast finality (~3 blocks).</p>
            <p className="text-muted">
              BSC has BEP-126 fast finality. After a tx is 3 blocks deep
              (~1.3 sec) it&apos;s finalized and reorgs are vanishingly rare.
              For most apps you can treat the head as final after one or two
              blocks of confirmation; for high-value flows, wait 3.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">Gas floor: 0.05 Gwei (not 1 Gwei).</p>
            <p className="text-muted">
              As of 2026, the BSC validator-accepted gas-price floor is 0.05 Gwei.{' '}
              <code className="font-mono text-accent">eth_gasPrice</code> returns a
              conservative default (typically 1 Gwei) for backward compatibility &mdash;
              if you blindly use it for tx submission, you&apos;ll overpay 20×.
              Set the gas price yourself based on observed inclusion patterns.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">Mempool visibility is structurally lower than ETH.</p>
            <p className="text-muted">
              Major BSC validators (notably 48Club) run private order flow &mdash; a
              significant fraction of value-extracting txs never appear in the
              public mempool. <code className="font-mono text-accent">txpool_content</code> /
              <code className="font-mono text-accent">pendingTransactions</code> WS sub
              shows you the public pool, which is real and useful but not the whole
              picture. If MEV opportunities depend on private flow, you need a
              relationship with a validator, not just better RPC.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">
              <code className="font-mono text-accent">debug_traceTransaction</code> is chain-tip only (~128 blocks, ~60 sec).
            </p>
            <p className="text-muted">
              Trace state is pruned aggressively. Tracing a tx within the last
              ~60 seconds works; older than that returns{' '}
              <code className="font-mono text-accent">required historical state unavailable (reexec=128)</code>.
              Cache traces at chain tip if you need them later, or use a callTracer
              variant that doesn&apos;t need full state. Deeper trace history is the
              Archive add-on (ask).
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">No EIP-1559 base-fee on BSC.</p>
            <p className="text-muted">
              <code className="font-mono text-accent">eth_maxPriorityFeePerGas</code> returns
              the same value as <code className="font-mono text-accent">eth_gasPrice</code>{' '}
              because BSC has no base-fee. Don&apos;t try to build a 1559 maxFee /
              priorityFee split &mdash; just set legacy gasPrice.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">tx receipts &amp; logs: ~4.5d history.</p>
            <p className="text-muted">
              The node retains 900,000 blocks of receipts and logs (~4.5 days).
              Older queries return{' '}
              <code className="font-mono text-accent">transaction indexing is in progress</code>.
              If you need deeper history, batch your scans within the retention
              window or ask about Archive.
            </p>
          </div>
        </div>
      </section>

      {/* RATE LIMITS */}
      <section id="rate-limits" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          Rate limits
        </h2>
        <div className="card p-8">
          <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-3">None on request rate.</h3>
          <p className="text-muted leading-relaxed">
            Unlimited request rate, unlimited WebSocket subscriptions, no compute-unit math.
            We cap <em>operators</em> per node instead (10 max per colocation group),
            so you never compete with someone else&apos;s polling loop. When a group fills
            we provision a new bare-metal server &mdash; existing customers stay on their
            original group and aren&apos;t rebalanced.
          </p>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="font-semibold text-ink text-sm mb-2">Connection-level guards (not usage limits):</p>
            <div className="card overflow-hidden mb-3 mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-panel-2">
                    <th className="text-left px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">Tier</th>
                    <th className="text-right px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted font-medium">Concurrent (HTTP + WSS)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/60">
                    <td className="px-4 py-2.5 font-mono text-accent-bright">Real-Time</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink">10</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="px-4 py-2.5 font-mono text-accent-bright">Mempool</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink">20</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-accent-bright">Full Node</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink">30</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul className="space-y-2 text-sm text-muted leading-relaxed">
              <li>
                Cap counts HTTP and WebSocket connections together. A single bot
                with sensible HTTP pooling and 1-2 WSS subscriptions uses ~5-11
                connections &mdash; comfortably below every cap.
              </li>
              <li>
                Hit the cap with a real workload? You&apos;re likely running
                multiple bots or services from one key. Buy another slot (or
                request a <em>dedicated server</em>, which lifts the cap entirely
                &mdash; not a published tier, contact us).
              </li>
              <li>
                <span className="font-mono text-accent">100</span> concurrent
                connections per source IP (HTTP + WSS combined). Anti-abuse cap,
                not usage. Independent of the per-key tier cap above.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* NODE SPECS */}
      <section id="node-details" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          Node details
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-6">What you're connecting to</h3>

        <div className="card p-6 md:p-8">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
            {[
              ['Chain', 'BNB Smart Chain mainnet (chainId 56)'],
              ['Client', 'BSC full node, pruning mode'],
              ['Block time', '~440ms (fast finality)'],
              ['Location', 'Ashburn, VA. Tier-III datacenter (N+1 power & cooling)'],
              ['Hardware', 'Bare-metal dedicated server, NVMe storage'],
              ['Network', '15+ carriers on-net (Verizon, Lumen, AT&T, Cogent, Zayo, ...)'],
              ['Compliance', 'Facility: SOC 2 Type II, ISO 27001:2022, HIPAA, PCI-DSS'],
              ['Block headers', 'All (back to genesis)'],
              ['Transaction history', '~4.5 days (900k blocks)'],
              ['Log history', '~4.5 days (900k blocks)'],
              ['State history', 'Latest only (no archive)'],
              ['Trace history', 'Last ~128 blocks (~60 sec) — chain-tip only, Full Node tier'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-mono uppercase tracking-widest text-muted/80 mb-1">
                  {k}
                </dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ERRORS */}
      <section id="errors" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          Errors
        </h2>
        <h3 className="text-2xl md:text-3xl font-semibold text-ink mb-6">What to expect when something is off</h3>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel-2 text-left text-[11px] uppercase tracking-wider text-muted font-mono">
                  <th className="px-5 py-3">HTTP</th>
                  <th className="px-5 py-3">Body</th>
                  <th className="px-5 py-3">Meaning &amp; fix</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b border-border/40">
                  <td className="px-5 py-3 font-mono">401</td>
                  <td className="px-5 py-3 font-mono break-all">{`{"error":{"code":-32000,"message":"invalid or missing API key"}}`}</td>
                  <td className="px-5 py-3 text-muted">Key missing, malformed, or revoked. Check for whitespace; if you just rotated, wait 5s for edge sync; if cancelled subscription, reactivate via dashboard.</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="px-5 py-3 font-mono">403</td>
                  <td className="px-5 py-3 font-mono break-all">{`{"error":{"code":-32601,"message":"method <NAME> requires Mempool tier or higher"}}`}</td>
                  <td className="px-5 py-3 text-muted">Method exists on the node but isn&apos;t included in your tier (e.g. <code>txpool_*</code> on Real-Time, <code>debug_*</code> on Real-Time or Mempool). Upgrade tier, or use an alternative method. Blocked-for-safety methods (<code>admin_*</code>, <code>personal_*</code>, <code>miner_*</code>) return <code>&quot;method &lt;NAME&gt; is not available&quot;</code> regardless of tier.</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="px-5 py-3 font-mono">429</td>
                  <td className="px-5 py-3 font-mono break-all">{`{"error":{"code":-32005,"message":"connection limit exceeded for this API key"}}`}</td>
                  <td className="px-5 py-3 text-muted">Connection cap hit. Either you exceeded your tier&apos;s concurrent-connection cap (Real-Time <code>10</code> / Mempool <code>20</code> / Full Node <code>30</code>, HTTP + WSS combined) or the <code>100</code>-per-source-IP anti-abuse cap. EIP-1474 code <code>-32005</code> means &quot;limit exceeded&quot; — ethers / viem / web3.py surface this as a parseable error rather than failing on response decode. Pool subscriptions, distribute load across IPs, or request a <em>dedicated server</em>.</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="px-5 py-3 font-mono">200</td>
                  <td className="px-5 py-3 font-mono break-all">{`{"error":{"code":-32000,"message":"does not exist/is not available"}}`}</td>
                  <td className="px-5 py-3 text-muted">geth doesn&apos;t expose this method (e.g. parity-style <code>trace_*</code>). Use the equivalent <code>debug_*</code> method instead.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono">200</td>
                  <td className="px-5 py-3 font-mono break-all">{`{"error":{"code":-32000,"message":"transaction indexing is in progress"}}`}</td>
                  <td className="px-5 py-3 text-muted">Querying a transaction or receipt older than our 4.5-day retention window. Re-query with a more recent tx, or upgrade to Full Node + ask us about an archive add-on.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* BEST PRACTICES */}
      <section id="best-practices" className="mt-16 scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
          Best practices
        </h2>
        <div className="card p-6 md:p-8 space-y-4 text-sm leading-relaxed">
          <div>
            <p className="font-semibold mb-1">Batch where you can</p>
            <p className="text-muted">JSON-RPC supports sending an array of calls per HTTP POST. We process them in parallel internally. Cuts round trips meaningfully for indexers.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Use WebSocket subscriptions instead of polling</p>
            <p className="text-muted">For block triggers, use <code className="font-mono text-accent">eth_subscribe newHeads</code> rather than polling <code className="font-mono text-accent">eth_blockNumber</code> every second. Same data, near-zero overhead.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Chunk <code className="font-mono text-accent">eth_getLogs</code> into ≤1000-block ranges</p>
            <p className="text-muted">
              Log queries scan blocks and are I/O-sensitive &mdash; our 30-min
              stress test (see <Link href="/benchmarks" className="text-accent hover:underline">/benchmarks</Link>)
              shows <code className="font-mono text-accent">eth_getLogs</code>{' '}
              p50 stays under 1ms but the p99 tail ranges 40&ndash;300ms at 12&ndash;20
              concurrent clients on a 50-block window. Wider ranges and higher
              concurrency push it further. For live event tracking, use{' '}
              <code className="font-mono text-accent">eth_subscribe logs</code> with
              a topic filter (constant-cost regardless of chain depth). For
              historical scans, chunk by 1000 blocks max and parallelize
              3&ndash;5 chunks at a time. Don&apos;t request a single 500k-block
              window &mdash; you&apos;ll get the wide tail every time and may
              time out.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Ask for gzipped responses</p>
            <p className="text-muted">
              Send <code className="font-mono text-accent">Accept-Encoding: gzip</code> and
              we&apos;ll return gzipped response bodies. Measured ~80% size reduction
              on full-block responses (e.g.{' '}
              <code className="font-mono text-accent">eth_getBlockByNumber latest true</code>)
              and similar on large{' '}
              <code className="font-mono text-accent">eth_getLogs</code> results. Most
              HTTP clients (ethers, web3.py, viem, alloy, curl <code className="font-mono text-accent">--compressed</code>)
              auto-set this header and auto-decompress.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Don&apos;t hard-code the key in client code</p>
            <p className="text-muted">Keep it server-side. If it leaks, rotate from the dashboard — old key invalidates within 5 seconds.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Co-locate if your bot needs &lt;10ms RTT</p>
            <p className="text-muted">From a VPS in our datacenter, you&apos;ll see &lt;1ms; from Frankfurt it&apos;s ~80ms. <a href="/request-access" className="text-accent hover:underline">Ask about colocation</a> for sub-1ms latency.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16">
        <div className="card p-8 text-center">
          <h3 className="text-2xl font-semibold text-ink mb-3">Ready to plug in?</h3>
          <p className="text-muted mb-6">Pick a tier, pay, get a key in seconds. No demo call required.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/pricing" className="btn-primary">Get started</Link>
            <Link href="/support" className="btn-ghost">Talk to us first</Link>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}
