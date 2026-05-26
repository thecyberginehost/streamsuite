import Database from 'better-sqlite3';
import { customAlphabet } from 'nanoid';
import { ACTIVE_GROUP_ID, COLO_GROUPS, type ColoGroup } from './colo-groups';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.STREAMSUITE_DB_PATH || path.join(process.cwd(), 'data', 'streamsuite.db');

// Ensure data dir exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      tier TEXT NOT NULL,
      api_key TEXT,
      operator_id TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customers_stripe_sub ON customers(stripe_subscription_id);
  `);

  // Idempotent migrations on customers.
  const cols = _db.prepare("PRAGMA table_info(customers)").all() as Array<{ name: string }>;
  const colNames = new Set(cols.map(c => c.name));
  if (!colNames.has('github_id')) {
    _db.exec("ALTER TABLE customers ADD COLUMN github_id INTEGER");
  }
  if (!colNames.has('github_login')) {
    _db.exec("ALTER TABLE customers ADD COLUMN github_login TEXT");
  }
  // Onboarding email milestones — nullable INTEGER timestamps (ms).
  if (!colNames.has('onboarding_day1_at'))  _db.exec("ALTER TABLE customers ADD COLUMN onboarding_day1_at INTEGER");
  if (!colNames.has('onboarding_day3_at'))  _db.exec("ALTER TABLE customers ADD COLUMN onboarding_day3_at INTEGER");
  if (!colNames.has('onboarding_day14_at')) _db.exec("ALTER TABLE customers ADD COLUMN onboarding_day14_at INTEGER");
  // Colocation group attribution. New customers are placed onto the currently
  // active group (see lib/colo-groups.ts ACTIVE_GROUP_ID). When a group fills
  // we provision a new server and bump ACTIVE_GROUP_ID; existing customers
  // stay on their original group.
  if (!colNames.has('colo_group')) {
    _db.exec("ALTER TABLE customers ADD COLUMN colo_group TEXT NOT NULL DEFAULT 'va-bsc-01'");
  }
  _db.exec("CREATE INDEX IF NOT EXISTS idx_customers_colo_group ON customers(colo_group)");
  // Crypto payment tracking. crypto_paid_until is a unix-ms timestamp; null for
  // Stripe customers. Set on successful NOWPayments webhook to now + 30 days.
  // crypto_last_invoice_id is the most recent NOWPayments invoice id for renewals.
  // (Auto-revoke job that flips status → past_due when crypto_paid_until < now()
  // is TODO — for v1, manual review or operator script.)
  if (!colNames.has('crypto_paid_until')) {
    _db.exec("ALTER TABLE customers ADD COLUMN crypto_paid_until INTEGER");
  }
  if (!colNames.has('crypto_last_invoice_id')) {
    _db.exec("ALTER TABLE customers ADD COLUMN crypto_last_invoice_id TEXT");
  }
  _db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_github_id ON customers(github_id) WHERE github_id IS NOT NULL;`);

  _db.exec(`

    CREATE TABLE IF NOT EXISTS magic_tokens (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_magic_tokens_email ON magic_tokens(email);

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

    -- Stripe webhook idempotency. Stripe retries failed deliveries with the
    -- same event_id; we record every successfully-processed event so retries
    -- become 200-no-ops instead of double-creating customers.
    CREATE TABLE IF NOT EXISTS processed_stripe_events (
      event_id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      processed_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_processed_events_at ON processed_stripe_events(processed_at);

    -- Dedicated admin auth. Fully isolated from customer accounts: separate
    -- table, separate session table, separate cookie. Customer-side
    -- ADMIN_EMAILS env var no longer grants admin access — must log in via
    -- /admin/login with a bcrypt-hashed password.
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER,
      created_at INTEGER NOT NULL,
      last_login_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT,
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
  `);

  // Idempotent migrations on magic_tokens — add 6-digit code support.
  const mtCols = _db.prepare("PRAGMA table_info(magic_tokens)").all() as Array<{ name: string }>;
  const mtColNames = new Set(mtCols.map(c => c.name));
  if (!mtColNames.has('code')) {
    _db.exec("ALTER TABLE magic_tokens ADD COLUMN code TEXT");
  }
  if (!mtColNames.has('failed_attempts')) {
    _db.exec("ALTER TABLE magic_tokens ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0");
  }
  _db.exec("CREATE INDEX IF NOT EXISTS idx_magic_tokens_email_code ON magic_tokens(email, code)");

  return _db;
}

