# StreamSuite

**Real-time intelligence platform for Solana memecoin markets.**

Wallet reputation scores, influencer accountability, ML-driven market signals — all open-source, all verifiable on-chain.

🌐 [streamsuite.io](https://streamsuite.io)

---

## What Is StreamSuite?

StreamSuite is a data intelligence platform that ingests, scores, and serves real-time Solana memecoin market data. It provides developers, researchers, and the community with tools that were previously only available to insiders and whales.

### Core Engines

**Trade Archive**
Real-time archiver capturing every pump.fun trade. 10M+ records and growing. Ingests via PumpPortal WebSocket at zero cost, buffers in memory, and flushes to SQLite every 5 seconds.

**Smart Wallet Scoring**
Dynamic wallet reputation engine scoring 4,200+ wallets based on hit rate, moonshot rate, and trading diversity across 30-day rolling windows. Updated every 30 minutes from live on-chain data.

**Caller PnL Tracker**
Cross-references Twitter influencer calls against actual on-chain outcomes. Computes PnL at 30s, 60s, 90s, and 120s intervals by matching mints to the trade archive. Proves who's profitable vs who's dumping on followers.

**ML Price Classifier**
XGBoost models trained on 60,000+ pump.fun price action samples. Exit classifier (300 trees, 27 features) and entry classifier (155 trees, 31 features). Open model weights and training pipeline.

---

## Architecture

```
PumpPortal WebSocket (every pump.fun trade)
    │
    ├── Trade Archiver → SQLite (pumpfun_trades.db)
    │       10M+ trades │ 333K+ wallets │ 202K+ tokens
    │
    ├── Smart Wallet Scorer (every 30 min)
    │       30-day rolling window │ hit rate, moonshot rate, diversity
    │       → smart_wallets.json (4,200+ scored wallets)
    │
    ├── Caller PnL Tracker
    │       17 Twitter callers │ PnL at 30s/60s/90s/120s
    │       Cross-referenced against trade archive
    │
    └── ML Classifiers
            Exit: 300 trees, 27 features, 60K samples
            Entry: 155 trees, 31 features
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
- **ML:** XGBoost models with pure TypeScript tree walker (no Python runtime needed)
- **Data Source:** PumpPortal WebSocket (real-time pump.fun trades)
- **Wallet Scoring:** Custom statistical engine with configurable thresholds
- **Landing Page:** Next.js + Tailwind CSS

---

## API (Coming Soon)

Public API for accessing trade data, wallet scores, and caller PnL.

```
GET /api/stats          → Live platform statistics
GET /api/wallets/:addr  → Wallet reputation score
GET /api/callers        → Caller leaderboard with PnL
GET /api/trades         → Historical trade queries
```

Free tier for public good. Paid tiers for high-volume access and real-time websocket streams.

---

## Roadmap

- [x] Trade archive engine (production since Feb 2026)
- [x] Smart wallet scoring engine (production since Feb 2026)
- [x] ML exit/entry classifiers (trained and deployed)
- [x] Caller PnL tracker (built, 17 callers configured)
- [ ] Public REST API
- [ ] Real-time WebSocket feeds
- [ ] Public dashboard with caller leaderboard
- [ ] SDK / client libraries
- [ ] API documentation

---

## Public Good

StreamSuite is built as a public good for the Solana ecosystem. All core engines, models, and data will be open-source under the MIT license.

The goal is to democratize market intelligence that was previously only accessible to insiders — giving every developer, researcher, and community member the same data and tools.

---

## License

MIT
