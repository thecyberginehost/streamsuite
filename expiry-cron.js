// StreamSuite crypto-access expiry cron.
// Runs hourly. Two passes:
//   1. T-3 reminder — email crypto customers ~3 days before their access lapses
//   2. Revoke — flip status='expired' for customers past crypto_paid_until
//
// Idempotency: crypto_expiry_notified_at marks "we already nudged this person
// this cycle". Cleared on renewal in upsertCustomerFromCryptoPayment, so the
// next billing window gets a fresh nudge.
//
// Access revocation: status='expired' is excluded from /api/internal/customers,
// which the BSC-node sync (every 5s) reads to regenerate the nginx api-key map.
// So flipping status here removes RPC access within ~5s.
//
// Stripe customers are never touched — they have their own dunning lifecycle
// (active -> past_due -> unpaid -> canceled) handled by Stripe webhook.

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT = '/home/filthy/streamsuite';
const DB_PATH = path.join(ROOT, 'data', 'streamsuite.db');
const ENV_PATH = path.join(ROOT, '.env.local');

const env = {};
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const RESEND_KEY = env.RESEND_API_KEY;
const FROM_EMAIL = env.FROM_EMAIL || 'StreamSuite <noreply@send.streamsuite.io>';
const BASE_URL = env.NEXTAUTH_URL || 'https://streamsuite.io';

if (!RESEND_KEY) {
  console.error('expiry: RESEND_API_KEY not set, exiting');
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

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_MS = 3 * DAY_MS;

function shell(s) {
  return s.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function reminderEmail(c) {
  const expires = fmtDate(c.crypto_paid_until);
  const tier = tierLabel[c.tier] || c.tier;
  const renewUrl = `${BASE_URL}/checkout/crypto/${c.tier}`;
  return {
    subject: `Your StreamSuite ${tier} access expires ${expires} — renew anytime`,
    text: shell(`
      Hey${c.name ? ' ' + c.name.split(' ')[0] : ''},

      Heads up — your StreamSuite ${tier} access lapses on ${expires}.

      Crypto access is one-time (no auto-renewal), so if you want to keep your
      RPC + WSS endpoints running, renew with a one-click crypto payment:

      ${renewUrl}

      Pays for another 30 days. Same API key, same operator ID, no migration.

      If you'd rather not renew, no action needed — access stops automatically
      and we won't bill anything. You can come back any time.

      Dashboard:
      ${BASE_URL}/dashboard
    `),
    html: `<!doctype html>
<html><body style="margin:0;padding:24px;background:#0a0a0a;color:#e6e6e6;font-family:'JetBrains Mono','SF Mono',Menlo,monospace;font-size:13px;line-height:1.7">
  <div style="max-width:560px;margin:0 auto">
    <p style="color:#7af0bf;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px">┌─ access expiring soon ─┐</p>
    <h1 style="font-size:18px;font-weight:600;margin:0 0 16px;color:#fff">Your ${tier} access expires ${expires}</h1>
    <p>Hey${c.name ? ' ' + c.name.split(' ')[0] : ''},</p>
    <p>Heads up — your StreamSuite <strong>${tier}</strong> access lapses on <strong>${expires}</strong>.</p>
    <p>Crypto access is one-time (no auto-renewal), so if you want to keep your RPC + WSS endpoints running, renew with a one-click crypto payment:</p>
    <p style="margin:24px 0"><a href="${renewUrl}" style="display:inline-block;padding:10px 20px;background:#7af0bf;color:#0a0a0a;text-decoration:none;font-weight:600;border-radius:4px">Renew with crypto →</a></p>
    <p>Pays for another 30 days. Same API key, same operator ID, no migration.</p>
    <p style="color:#888">If you'd rather not renew, no action needed — access stops automatically and we won't bill anything. You can come back any time.</p>
    <p style="margin-top:32px;color:#888;font-size:11px">Dashboard: <a href="${BASE_URL}/dashboard" style="color:#7af0bf">${BASE_URL}/dashboard</a></p>
  </div>
</body></html>`,
  };
}

function expiredEmail(c) {
  const tier = tierLabel[c.tier] || c.tier;
  const renewUrl = `${BASE_URL}/checkout/crypto/${c.tier}`;
  return {
    subject: `Your StreamSuite ${tier} access has expired`,
    text: shell(`
      Hey${c.name ? ' ' + c.name.split(' ')[0] : ''},

      Your StreamSuite ${tier} access lapsed today. RPC + WSS calls with your
      API key will now return 401.

      Renew any time with crypto — same key, same operator ID, no migration:

      ${renewUrl}

      We don't auto-bill. If you're done with StreamSuite, no action needed.
    `),
    html: `<!doctype html>
<html><body style="margin:0;padding:24px;background:#0a0a0a;color:#e6e6e6;font-family:'JetBrains Mono','SF Mono',Menlo,monospace;font-size:13px;line-height:1.7">
  <div style="max-width:560px;margin:0 auto">
    <p style="color:#fbbf24;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px">┌─ access lapsed ─┐</p>
    <h1 style="font-size:18px;font-weight:600;margin:0 0 16px;color:#fff">Your ${tier} access has expired</h1>
    <p>Hey${c.name ? ' ' + c.name.split(' ')[0] : ''},</p>
    <p>Your StreamSuite <strong>${tier}</strong> access lapsed today. RPC + WSS calls with your API key will now return 401.</p>
    <p>Renew any time with crypto — same key, same operator ID, no migration:</p>
    <p style="margin:24px 0"><a href="${renewUrl}" style="display:inline-block;padding:10px 20px;background:#7af0bf;color:#0a0a0a;text-decoration:none;font-weight:600;border-radius:4px">Renew with crypto →</a></p>
    <p style="color:#888">We don't auto-bill. If you're done with StreamSuite, no action needed.</p>
  </div>
</body></html>`,
  };
}

async function sendOnce(to, msg, tag) {
  try {
    const res = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      tags: [{ name: 'kind', value: tag }],
    });
    if (res?.error) {
      console.error(`expiry: send ${tag} to ${to} failed:`, res.error);
      return false;
    }
    console.log(`expiry: sent ${tag} to ${to} (id=${res?.data?.id || '?'})`);
    return true;
  } catch (e) {
    console.error(`expiry: send ${tag} to ${to} threw:`, e?.message || e);
    return false;
  }
}