export type Customer = {
  id: number;
  email: string;
  name: string | null;
  tier: string;
  api_key: string | null;
  operator_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'pending' | 'active' | 'past_due' | 'cancelled';
  created_at: number;
  updated_at: number;
  github_id: number | null;
  github_login: string | null;
  colo_group: string;
  crypto_paid_until: number | null;
  crypto_last_invoice_id: string | null;
};

// Operator ID generator — 4-char uppercase alphanumeric, excludes 0/O/1/I/L
const operatorIdGen = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 4);
export function generateOperatorId(): string {
  return operatorIdGen();
}

// API key generator — 48 char hex
const apiKeyGen = customAlphabet('0123456789abcdef', 48);
export function generateApiKey(): string {
  return apiKeyGen();
}

// Session/magic token generator
const tokenGen = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 40);
export function generateToken(): string {
  return tokenGen();
}

export function upsertCustomerFromCheckout(opts: {
  email: string;
  name?: string | null;
  tier: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}): Customer {
  const now = Date.now();
  const existing = db().prepare('SELECT * FROM customers WHERE email = ?').get(opts.email) as Customer | undefined;

  if (existing) {
    db().prepare(`
      UPDATE customers
      SET tier = ?,
          name = COALESCE(?, name),
          stripe_customer_id = COALESCE(?, stripe_customer_id),
          stripe_subscription_id = COALESCE(?, stripe_subscription_id),
          status = 'active',
          updated_at = ?
      WHERE email = ?
    `).run(opts.tier, opts.name ?? null, opts.stripe_customer_id ?? null, opts.stripe_subscription_id ?? null, now, opts.email);
    return db().prepare('SELECT * FROM customers WHERE email = ?').get(opts.email) as Customer;
  }

  const operatorId = generateOperatorId();
  // colo_group uses ACTIVE_GROUP_ID at signup time (NOT the SQL column default)
  // so flipping ACTIVE_GROUP_ID in colo-groups.ts is sufficient to route new
  // customers onto a newly-provisioned server.
  db().prepare(`
    INSERT INTO customers (email, name, tier, operator_id, stripe_customer_id, stripe_subscription_id, status, colo_group, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `).run(opts.email, opts.name ?? null, opts.tier, operatorId, opts.stripe_customer_id ?? null, opts.stripe_subscription_id ?? null, ACTIVE_GROUP_ID, now, now);

  return db().prepare('SELECT * FROM customers WHERE email = ?').get(opts.email) as Customer;
}

export function getCustomerByEmail(email: string): Customer | undefined {
  return db().prepare('SELECT * FROM customers WHERE email = ?').get(email) as Customer | undefined;
}

export function setCustomerApiKey(email: string, apiKey: string): void {
  db().prepare('UPDATE customers SET api_key = ?, updated_at = ? WHERE email = ?').run(apiKey, Date.now(), email);
}

// --- GitHub OAuth binding ---

export function getCustomerByGithubId(githubId: number): Customer | undefined {
  return db().prepare('SELECT * FROM customers WHERE github_id = ?').get(githubId) as Customer | undefined;
}

// Find a customer whose email matches ANY of the provided (lower-cased) addresses.
// Used after GitHub OAuth: pick the first verified GitHub email that matches a
// customer row, so a single Stripe email need not equal the user's primary GH email.
export function findCustomerByAnyEmail(emails: string[]): Customer | undefined {
  if (emails.length === 0) return undefined;
  const placeholders = emails.map(() => '?').join(',');
  return db()
    .prepare(`SELECT * FROM customers WHERE email IN (${placeholders}) LIMIT 1`)
    .get(...emails) as Customer | undefined;
}

export function bindGithubToCustomer(email: string, githubId: number, githubLogin: string): void {
  db().prepare(
    'UPDATE customers SET github_id = ?, github_login = ?, updated_at = ? WHERE email = ?'
  ).run(githubId, githubLogin, Date.now(), email);
}

