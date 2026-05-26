'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type Currency = {
  code: string;
  label: string;
  chain: string;
  token: string;
};

export default function CryptoCheckoutForm({
  tier,
  tierLabel,
  priceUsd,
  currencies,
}: {
  tier: string;
  tierLabel: string;
  priceUsd: number;
  currencies: Currency[];
}) {
  const sp = useSearchParams();
  const sandbox = sp?.get('test') === '1';
  const [email, setEmail] = useState('');
  const [payCurrency, setPayCurrency] = useState(currencies[0]?.code ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, email, pay_currency: payCurrency, mode: sandbox ? 'sandbox' : 'prod' }),
      });
      const j = await res.json();
      if (!res.ok || !j.invoice_url) {
        setError(j.error || `request failed (HTTP ${res.status})`);
        setLoading(false);
        return;
      }
      // Redirect to NOWPayments hosted checkout
      window.location.href = j.invoice_url;
    } catch (err: any) {
      setError(err?.message || 'network error');
      setLoading(false);
    }
  }

  // Group currencies by chain for cleaner select
  const byChain = currencies.reduce<Record<string, Currency[]>>((acc, c) => {
    (acc[c.chain] ||= []).push(c);
    return acc;
  }, {});

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6 space-y-5">
      {sandbox && (
        <div className="-mx-1 -mt-1 mb-1 rounded-md border border-amber-500/40 bg-amber-500/[0.05] px-3 py-2 text-xs sm:text-sm text-amber-300/90">
          <span className="font-mono uppercase tracking-wider text-amber-400">⚠ SANDBOX</span>{' '}
          test mode — no real money, no account provisioned. Pay with{' '}
          <a href="https://account-sandbox.nowpayments.io" className="underline">sandbox testnet coins</a>.
        </div>
      )}
      <div>
        <label htmlFor="email" className="block font-mono text-[11px] uppercase tracking-widest text-muted/80 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input w-full !py-2.5"
          autoComplete="email"
          disabled={loading}
        />
        <p className="text-xs text-muted mt-1.5">
          We&apos;ll email a sign-in code to this address once the payment confirms on-chain.
          Your API key lives on your dashboard, not in email.
        </p>
      </div>

      <div>
        <label htmlFor="currency" className="block font-mono text-[11px] uppercase tracking-widest text-muted/80 mb-2">
          Pay with
        </label>
        <select
          id="currency"
          value={payCurrency}
          onChange={(e) => setPayCurrency(e.target.value)}
          className="input w-full !py-2.5 font-mono"
          disabled={loading}
        >
          {Object.entries(byChain).map(([chain, list]) => (
            <optgroup key={chain} label={chain}>
              {list.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-muted mt-1.5">
          BSC has the lowest fees (~$0.20 per tx) and confirms fastest (~1 min).
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted/80">Total</div>
          <div className="text-2xl font-bold text-ink font-mono">${priceUsd.toLocaleString()}</div>
        </div>
        <button
          type="submit"
          disabled={loading || !email}
          className="btn-primary"
        >
          {loading ? 'Creating invoice…' : 'Continue to payment →'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 font-mono bg-red-400/[0.05] border border-red-400/30 rounded-md p-3">
          {error}
        </p>
      )}
    </form>
  );
}