(async () => {
  const now = Date.now();
  const reminderThreshold = now + REMINDER_WINDOW_MS;

  // ── Pass 1: T-3 reminders ──
  // Customers with crypto access expiring within 3 days, no Stripe sub, still
  // active, and not yet notified this cycle.
  const toRemind = db.prepare(`
    SELECT email, name, tier, crypto_paid_until
    FROM customers
    WHERE status = 'active'
      AND crypto_paid_until IS NOT NULL
      AND crypto_paid_until > ?
      AND crypto_paid_until <= ?
      AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '')
      AND crypto_expiry_notified_at IS NULL
  `).all(now, reminderThreshold);

  console.log(`expiry: T-3 candidates: ${toRemind.length}`);
  for (const c of toRemind) {
    const ok = await sendOnce(c.email, reminderEmail(c), 'crypto_expiry_reminder');
    if (ok) {
      db.prepare('UPDATE customers SET crypto_expiry_notified_at = ? WHERE email = ?')
        .run(Date.now(), c.email);
    }
  }

  // ── Pass 2: revoke expired ──
  const toRevoke = db.prepare(`
    SELECT email, name, tier, crypto_paid_until
    FROM customers
    WHERE status = 'active'
      AND crypto_paid_until IS NOT NULL
      AND crypto_paid_until < ?
      AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '')
  `).all(now);

  console.log(`expiry: revoke candidates: ${toRevoke.length}`);
  for (const c of toRevoke) {
    db.prepare(`UPDATE customers SET status = 'expired', updated_at = ? WHERE email = ?`)
      .run(Date.now(), c.email);
    console.log(`expiry: revoked ${c.email} (paid_until=${new Date(c.crypto_paid_until).toISOString()})`);
    // Send the "your access has expired" courtesy email
    await sendOnce(c.email, expiredEmail(c), 'crypto_expired_notice');
  }

  console.log(`expiry: done at ${new Date().toISOString()} — notified ${toRemind.length}, revoked ${toRevoke.length}`);
  db.close();
})().catch(e => {
  console.error('expiry: fatal:', e);
  process.exit(1);
});