// --- Stripe lifecycle helpers ---

export function getCustomerByStripeSubscriptionId(subscriptionId: string): Customer | undefined {
  return db().prepare('SELECT * FROM customers WHERE stripe_subscription_id = ?').get(subscriptionId) as Customer | undefined;
}

// --- Colocation-group occupancy ---

// Counts of active+past_due customers per colo_group. Used by the public
// /api/colo-status endpoint to render slot-availability widgets on the
// marketing site. past_due is counted as active because Stripe's grace
// period means they still have a working key.
export function getColoGroupCounts(): Array<{ colo_group: string; active_count: number }> {
  return db()
    .prepare(`
      SELECT colo_group, COUNT(*) AS active_count
      FROM customers
      WHERE status IN ('active','past_due')
      GROUP BY colo_group
    `)
    .all() as Array<{ colo_group: string; active_count: number }>;
}

// Per-(group, tier) active counts. Used to enforce per-tier hard caps —
// specifically Full Node tier capped at 1 per box (two concurrent
// debug_traceTransaction tenants lock up geth).
export function getColoGroupCountsByTier(): Array<{ colo_group: string; tier: string; active_count: number }> {
  return db()
    .prepare(`
      SELECT colo_group, tier, COUNT(*) AS active_count
      FROM customers
      WHERE status IN ('active','past_due')
      GROUP BY colo_group, tier
    `)
    .all() as Array<{ colo_group: string; tier: string; active_count: number }>;
}

// Crypto payment: upsert customer on successful NOWPayments webhook.
// Sets status='active', extends crypto_paid_until by 30 days, generates
// API key + operator_id if first-time. Returns the customer row.
export function upsertCustomerFromCryptoPayment(opts: {
  email: string;
  tier: string;
  invoice_id: string;
  paid_until: number;
}): Customer {
  const now = Date.now();
  const existing = db().prepare('SELECT * FROM customers WHERE email = ?').get(opts.email) as Customer | undefined;

  if (existing) {
    // Renewal or tier change — extend paid_until, keep existing api_key
    db().prepare(`
      UPDATE customers
      SET tier = ?,
          status = 'active',
          crypto_paid_until = ?,
          crypto_last_invoice_id = ?,
          updated_at = ?
      WHERE email = ?
    `).run(opts.tier, opts.paid_until, opts.invoice_id, now, opts.email);
    return db().prepare('SELECT * FROM customers WHERE email = ?').get(opts.email) as Customer;
  }

  const operatorId = generateOperatorId();
  db().prepare(`
    INSERT INTO customers (email, tier, operator_id, status, colo_group, crypto_paid_until, crypto_last_invoice_id, created_at, updated_at)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)
  `).run(opts.email, opts.tier, operatorId, ACTIVE_GROUP_ID, opts.paid_until, opts.invoice_id, now, now);

  return db().prepare('SELECT * FROM customers WHERE email = ?').get(opts.email) as Customer;
}

// Returns the colo group that is currently LIVE and has slot capacity for a
// new signup of the given tier. If `tier` is omitted, returns the first group
// with ANY tier capacity. Returns null if no such group exists.
//
// Per-tier gating: passing tier='fullnode' will reject a group whose Full
// Node slot is already taken even if other tiers have room. Mempool/realtime
// only check against total max_slots.
//
// Selection order:
//   1. Prefer the configured ACTIVE_GROUP_ID if it qualifies
//   2. Otherwise, the first 'open' group with remaining capacity for this tier
//   3. Otherwise null
export function getAcceptingGroup(tier?: string): ColoGroup | null {
  const totals = new Map<string, number>();
  for (const r of getColoGroupCounts()) totals.set(r.colo_group, r.active_count);

  const byTier = new Map<string, number>();
  for (const r of getColoGroupCountsByTier()) {
    byTier.set(`${r.colo_group}|${r.tier}`, r.active_count);
  }

  const isAccepting = (g: ColoGroup) => {
    if (g.status !== 'open') return false;
    if ((totals.get(g.id) ?? 0) >= g.max_slots) return false;
    if (tier === 'fullnode') {
      const fn = byTier.get(`${g.id}|fullnode`) ?? 0;
      if (fn >= g.tier_caps.fullnode) return false;
    }
    return true;
  };

  const active = COLO_GROUPS.find(g => g.id === ACTIVE_GROUP_ID);
  if (active && isAccepting(active)) return active;

  return COLO_GROUPS.find(isAccepting) ?? null;
}

