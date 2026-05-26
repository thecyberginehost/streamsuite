import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIER_PRICE: Record<string, number> = {
  realtime: 399,
  mempool: 999,
  fullnode: 2499,
};

type Row = {
  id: number;
  email: string;
  name: string | null;
  tier: string;
  status: string;
  operator_id: string | null;
  api_key: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  github_login: string | null;
  created_at: number;
  updated_at: number;
  crypto_paid_until: number | null;
  crypto_last_invoice_id: string | null;
};

// "Stripe" / "Crypto" / "Both" / "None" — drives the Payment column and the
// "Cancel" CTA logic (Stripe sub cancellation vs crypto auto-revoke).
function paymentMode(r: Row): 'stripe' | 'crypto' | 'both' | 'none' {
  const hasStripe = !!r.stripe_subscription_id;
  const hasCrypto = !!r.crypto_paid_until;
  if (hasStripe && hasCrypto) return 'both';
  if (hasStripe) return 'stripe';
  if (hasCrypto) return 'crypto';
  return 'none';
}

export default async function AdminCustomersPage() {
  const admin = await requireAdmin();

  const rows = db().prepare(`
    SELECT id, email, name, tier, status, operator_id, api_key,
           stripe_customer_id, stripe_subscription_id, github_login,
           created_at, updated_at,
           crypto_paid_until, crypto_last_invoice_id
    FROM customers ORDER BY created_at DESC
  `).all() as Row[];

  // MRR = sum of tier price for active/past_due customers who have a Stripe
  // subscription (i.e. genuine recurring revenue). Crypto-only customers don't
  // count toward MRR — they're one-time 30-day windows. They're tracked
  // separately as "crypto active".
  const stripeRecurring = rows.filter(r =>
    (r.status === 'active' || r.status === 'past_due') && r.stripe_subscription_id);
  const mrr = stripeRecurring.reduce((sum, r) => sum + (TIER_PRICE[r.tier] || 0), 0);

  const now = Date.now();
  const cryptoActive = rows.filter(r =>
    r.status === 'active' && r.crypto_paid_until && r.crypto_paid_until > now);
  const expired = rows.filter(r => r.status === 'expired').length;
  const cancelled = rows.filter(r => r.status === 'cancelled').length;
  const totalActive = rows.filter(r => r.status === 'active' || r.status === 'past_due').length;

  const fmtTs = (ms: number) => new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + 'Z';
  const fmtDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const shortKey = (k: string | null) => k ? `${k.slice(0, 8)}…${k.slice(-4)}` : '—';
  const daysUntil = (ms: number) => Math.ceil((ms - now) / 86_400_000);

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-2">┌── admin ──┐</p>
            <h1 className="text-2xl font-semibold">Customers</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-muted">signed in as <span className="text-amber-400">{admin.username}</span></span>
            <form action="/api/admin/auth/logout" method="POST">
              <button type="submit" className="text-muted hover:text-red-400 uppercase tracking-wider">
                logout
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="card p-4">
            <p className="text-muted text-[11px] uppercase tracking-wider font-mono mb-1">Stripe MRR</p>
            <p className="text-2xl font-mono font-semibold text-accent">${mrr.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-[11px] uppercase tracking-wider font-mono mb-1">Active total</p>
            <p className="text-2xl font-mono font-semibold">{totalActive}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-[11px] uppercase tracking-wider font-mono mb-1">Crypto active</p>
            <p className="text-2xl font-mono font-semibold text-amber-300">{cryptoActive.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-[11px] uppercase tracking-wider font-mono mb-1">Expired / cancelled</p>
            <p className="text-2xl font-mono font-semibold text-muted">{expired + cancelled}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-[11px] uppercase tracking-wider font-mono mb-1">Total rows</p>
            <p className="text-2xl font-mono font-semibold">{rows.length}</p>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="border-b border-border">
              <tr className="text-left text-muted uppercase tracking-wider">
                <th className="p-3">Op</th>
                <th className="p-3">Email</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Status</th>
                <th className="p-3">Pay</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Key</th>
                <th className="p-3">GH</th>
                <th className="p-3">Created</th>
                <th className="p-3">Ops</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const mode = paymentMode(r);
                const daysLeft = r.crypto_paid_until ? daysUntil(r.crypto_paid_until) : null;
                return (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-white/5">
                    <td className="p-3 text-accent font-semibold">{r.operator_id || '—'}</td>
                    <td className="p-3 break-all">{r.email}{r.name && <span className="text-muted ml-2">({r.name})</span>}</td>
                    <td className="p-3">{r.tier}</td>
                    <td className="p-3">
                      <span className={
                        r.status === 'active'    ? 'text-accent' :
                        r.status === 'past_due'  ? 'text-amber-400' :
                        r.status === 'expired'   ? 'text-red-400/70' :
                        r.status === 'cancelled' ? 'text-red-400' :
                                                   'text-muted'
                      }>{r.status}</span>
                    </td>
                    <td className="p-3">
                      <span className={
                        mode === 'stripe' ? 'text-accent' :
                        mode === 'crypto' ? 'text-amber-300' :
                        mode === 'both'   ? 'text-accent-bright' :
                                            'text-muted'
                      }>{mode}</span>
                    </td>
                    <td className="p-3 text-[11px]">
                      {r.crypto_paid_until ? (
                        <span className={
                          daysLeft! < 0  ? 'text-red-400' :
                          daysLeft! <= 3 ? 'text-amber-400' :
                                           'text-muted'
                        } title={`crypto_paid_until = ${fmtTs(r.crypto_paid_until)}`}>
                          {fmtDate(r.crypto_paid_until)}
                          {daysLeft !== null && daysLeft > 0 && <span className="ml-1">({daysLeft}d)</span>}
                          {daysLeft !== null && daysLeft <= 0 && <span className="ml-1">(past)</span>}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="p-3 text-muted">{shortKey(r.api_key)}</td>
                    <td className="p-3 text-muted">{r.github_login ? `@${r.github_login}` : '—'}</td>
                    <td className="p-3 text-muted text-[11px]">{fmtTs(r.created_at)}</td>
                    <td className="p-3 text-[11px] whitespace-nowrap">
                      {r.stripe_customer_id ? (
                        <a
                          href={`https://dashboard.stripe.com/customers/${r.stripe_customer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent-bright underline"
                        >
                          Stripe →
                        </a>
                      ) : <span className="text-muted">—</span>}
                      {r.stripe_subscription_id && (
                        <>
                          <span className="text-muted mx-1">·</span>
                          <a
                            href={`https://dashboard.stripe.com/subscriptions/${r.stripe_subscription_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`underline ${r.status === 'active' || r.status === 'past_due' ? 'text-red-400 hover:text-red-300' : 'text-muted'}`}
                            title="Open subscription in Stripe to cancel or refund"
                          >
                            {r.status === 'active' || r.status === 'past_due' ? 'Cancel ✕' : 'Sub'}
                          </a>
                        </>
                      )}
                      {r.crypto_last_invoice_id && (
                        <>
                          <span className="text-muted mx-1">·</span>
                          <span className="text-muted text-[10px]" title={`crypto invoice ${r.crypto_last_invoice_id}`}>
                            inv {r.crypto_last_invoice_id.slice(0, 8)}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-muted">no customers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-muted text-[11px] font-mono mt-6 text-center">
          operator-only · admin emails via ADMIN_EMAILS env · {rows.length} rows ·
          {' '}Stripe MRR ${mrr.toLocaleString()}/mo · {cryptoActive.length} crypto active
        </p>
      </div>
    </main>
  );
}
