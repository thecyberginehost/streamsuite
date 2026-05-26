// StreamSuite onboarding email dispatcher.
// Runs hourly via cron. Idempotent: each milestone fires at most once per customer.
//
// Day 1 — your first three calls (activation)
// Day 3 — tier-specific power moves (retention)
// Day 14 — quick feedback ask (roadmap)
//
// Reads STRIPE_*, RESEND_API_KEY from /home/filthy/streamsuite/.env.local

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT = '/home/filthy/streamsuite';
const DB_PATH = path.join(ROOT, 'data', 'streamsuite.db');
const ENV_PATH = path.join(ROOT, '.env.local');

// Parse .env.local for the keys we need
const env = {};
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const RESEND_KEY = env.RESEND_API_KEY;
const FROM_EMAIL = env.FROM_EMAIL || 'StreamSuite <noreply@send.streamsuite.io>';
const BASE_URL = env.NEXTAUTH_URL || 'https://streamsuite.io';
const ENDPOINT_HOST = 'va-bsc-01.streamsuite.io';

if (!RESEND_KEY) {
  console.error('onboarding: RESEND_API_KEY not set, exiting');
  process.exit(1);
}

const { Resend } = require(path.join(ROOT, 'node_modules', 'resend'));
const resend = new Resend(RESEND_KEY);

const db = new Database(DB_PATH);

const tierLabel = {
  realtime: 'BSC Real-Time',
  mempool: 'BSC Mempool',
  fullnode: 'BSC Full Node',
};

function shell(s) {
  return s.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const D1 = (c) => ({
  subject: `Day 1 — your first three RPC calls on StreamSuite`,
  text: shell(`
    Hey${c.name ? ' ' + c.name.split(' ')[0] : ''},

    Quick activation tour. Try these three calls to see your dashboard light up:

    1) Block height (sanity check)
       curl '${ENDPOINT_HOST}/?key=${c.api_key}' -H 'content-type: application/json' \\
         -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'

    2) Chain ID (confirms BSC mainnet)
       curl '${ENDPOINT_HOST}/?key=${c.api_key}' -H 'content-type: application/json' \\
         -d '{"jsonrpc":"2.0","method":"eth_chainId","id":1}'

    3) Latest block, full
       curl '${ENDPOINT_HOST}/?key=${c.api_key}' -H 'content-type: application/json' \\
         -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest",false],"id":1}'

    Then open the dashboard — you'll see the live tape scroll with your calls and per-method stats populate within seconds:
    ${BASE_URL}/dashboard

    Common gotchas in the first day:
    - "invalid or missing API key" usually means key has whitespace or quotes around it
    - Don't use WSS for one-shot calls — use HTTPS for request/response, WSS for subscribe
    - If your bot is far from Ashburn, expect ~50ms RTT. Lock the BSC node region from your VPS first.

    Anything weird? Reply to this email — one person reads this inbox.

    — StreamSuite
  `),
});

const D3 = (c) => {
  const tierPowerMoves = {
    realtime: `
    1) Multi-call batching — group up to 10 calls per HTTP POST as an array. We process them in parallel internally.

    2) gzip your request bodies — we accept it. For high-volume bots this halves your egress bandwidth.

    3) Use WSS newHeads subscription for block-by-block triggers instead of polling eth_blockNumber every second.`,
    mempool: `
    1) eth_subscribe newPendingTransactions WITH full=true gets you the tx body, not just hash. Saves a round trip per pending tx.

    2) txpool_content for full mempool state — biggest signal at validator turnover (every ~440ms on BSC).

    3) Filter pending tx by gas tip in your bot — sandwich opportunities live above the bscexorcist floor.`,
    fullnode: `
    1) debug_traceCall with prestate tracer — best way to simulate a tx without state churn.

    2) debug_traceTransaction with callTracer + onlyTopCall for fast call-graph analysis.

    3) Full archive — you can run eth_getStorageAt against ANY historical block. Most providers prune past 128 blocks.`,
  };
  const moves = tierPowerMoves[c.tier] || '(tier-specific tips coming soon)';

  return {
    subject: `Three power moves for ${tierLabel[c.tier] || c.tier}`,
    text: shell(`
      Hey${c.name ? ' ' + c.name.split(' ')[0] : ''},

      Three days in. Here's the underused power for your tier:
      ${moves}

      Most customers ship their bot, then never tune it. Tuning is where the margin lives.

      Dashboard: ${BASE_URL}/dashboard

      — StreamSuite
    `),
  };
};

const D14 = (c) => ({
  subject: `Two weeks in — three questions, 90 seconds`,
  text: shell(`
    Hey${c.name ? ' ' + c.name.split(' ')[0] : ''},

    You've been on StreamSuite for two weeks. I'd love three short answers — just reply, no form:

    1. What would you happily pay $99/mo more for? (multi-region, multi-key, custom webhooks, dedicated capacity, something else)

    2. Anything missing that almost made you pick a competitor instead?

    3. What's working best — what should I not break in the next 90 days?

    The roadmap is shaped by these replies. One person reads them.

    — StreamSuite
    ${BASE_URL}
  `),
});

const builders = { day1: D1, day3: D3, day14: D14 };

async function sendMilestone(customer, key) {
  const build = builders[key];
  const { subject, text } = build(customer);
  const html = `<!doctype html><html><body style="font-family:'JetBrains Mono','SF Mono',monospace;background:#0a0a0a;color:#e6e6e6;padding:24px;max-width:640px;margin:0 auto;">
    <div style="background:#0d1117;border:1px solid #2a2a2a;border-radius:6px;padding:24px;">
      <pre style="margin:0;white-space:pre-wrap;font-size:13px;line-height:1.6;color:#e6e6e6;">${escHtml(text)}</pre>
    </div>
  </body></html>`;

  const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: customer.email, subject, html, text });
  if (error) {
    console.error(`[${key}] resend error for ${customer.email}:`, error);
    return false;
  }
  console.log(`[${key}] sent to ${customer.email} (msg ${data?.id})`);
  return true;
}

const NOW = Date.now();
const DAY = 86400000;
const milestones = [
  { key: 'day1',  col: 'onboarding_day1_at',  delay: 1 * DAY },
  { key: 'day3',  col: 'onboarding_day3_at',  delay: 3 * DAY },
  { key: 'day14', col: 'onboarding_day14_at', delay: 14 * DAY },
];

(async () => {
  let total = 0;
  for (const m of milestones) {
    const candidates = db.prepare(`
      SELECT email, name, tier, api_key, status, created_at
      FROM customers
      WHERE status IN ('active', 'past_due')
        AND api_key IS NOT NULL
        AND created_at <= ?
        AND ${m.col} IS NULL
    `).all(NOW - m.delay);

    for (const c of candidates) {
      try {
        const ok = await sendMilestone(c, m.key);
        if (ok) {
          db.prepare(`UPDATE customers SET ${m.col} = ?, updated_at = ? WHERE email = ?`).run(NOW, NOW, c.email);
          total++;
        }
      } catch (err) {
        console.error(`[${m.key}] failed for ${c.email}:`, err.message);
      }
    }
  }
  console.log(`${new Date().toISOString()} onboarding dispatch complete: ${total} email(s) sent`);
  db.close();
})();