export function getCustomerByStripeCustomerId(stripeCustomerId: string): Customer | undefined {
  return db().prepare('SELECT * FROM customers WHERE stripe_customer_id = ?').get(stripeCustomerId) as Customer | undefined;
}

export function updateCustomerStatus(email: string, status: 'pending' | 'active' | 'past_due' | 'cancelled'): void {
  db().prepare('UPDATE customers SET status = ?, updated_at = ? WHERE email = ?').run(status, Date.now(), email);
}

export function updateCustomerTier(email: string, tier: string): void {
  db().prepare('UPDATE customers SET tier = ?, updated_at = ? WHERE email = ?').run(tier, Date.now(), email);
}

// Magic-link auth — returns both a 32-byte hex link token AND a 6-digit code.
// The link works for users who click; the code works for users stuck in
// in-app email browsers (Gmail iOS, Apple Mail webview) where cookies set
// at the link's response don't persist to the main browser context.
const codeGen = customAlphabet('0123456789', 6);
export function generateMagicCode(): string {
  return codeGen();
}

export function createMagicToken(email: string, ttlMs = 15 * 60 * 1000): { token: string; code: string } {
  const token = generateToken();
  const code = generateMagicCode();
  const now = Date.now();
  db().prepare('INSERT INTO magic_tokens (token, email, created_at, expires_at, code) VALUES (?, ?, ?, ?, ?)').run(
    token, email, now, now + ttlMs, code,
  );
  return { token, code };
}

export function consumeMagicToken(token: string): { email: string } | null {
  const row = db().prepare('SELECT * FROM magic_tokens WHERE token = ?').get(token) as
    | { token: string; email: string; created_at: number; expires_at: number; used_at: number | null }
    | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) return null;
  // Allow re-use within TTL — email scanners/prefetchers can hit the link
  // before the user clicks it. Tokens still self-expire at expires_at.
  // We record the FIRST use timestamp; subsequent uses just stamp last_used.
  if (!row.used_at) {
    db().prepare('UPDATE magic_tokens SET used_at = ? WHERE token = ?').run(Date.now(), token);
  }
  return { email: row.email };
}

// Code-based magic auth — used by users stuck in in-app email browsers
// who can't rely on link-redirect cookies persisting.
//
// Returns 'ok' (consumed) | 'invalid' (no match) | 'locked' (>= 5 failures)
// | 'expired' (no live tokens for this email).
//
// Brute-force defense:
// - Lookup scoped by (email, code) — random 6 digits over an unknown email
//   set is ~20 bits per attempt; with email known, attacker has 10^6 codes.
// - Each active token row tracks failed_attempts; locks at 5.
// - The verify-code endpoint enforces an IP-level rate limit separately.
export type MagicCodeResult = 'ok' | 'invalid' | 'locked' | 'expired';

export function consumeMagicCode(email: string, code: string): {
  result: MagicCodeResult;
  email?: string;
} {
  const now = Date.now();
  // Are there any live tokens for this email?
  const live = db()
    .prepare('SELECT token, code, failed_attempts, used_at FROM magic_tokens WHERE email = ? AND expires_at > ? ORDER BY created_at DESC')
    .all(email, now) as Array<{ token: string; code: string | null; failed_attempts: number; used_at: number | null }>;
  if (live.length === 0) return { result: 'expired' };

  // Look for a live, unused, non-locked row whose code matches.
  const match = live.find(r => r.code === code && r.used_at == null && r.failed_attempts < 5);
  if (match) {
    db().prepare('UPDATE magic_tokens SET used_at = ? WHERE token = ?').run(now, match.token);
    return { result: 'ok', email };
  }

  // No match. Increment failed_attempts on the most recent live row
  // (so 5 wrong guesses against a fresh code lock the user out and force a
  // new code request — instead of letting an attacker brute-force forever).
  const target = live.find(r => r.used_at == null && r.failed_attempts < 5);
  if (target) {
    db().prepare('UPDATE magic_tokens SET failed_attempts = failed_attempts + 1 WHERE token = ?').run(target.token);
    const updated = target.failed_attempts + 1;
    if (updated >= 5) return { result: 'locked' };
    return { result: 'invalid' };
  }

  // All live rows are either used or already locked.
  return { result: 'locked' };
}

