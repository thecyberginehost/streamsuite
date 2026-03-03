# StreamSuite

**Open-source developer tooling for Solana memecoin markets.**

APIs, SDKs, and real-time feeds for trade data, wallet reputation, influencer PnL, and ML signals — all free, all open-source.

[streamsuite.io](https://streamsuite.io)

---

## What Is StreamSuite?

StreamSuite is a data infrastructure and API layer that gives Solana developers free access to real-time memecoin market intelligence. Build trading bots, analytics dashboards, research tools, or community apps — without maintaining your own data pipeline.

### What You Can Build

- **Trading bots** that check wallet reputation before copying a trade
- **Analytics dashboards** with real-time trade feeds and wallet scores
- **Influencer accountability tools** that verify caller PnL on-chain
- **Research platforms** for backtesting strategies against 10M+ historical trades
- **Community tools** that surface which wallets are consistently profitable

---

## API

```
GET /api/trades           → Historical trade queries (filter by wallet, token, time range)
GET /api/wallets/:addr    → Wallet reputation score + history
GET /api/callers          → Caller leaderboard with verified PnL
GET /api/tokens/:mint     → Token trade history + metrics
GET /api/stats            → Live platform statistics

WSS /stream/trades        → Real-time trade events
WSS /stream/wallets       → Smart wallet activity alerts
WSS /stream/scores        → Wallet score update events
```

Free tier for public good. TypeScript and Python SDKs included.

---

## Core Engines

The API is powered by four production systems running 24/7:

**Trade Archive**
Real-time archiver capturing every pump.fun trade. 10M+ records and growing. Ingests via PumpPortal WebSocket at zero cost, buffers in memory, and flushes to SQLite every 5 seconds.

**Smart Wallet Scoring**
Dynamic wallet reputation engine scoring 4,200+ wallets based on hit rate, moonshot rate, and trading diversity across 30-day rolling windows. Updated every 30 minutes from live on-chain data.

**Caller PnL Tracker**
Cross-references Twitter influencer calls against actual on-chain outcomes. Computes PnL at 30s, 60s, 90s, and 120s intervals by matching mints to the trade archive.

**ML Classifiers**
XGBoost models trained on 60,000+ pump.fun price action samples. Exit classifier (300 trees, 27 features) and entry classifier (155 trees, 31 features). Open model weights and pure TypeScript inference — no Python runtime needed.

---

## Architecture

```
INGESTION (production)
    PumpPortal WebSocket → Trade Archiver → SQLite
    10M+ trades | 333K+ wallets | 202K+ tokens

INTELLIGENCE (production)
    Smart Wallet Scorer → 4,200+ scored wallets (every 30 min)
    Caller PnL Tracker  → 17 callers, PnL at 30s/60s/90s/120s
    ML Classifiers      → Entry + exit models, 60K training samples

DISTRIBUTION (building)
    REST API + WebSocket Feeds + TypeScript SDK + Python SDK
```

---

## Live Stats

| Metric | Value |
|--------|-------|
| Trades Archived | 10M+ |
| Wallets Analyzed | 333K+ |
| Tokens Tracked | 202K+ |
| Wallets Scored | 4,200+ |
| Data Ingestion | 160MB/day |
| Scoring Cycle | Every 30 min |
| External API Cost | $0 |

All data collected from PumpPortal's free WebSocket feed. No paid APIs required for ingestion.

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Database:** SQLite (WAL mode) via better-sqlite3
- **ML:** XGBoost models with pure TypeScript tree walker
- **Data Source:** PumpPortal WebSocket (real-time pump.fun trades)
- **Wallet Scoring:** Custom statistical engine with configurable thresholds
- **SDKs:** TypeScript (npm), Python (PyPI)
- **Website:** Next.js + Tailwind CSS

---

## Roadmap

- [x] Trade archive engine (production since Feb 2026)
- [x] Smart wallet scoring engine (production since Feb 2026)
- [x] ML exit/entry classifiers (trained and deployed)
- [x] Caller PnL tracker (built, 17 callers configured)
- [ ] Public REST API
- [ ] Real-time WebSocket feeds
- [ ] Public dashboard with caller leaderboard
- [ ] TypeScript + Python SDKs
- [ ] API documentation + integration guides
- [ ] Multi-pool expansion (Raydium, Orca, Jupiter via Geyser gRPC)

---

## Public Good

StreamSuite is built as a public good for the Solana developer ecosystem. All core engines, models, data, and client libraries are open-source under the MIT license.

The goal is to give every developer, researcher, and community builder the same market intelligence that was previously only accessible to insiders.

---

## License

MIT
