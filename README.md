# StreamSuite

**Open-source data infrastructure for Solana memecoin markets.**

Real-time trade archival, wallet intelligence, and ML signals — powering the next generation of developer tools.

[streamsuite.io](https://streamsuite.io)

---

## What Is StreamSuite?

StreamSuite is a data infrastructure and API layer that gives Solana developers access to real-time memecoin market intelligence. Build trading bots, analytics dashboards, research tools, or portfolio trackers — without maintaining your own data pipeline.

### What You Can Build

- **Trading bots** that check wallet reputation before copying a trade
- **Analytics dashboards** with real-time trade feeds and wallet scores
- **Research platforms** for backtesting strategies against 14M+ historical trades
- **Community tools** that surface which wallets are consistently profitable
- **Trending token feeds** showing what's pumping right now with momentum scoring

---

## API

**Live now:**
```
GET /api/archiver/stats              → Live platform statistics (tokens, trades, wallets)
GET /api/archiver/volume?hours=N     → Hourly trade volume aggregation
GET /api/archiver/recent-tokens      → Latest token launches with metadata
GET /api/archiver/smart-wallets      → Qualified smart wallet list
GET /api/archiver/wallet/:addr       → Wallet reputation lookup + trade stats
```

**Planned:**
```
GET /api/trades           → Historical trade queries (filter by wallet, token, time range)
GET /api/tokens/:mint     → Token trade history + metrics
GET /api/trending         → Real-time trending tokens with momentum scores
GET /api/export           → Parquet data export (self-serve historical data)
```

Free tier with weekly data exports. Paid tiers for full dashboard access and unlimited exports.

---

## Core Engines

The API is powered by three production systems running 24/7:

**Trade Archive**
Real-time archiver capturing every pump.fun trade. 14M+ records and growing. Ingests via PumpPortal WebSocket at zero cost, buffers in memory, and flushes to DuckDB every 5 seconds. Columnar storage achieves 60% compression over row-oriented databases.

**Wallet Intelligence**
Dynamic wallet reputation engine scoring 66K+ wallets on hit rate, moonshot rate, and trading diversity across 30-day rolling windows. 2,200+ qualified wallets. Updated every 30 minutes from live DuckDB data using analytical SQL with time-chunked processing.

**ML Classifiers**
XGBoost models trained on 60,000+ pump.fun price action samples. Exit classifier (300 trees, 27 features) and entry classifier (155 trees, 31 features). Open model weights and pure TypeScript inference — no Python runtime needed.

---

## Architecture

```
INGESTION (production)
    PumpPortal WebSocket → Trade Archiver → DuckDB (columnar)
    14M+ trades | 428K+ wallets | 270K+ tokens

INTELLIGENCE (production)
    Wallet Intelligence → 66K+ scored, 2,200+ qualified (every 30 min)
    ML Classifiers      → Entry + exit models, 60K training samples

DISTRIBUTION (live + building)
    REST API: stats, volume, tokens, wallets (live)
    Trending dashboard + token explorer (building)
    Parquet data exports (planned)
```

---

## Live Stats

| Metric | Value |
|--------|-------|
| Trades Archived | 14M+ |
| Wallets Analyzed | 428K+ |
| Tokens Tracked | 270K+ |
| Wallets Scored | 66K+ (2,200+ qualified) |
| Storage Efficiency | 60% smaller via columnar compression |
| Scoring Cycle | Every 30 min |
| External API Cost | $0 |

All data collected from PumpPortal's free WebSocket feed. No paid APIs required for ingestion.

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Database:** DuckDB (columnar analytics engine)
- **ML:** XGBoost models with pure TypeScript tree walker
- **Data Source:** PumpPortal WebSocket (real-time pump.fun trades)
- **Wallet Scoring:** Custom statistical engine with configurable thresholds
- **Website:** Next.js + Tailwind CSS

---

## Roadmap

- [x] Trade archive engine (14M+ trades, production since Feb 2026)
- [x] DuckDB columnar storage (60% compression, migrated Mar 2026)
- [x] Smart wallet scoring engine (66K+ scored, 2,200+ qualified, production since Mar 2026)
- [x] ML exit/entry classifiers (60K+ training samples, deployed)
- [x] Live archiver API (stats, volume, tokens, wallets)
- [x] API documentation with multi-language examples
- [ ] Trending tokens dashboard (real-time momentum scoring)
- [ ] Token explorer (search any mint, full trade history)
- [ ] Wallet connect authentication + API keys
- [ ] Parquet data exports (self-serve historical data)
- [ ] Tiered access (free weekly export / paid dashboard + unlimited exports)

---

## Access Tiers

| Feature | Free | Pro |
|---------|------|-----|
| Trending tokens page | Yes | Yes |
| API (stats, tokens, wallets) | Yes | Yes |
| Parquet data export | 1x/week (72hr) | Unlimited (30-day) |
| Visual dashboard | — | Yes |
| Token explorer | — | Yes |
| Historical data access | 72 hours | 30+ days |

---

## License

MIT
