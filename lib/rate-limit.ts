// In-memory rate limiters. Single pm2 fork instance, so a Map is fine.
// On server restart, buckets reset — acceptable: attackers reset too, and
// the underlying token rotation in createMagicToken provides defense-in-depth.

type Bucket = { count: number; resetAt: number };

function makeBucket(maxCount: number, windowMs: number) {
  const map = new Map<string, Bucket>();
  return {
    check(key: string): { ok: boolean; resetIn?: number } {
      const now = Date.now();
      const b = map.get(key);
      if (!b || b.resetAt < now) {
        map.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true };
      }
      b.count += 1;
      if (b.count > maxCount) {
        return { ok: false, resetIn: Math.ceil((b.resetAt - now) / 1000) };
      }
      return { ok: true };
    },
    // For tests / admin reset
    clear() {
      map.clear();
    },
  };
}

// Auth-request limits — twin keys (IP + email).
// IP: 10 / minute. Stops drive-by spammers.
// Email: 5 / hour. Stops targeted inbox-bombing of a known address.
export const authRequestByIp = makeBucket(10, 60_000);
export const authRequestByEmail = makeBucket(5, 60 * 60_000);

// Admin login limits — tighter than customer auth.
// IP: 10 / 15-min window. Per-account lockout handled in DB after 5 fails.
export const adminLoginByIp = makeBucket(10, 15 * 60_000);

// Request-access form limits — public, sends operator emails on every POST.
// Strict because there's no legitimate reason for the same IP/email to
// submit more than a few times. Strict windows prevent inbox flooding.
export const requestAccessByIp = makeBucket(5, 60 * 60_000);          // 5/hour/IP
export const requestAccessByEmail = makeBucket(2, 24 * 60 * 60_000);  // 2/day/email
