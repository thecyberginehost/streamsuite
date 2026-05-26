#!/usr/bin/env node
// Stripe webhook fulfillment monitor.
//
// Catches the scary case: customer paid, Stripe sent us the webhook, but our
// handler crashed/timed-out and never finished fulfillment. Customer sits
// keyless thinking they got scammed.
//
// How it works: scans the last hour of stripe-events.jsonl. For every
// `fulfillment_required` line (logged at the very top of checkout handler),
// looks for a matching `customer_upserted` line with the same event_id
// (logged after upsert succeeds). If the upsert log is missing AND the
// event is at least 10 min old (giving the handler time on initial blip
// + Stripe's retries), POST an alert to /api/internal/alert.
//
// Runs hourly via cron. Idempotent — alerts are throttled by event_id via
// a sidecar state file so we don't re-alert hourly on the same stuck event.

const fs = require('fs');
const path = require('path');
const https = require('https');

const LOG_PATH = process.env.STRIPE_LOG_PATH || path.join(__dirname, 'logs', 'stripe-events.jsonl');
const STATE_PATH = path.join(__dirname, 'logs', 'fulfillment-monitor.state.json');
const ALERT_URL = process.env.ALERT_URL || 'https://streamsuite.io/api/internal/alert';
const SYNC_SECRET = process.env.STREAMSUITE_SYNC_SECRET || '';

const NOW = Date.now();
const LOOKBACK_MS = 60 * 60 * 1000;    // scan last hour
const MIN_AGE_MS = 10 * 60 * 1000;     // must be at least 10 min old

function readLog() {
  if (!fs.existsSync(LOG_PATH)) return [];
  const raw = fs.readFileSync(LOG_PATH, 'utf8');
  const lines = raw.split('\n').filter(Boolean);
  const out = [];
  for (const ln of lines) {
    try { out.push(JSON.parse(ln)); } catch {}
  }
  return out;
}

function readState() {
  if (!fs.existsSync(STATE_PATH)) return { alerted: {} };
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch { return { alerted: {} }; }
}

function writeState(s) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
}

function postAlert(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const u = new URL(ALERT_URL);
    const req = https.request({
      method: 'POST',
      hostname: u.hostname,
      path: u.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${SYNC_SECRET}`,
      },
    }, res => {
      res.resume();
      res.on('end', () => res.statusCode < 300 ? resolve() : reject(new Error(`alert HTTP ${res.statusCode}`)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const events = readLog();
  const cutoff = NOW - LOOKBACK_MS;
  const recent = events.filter(e => {
    if (!e.ts) return false;
    return new Date(e.ts).getTime() > cutoff;
  });

  // Build a set of event_ids that DID have a customer_upserted follow-up.
  const fulfilled = new Set();
  for (const e of recent) {
    if (e.type === 'customer_upserted' && e.event_id) {
      fulfilled.add(e.event_id);
    }
  }

  // Find fulfillment_required older than MIN_AGE_MS without a fulfilled follow-up.
  const stuck = [];
  for (const e of recent) {
    if (e.type !== 'fulfillment_required') continue;
    if (!e.event_id) continue;
    const age = NOW - new Date(e.ts).getTime();
    if (age < MIN_AGE_MS) continue;        // give handler time
    if (fulfilled.has(e.event_id)) continue;
    stuck.push(e);
  }

  if (stuck.length === 0) {
    console.log(`[fulfillment-monitor] ok — ${recent.length} events scanned, 0 stuck`);
    return;
  }

  const state = readState();
  for (const ev of stuck) {
    if (state.alerted[ev.event_id]) {
      console.log(`[fulfillment-monitor] already alerted on ${ev.event_id}, skipping`);
      continue;
    }
    const subject = `[StreamSuite] STUCK FULFILLMENT — ${ev.email || 'unknown'}`;
    const text = `Stripe webhook fired but handler didn't finish:

  event_id:       ${ev.event_id}
  tier:           ${ev.tier}
  email:          ${ev.email}
  amount:         ${ev.amount}
  stripe_cust:    ${ev.customer_id}
  stripe_sub:     ${ev.subscription_id}
  age:            ${Math.round((NOW - new Date(ev.ts).getTime()) / 60000)} min

Customer paid but no customer_upserted log entry for this event_id.
Check pm2 logs and manually provision if needed.
`;
    try {
      await postAlert({ severity: 'critical', kind: 'stuck_fulfillment', subject, text });
      state.alerted[ev.event_id] = NOW;
      console.log(`[fulfillment-monitor] ALERTED on ${ev.event_id}`);
    } catch (err) {
      console.error(`[fulfillment-monitor] alert failed on ${ev.event_id}:`, err.message);
    }
  }

  // Prune state entries older than 7 days.
  for (const id of Object.keys(state.alerted)) {
    if (NOW - state.alerted[id] > 7 * 24 * 3600 * 1000) delete state.alerted[id];
  }
  writeState(state);
}

main().catch(err => {
  console.error('[fulfillment-monitor] fatal', err);
  process.exit(1);
});
