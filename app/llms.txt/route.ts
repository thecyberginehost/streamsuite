import { DOCS_METHODS } from '../(marketing)/docs/page';

// /llms.txt — machine-readable index for coding agents (Claude, Cursor, Cody,
// etc) that need to navigate StreamSuite docs to answer questions about our
// RPC API. Follows the loose llmstxt.org convention: lead with what we are,
// list canonical docs anchors as a flat link list.
//
// Regenerates on every request — cheap, and stays in sync with DOCS_METHODS
// in /docs without a separate maintenance step.

export const dynamic = 'force-static';
export const revalidate = 3600;

const BASE = process.env.NEXTAUTH_URL || 'https://streamsuite.io';

export function GET() {
  const methodLines = DOCS_METHODS
    .map((m) => `- [${m.method}](${BASE}/docs#${m.anchor}) — ${m.desc} (tiers: ${[
      m.realtime && 'realtime',
      m.mempool && 'mempool',
      m.fullnode && 'fullnode',
    ].filter(Boolean).join(', ')})`)
    .join('\n');

  const body = `# StreamSuite

> Dedicated bare-metal BSC RPC infrastructure in Ashburn, VA. Flat-rate
> per-operator pricing, no compute-unit metering, no shared pool. Three
> tiers: Real-Time, Mempool, Full Node.

Endpoints (substitute your API key):
- HTTPS: https://va-bsc-01.streamsuite.io/?key=YOUR_API_KEY
- WSS: wss://va-bsc-01.streamsuite.io/ws?key=YOUR_API_KEY

Both query-string (?key=) and header (Authorization: Bearer ...) auth work.

## Docs

- [Endpoints](${BASE}/docs#endpoints)
- [5-second curl quickstart](${BASE}/docs#curl)
- [Switching from another provider](${BASE}/docs#migration)
- [Methods by tier](${BASE}/docs#methods)
- [WebSocket subscriptions](${BASE}/docs#subscriptions)
- [Code examples (viem, ethers, web3.py, alloy)](${BASE}/docs#code-examples)
- [WebSocket reconnection pattern](${BASE}/docs#reconnect)
- [BSC quirks](${BASE}/docs#bsc)
- [Rate limits](${BASE}/docs#rate-limits)
- [Node details](${BASE}/docs#node-details)
- [Error reference](${BASE}/docs#errors)
- [Best practices](${BASE}/docs#best-practices)

## RPC methods

${methodLines}

## Subscriptions (eth_subscribe channels)

- newHeads — new block headers (all tiers)
- logs — filtered event logs (all tiers)
- newPendingTransactions — pending tx hashes or full objects (Mempool / Full Node only)

## Other

- [Pricing](${BASE}/pricing)
- [Benchmarks](${BASE}/benchmarks)
- [Self-serve bench tool](${BASE}/bench)
- [Status page](${BASE}/status)
- [Support](${BASE}/support)
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