// Admin accounts (separate from customers).
export type Admin = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  failed_attempts: number;
  locked_until: number | null;
  created_at: number;
  last_login_at: number | null;
};

export function createAdmin(username: string, email: string, passwordHash: string): Admin {
  const now = Date.now();
  db().prepare(
    'INSERT INTO admins (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
  ).run(username, email, passwordHash, now);
  return db().prepare('SELECT * FROM admins WHERE username = ?').get(username) as Admin;
}

export function getAdminByUsername(username: string): Admin | null {
  return db().prepare('SELECT * FROM admins WHERE username = ?').get(username) as Admin | undefined ?? null;
}

export function getAdminById(id: number): Admin | null {
  return db().prepare('SELECT * FROM admins WHERE id = ?').get(id) as Admin | undefined ?? null;
}

export function markAdminLoginSuccess(adminId: number): void {
  db().prepare('UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?').run(Date.now(), adminId);
}

export function markAdminLoginFailure(adminId: number): { locked: boolean } {
  const row = db().prepare('SELECT failed_attempts FROM admins WHERE id = ?').get(adminId) as { failed_attempts: number } | undefined;
  if (!row) return { locked: false };
  const next = row.failed_attempts + 1;
  // Lock for 15 min after 5 consecutive failures.
  if (next >= 5) {
    const lockUntil = Date.now() + 15 * 60 * 1000;
    db().prepare('UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?').run(next, lockUntil, adminId);
    return { locked: true };
  }
  db().prepare('UPDATE admins SET failed_attempts = ? WHERE id = ?').run(next, adminId);
  return { locked: false };
}

// Admin sessions.
export function createAdminSession(adminId: number, opts: { ip?: string; userAgent?: string } = {}, ttlMs = 24 * 60 * 60 * 1000): string {
  const token = generateToken();
  const now = Date.now();
  db().prepare(
    'INSERT INTO admin_sessions (token, admin_id, created_at, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(token, adminId, now, now + ttlMs, opts.ip ?? null, opts.userAgent ?? null);
  return token;
}

export function getAdminSession(token: string): { adminId: number } | null {
  const row = db().prepare('SELECT admin_id, expires_at FROM admin_sessions WHERE token = ?').get(token) as
    | { admin_id: number; expires_at: number }
    | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) return null;
  return { adminId: row.admin_id };
}

export function deleteAdminSession(token: string): void {
  db().prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}

// Stripe webhook idempotency.
export function isStripeEventProcessed(eventId: string): boolean {
  const row = db().prepare('SELECT 1 FROM processed_stripe_events WHERE event_id = ?').get(eventId);
  return !!row;
}

export function markStripeEventProcessed(eventId: string, type: string): void {
  db()
    .prepare('INSERT OR IGNORE INTO processed_stripe_events (event_id, type, processed_at) VALUES (?, ?, ?)')
    .run(eventId, type, Date.now());
}

// Sessions
export function createSession(email: string, opts: { ip?: string; userAgent?: string } = {}, ttlMs = 30 * 24 * 60 * 60 * 1000): string {
  const token = generateToken();
  const now = Date.now();
  db().prepare('INSERT INTO sessions (token, email, created_at, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)').run(
    token, email, now, now + ttlMs, opts.ip ?? null, opts.userAgent ?? null,
  );
  return token;
}

export function getSession(token: string): { email: string } | null {
  const row = db().prepare('SELECT email, expires_at FROM sessions WHERE token = ?').get(token) as
    | { email: string; expires_at: number }
    | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) return null;
  return { email: row.email };
}

export function deleteSession(token: string): void {
  db().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
