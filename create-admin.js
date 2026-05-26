#!/usr/bin/env node
// CLI to create or reset an admin account.
//
// Usage:
//   node create-admin.js <username> <email> <password>
//   node create-admin.js --reset <username> <new_password>
//   node create-admin.js --list
//
// Run from the streamsuite project root so process.cwd() resolves to the
// data/ dir correctly. The hash is computed with bcrypt cost 12.

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.STREAMSUITE_DB_PATH || path.join(process.cwd(), 'data', 'streamsuite.db');
const BCRYPT_COST = 12;

function usage() {
  console.log(`Usage:
  node create-admin.js <username> <email> <password>      # create new admin
  node create-admin.js --reset <username> <new_password>  # reset existing admin's password
  node create-admin.js --list                             # show all admins (no passwords)
`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const db = new Database(DB_PATH);

// Ensure the admins table exists. It's normally created on next.js startup,
// but this script may run BEFORE the app first boots.
db.exec(`
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
`);

(async () => {
  if (args[0] === '--list') {
    const rows = db.prepare('SELECT id, username, email, datetime(created_at/1000, \'unixepoch\') as created, datetime(last_login_at/1000, \'unixepoch\') as last_login FROM admins ORDER BY id').all();
    if (rows.length === 0) {
      console.log('(no admins yet)');
    } else {
      console.table(rows);
    }
    process.exit(0);
  }

  if (args[0] === '--reset') {
    if (args.length !== 3) usage();
    const [, username, newPassword] = args;
    if (newPassword.length < 12) {
      console.error('ERROR: password must be at least 12 chars');
      process.exit(2);
    }
    const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
    if (!existing) {
      console.error(`ERROR: no admin with username "${username}"`);
      process.exit(3);
    }
    const hash = await bcrypt.hash(newPassword, BCRYPT_COST);
    db.prepare('UPDATE admins SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE username = ?').run(hash, username);
    console.log(`✓ password reset for admin "${username}". Lockout cleared.`);
    process.exit(0);
  }

  if (args.length !== 3) usage();
  const [username, email, password] = args;
  if (password.length < 12) {
    console.error('ERROR: password must be at least 12 chars');
    process.exit(2);
  }
  // Username accepts plain handles (a-z 0-9 _ . -) OR full email format.
  // SECURITY: email-format usernames must start with `adm.` — the prefix
  // is a hard rule. If someone tries to log in with `aamore@streamsuite.io`
  // (no prefix), the request is rejected before bcrypt even runs.
  const isPlainHandle = /^[a-zA-Z0-9_.-]{3,32}$/.test(username);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
  if (!isPlainHandle && !isEmail) {
    console.error('ERROR: username must be 3-32 chars (alphanumeric/underscore/dot/dash) OR a full email address');
    process.exit(2);
  }
  if (isEmail && !username.startsWith('adm.')) {
    console.error('ERROR: email-format admin usernames must start with `adm.` (e.g. adm.aamore@streamsuite.io). This is a hard security rule.');
    process.exit(2);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('ERROR: invalid email');
    process.exit(2);
  }

  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
  if (existing) {
    console.error(`ERROR: admin with username "${username}" already exists. Use --reset to change password.`);
    process.exit(3);
  }

  const hash = await bcrypt.hash(password, BCRYPT_COST);
  const now = Date.now();
  db.prepare('INSERT INTO admins (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(username, email, hash, now);
  console.log(`✓ admin created.
  username: ${username}
  email:    ${email}
  hash:     bcrypt cost ${BCRYPT_COST}

Log in at /admin/login on this host.
`);
})().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
