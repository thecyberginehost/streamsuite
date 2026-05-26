'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Plan =
  | 'bsc-realtime'
  | 'bsc-mempool'
  | 'bsc-fullnode'
  | 'custom-chain'
  | 'custom-research'
  | 'colocated-bot'
  | 'other';

const planLabels: Record<Plan, string> = {
  'bsc-realtime': 'BSC Real-Time',
  'bsc-mempool': 'BSC Mempool',
  'bsc-fullnode': 'BSC Full Node',
  'custom-chain': 'Custom Chain Node',
  'custom-research': 'Custom Research / Analytics',
  'colocated-bot': 'Custom Bot + Colocation',
  other: 'Other',
};

const planFromQuery = (q: string | null): Plan => {
  if (!q) return 'bsc-realtime';
  const k = q as Plan;
  return planLabels[k] ? k : 'bsc-realtime';
};

export default function RequestForm() {
  const params = useSearchParams();
  const [plan, setPlan] = useState<Plan>(planFromQuery(params.get('plan')));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [chain, setChain] = useState('');
  const [strategy, setStrategy] = useState('');
  const [volume, setVolume] = useState('Not sure');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlan(planFromQuery(params.get('plan')));
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, handle, plan,
          chain: plan === 'custom-chain' ? chain : '',
          strategy: plan === 'colocated-bot' ? strategy : '',
          volume, notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed');
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please email hello@streamsuite.io instead.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-ink mb-3">Request received.</h2>
        <p className="text-muted max-w-md mx-auto leading-relaxed">
          We&apos;ll review your request and get back to you within 24 hours at{' '}
          <span className="text-ink font-mono">{email || 'the address you provided'}</span>.
          If you need to reach us sooner, email{' '}
          <a href="mailto:hello@streamsuite.io" className="text-accent hover:text-accent-bright">
            hello@streamsuite.io
          </a>
          .
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-ghost">Back home</Link>
          <Link href="/docs" className="btn-primary">Read the docs</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8 flex flex-col gap-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input
            id="name"
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="handle">Telegram or Discord handle</label>
        <input
          id="handle"
          className="input"
          required
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@yourhandle"
        />
      </div>

      <div>
        <label className="label" htmlFor="plan">Interested in</label>
        <select
          id="plan"
          className="input"
          value={plan}
          onChange={(e) => setPlan(e.target.value as Plan)}
        >
          {(Object.keys(planLabels) as Plan[]).map((k) => (
            <option key={k} value={k}>{planLabels[k]}</option>
          ))}
        </select>
      </div>

      {plan === 'custom-chain' && (
        <div>
          <label className="label" htmlFor="chain">Which chain?</label>
          <input
            id="chain"
            className="input"
            required
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            placeholder="e.g. Solana, Base, Arbitrum, Polygon..."
          />
        </div>
      )}

      {plan === 'colocated-bot' && (
        <div>
          <label className="label" htmlFor="strategy">Briefly, what&apos;s the strategy / use case?</label>
          <textarea
            id="strategy"
            className="input min-h-[100px] resize-y"
            required
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder="e.g. cross-DEX arbitrage on Base, liquidation sniper on Aave, MEV bundle builder..."
          />
        </div>
      )}

      <div>
        <label className="label" htmlFor="volume">Expected monthly volume</label>
        <select
          id="volume"
          className="input"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
        >
          <option>Light</option>
          <option>Moderate</option>
          <option>Heavy</option>
          <option>Not sure</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="notes">Additional notes (optional)</label>
        <textarea
          id="notes"
          className="input min-h-[100px] resize-y"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything we should know? Preferred start date, specific SLA needs, etc."
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto sm:self-start"
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit request'}
      </button>

      <p className="text-xs text-muted">
        We&apos;ll email you within 24 hours. No marketing emails, no mailing list.
      </p>
    </form>
  );
}
