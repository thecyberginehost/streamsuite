# StreamSuite

**Dedicated bare-metal BSC RPC infrastructure.** Flat-rate per-operator pricing, no compute-unit metering, no shared pool. HTTP + WebSocket endpoints, full standard JSON-RPC, tier-gated mempool and debug methods.

→ Production site: **<https://streamsuite.io>**
→ Docs: **<https://streamsuite.io/docs>** (incl. `/llms.txt` for coding agents)
→ Status: **<https://streamsuite.io/status>**

---

## What this repo is

The Next.js portal that powers `streamsuite.io`:

- Marketing site (landing, pricing, docs, benchmarks, request-access, legal)
- Customer dashboard (credentials, quickstart, RPC playground, billing)
- Admin console (separate auth, customer table + ops actions)
- Auth: magic-link + 6-digit code (Resend) plus GitHub OAuth
- Payments: Stripe subscriptions + NOWPayments crypto checkout
- Webhooks: Stripe lifecycle, NOWPayments IPN, Resend bounce monitor
- Cron jobs: SQLite snapshots, onboarding email sequence, crypto expiry / revoke, fulfillment integrity monitor

The **BSC node itself** runs on a separate Hostinger-managed bare-metal box (`va-bsc-01.streamsuite.io`). Its nginx config lives in [`nginx/`](./nginx/) as a paper trail; the running copy is on the node at `/etc/nginx/`. See [`nginx/README.md`](./nginx/README.md) for deploy instructions.

## Stack

- **Runtime:** Node 22 · Next.js 14 (App Router) · TypeScript
- **DB:** SQLite via `better-sqlite3` (single-writer; the portal is the only writer)
- **Email:** Resend (transactional via `send.streamsuite.io`)
- **Payments:** Stripe (recurring) + NOWPayments (crypto, one-time 30-day windows)
- **Process:** PM2 + systemd
- **Edge:** nginx fronts both the portal (Hostinger) and the BSC node (separate box)

## Local development

```bash
git clone https://github.com/thecyberginehost/streamsuite.git
cd streamsuite
npm ci
# Copy .env.example to .env.local and fill in Stripe / NOWPayments / Resend keys
npm run dev
```

The dev server expects the BSC node to be reachable at `va-bsc-01.streamsuite.io` for the dashboard's live tape + stats endpoints. In local dev these gracefully degrade to empty values.

## Architecture pointers

- `app/(marketing)/` — public pages, no auth
- `app/(app)/dashboard/` — authenticated operator dashboard
- `app/(app)/admin/` — admin-only, separate password-auth
- `app/api/` — webhook handlers, auth endpoints, internal customer/key sync
- `lib/db.ts` — SQLite schema + queries; all migrations are idempotent ALTER TABLEs
- `lib/auth.ts` + `lib/admin-auth.ts` — session + admin handling
- `lib/nowpayments.ts` — invoice creation + IPN signature verification
- `nginx/` — reference snapshot of the BSC node's nginx (NOT auto-deployed)
- `expiry-cron.js`, `onboarding-dispatcher.js`, `check-fulfillment.js`, `snapshot-db.sh` — hourly/15-min cron jobs
- `create-admin.js` — CLI for provisioning admin accounts

## Operational notes

- **DB backups:** `snapshot-db.sh` runs every 15 minutes (kept 96 = 24 hours of snapshots, gzipped, verified-readable). Plus daily S3 backup ring (bucket `streamsuite-backups-6e8def`).
- **Customer key sync:** the BSC node polls `/api/internal/customers` every 5 seconds and regenerates its nginx api-key map. Status changes (e.g. `active → expired` from the crypto-revoke cron) propagate within 5 seconds.
- **Monitoring:** UptimeRobot watches the portal, the BSC node, and `/api/health`. Resend bounce-monitor pages on hard bounces. fail2ban on the portal box.
- **Capacity model:** 10 operator slots per BSC node. When a node fills, a new one is provisioned; existing customers stay on their original group (no rebalancing).

## Contributing

This is a single-operator project (one human + Claude). PRs welcome if you spot a bug or want to improve docs.
