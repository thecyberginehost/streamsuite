#!/bin/bash
# StreamSuite SQLite snapshot — lockless online backup.
# Runs every 15 min via cron. Keeps last 96 snapshots (24h).
# Each backup uses sqlite3's .backup API which doesn't block writes.

set -euo pipefail

# Absolute node path — cron's bash -lc + nvm.sh sourcing does NOT reliably
# propagate the nvm-managed PATH into this script's sub-shell. Hard-coding
# the binary avoids the "node: command not found" loop we hit between
# 2026-05-16 and 2026-05-26 (10 days of silently failing snapshots).
# Override with $NODE env var if the version path changes.
NODE="${NODE:-/home/filthy/.nvm/versions/node/v22.22.0/bin/node}"

DB=/home/filthy/streamsuite/data/streamsuite.db
BACKUP_DIR=/home/filthy/streamsuite/backups
KEEP=96

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

TS=$(date -u +%Y%m%d-%H%M%S)
DEST="$BACKUP_DIR/streamsuite-$TS.db"

# better-sqlite3 doesn't ship sqlite3 CLI; use node.
"$NODE" -e "
  const Database = require('/home/filthy/streamsuite/node_modules/better-sqlite3');
  const src = new Database('$DB', { readonly: true });
  src.backup('$DEST').then(() => {
    src.close();
    process.exit(0);
  }).catch(err => {
    console.error('backup failed:', err.message);
    process.exit(1);
  });
"

# Compress
gzip -9 "$DEST"
DEST="$DEST.gz"

# Validate the snapshot is readable
"$NODE" -e "
  const fs = require('fs');
  const zlib = require('zlib');
  const Database = require('/home/filthy/streamsuite/node_modules/better-sqlite3');
  const tmp = '/tmp/ss-verify-$$.db';
  const buf = zlib.gunzipSync(fs.readFileSync('$DEST'));
  fs.writeFileSync(tmp, buf);
  const db = new Database(tmp, { readonly: true });
  const rows = db.prepare('SELECT COUNT(*) AS n FROM customers').get();
  db.close();
  fs.unlinkSync(tmp);
  console.log('verified: $DEST (' + rows.n + ' customers)');
" || { echo "verification failed; keeping snapshot anyway"; }

# Prune: keep newest $KEEP
ls -1t "$BACKUP_DIR"/streamsuite-*.db.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) snapshot ok: $DEST"
