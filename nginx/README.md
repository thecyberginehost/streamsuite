# BSC node nginx configs

Reference snapshots of the live nginx configuration that fronts the BSC RPC
node at `va-bsc-01.streamsuite.io`. **The portal at `streamsuite.io` runs
on a separate Hostinger box with its own config (`../nginx.conf` in this
repo).**

These files are NOT auto-applied — they live here as a paper trail and so
edits can be reviewed in PRs. To deploy, copy to the BSC node:

```bash
sudo cp nginx/security.conf  /etc/nginx/conf.d/security.conf
sudo cp nginx/bsc-node.conf  /etc/nginx/sites-enabled/streamsuite-bsc.conf
sudo cp nginx/rpc_filter.js  /etc/nginx/rpc_filter.js
sudo nginx -t && sudo systemctl reload nginx
```

## What's in each file

- **`security.conf`** — variables and zones loaded into the global http context:
  API-key extraction (`?key=` or `Authorization: Bearer`), connection-limit
  zones (per-IP, per-key, per-tier), rate-limit zones (unauth, bench public,
  public ping, IP probe), slowloris timeouts, body-size caps.

- **`bsc-node.conf`** — the site config: cert paths, upstream geth HTTP/WSS
  pools, the `/` location that filters method+tier via njs and proxies to
  geth, the `/ws` WebSocket upgrade, plus monitor endpoints (`/api/stats`,
  `/api/tape`, `/api/ping`, `/api/ip-probe`, `/api/health`).

- **`rpc_filter.js`** — njs module called from the `/` location. Parses the
  JSON-RPC body, blocks dangerous namespaces (`admin_`, `personal_`,
  `miner_`, `clique_`) outright, and tier-gates `txpool_*` / `debug_*` based
  on the customer's tier resolved from the API-key map.

## Customer key + tier maps (generated, not in this repo)

`security.conf` includes two files that are generated every 5 seconds by
`streamsuite-bsc-sync` on the BSC node, pulled from
`https://streamsuite.io/api/internal/customers`:

- `/etc/nginx/streamsuite_keys.inc.conf`  — `"<api_key>" "1";`
- `/etc/nginx/streamsuite_tiers.inc.conf` — `"<api_key>" "<tier>";`

These are recreated on every sync tick. Customer additions/removals + status
changes (e.g. `expired` from the crypto-revoke cron) propagate to nginx
within ~5 seconds.
