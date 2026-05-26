import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TIER_PRICES_USD } from '@/lib/nowpayments';

// Crypto checkout is in final testing — NOWPayments dashboard provisioning
// (API key + IPN secret + payout wallets) needs end-to-end verification
// before we expose a real-money payment flow. Until then this page serves
// as a waitlist landing: preserves the inbound /checkout/crypto/[tier] URL,
// captures interest so we have a list to email when we flip the switch.
//
// To re-enable: revert this file to the prior version that renders
// <CryptoCheckoutForm/>, and re-enable POST /api/checkout/crypto.

export const metadata: Metadata = {
  title: 'Crypto payment · coming soon | StreamSuite',
  description:
    'Crypto payment for StreamSuite BSC RPC subscriptions is in final testing. Join the waitlist to be notified when it goes live (target: 2 weeks).',
};

const TIER_LABELS: Record<string, string> = {
  realtime: 'Real-Time',
  mempool:  'Mempool',
  fullnode: 'Full Node',
};

export default function CryptoCheckoutComingSoon({ params }: { params: { tier: string } }) {
  const tier = params.tier.toLowerCase();
  const price = TIER_PRICES_USD[tier];
  const label = TIER_LABELS[tier];
  if (!price || !label) notFound();

  // mailto-based waitlist — no DB writes, no spam, no new endpoint. The
  // tier the customer was looking at goes into the subject so we know which
  // price point they're shopping when we follow up.
  const subject = `Crypto waitlist — ${label} ($${price.toLocaleString()}/mo)`;
  const body = `Hi — I'd like to be notified when crypto payment goes live on StreamSuite. I'm interested in the ${label} tier.`;
  const mailto = `mailto:support@streamsuite.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <main className="min-h-screen px-4 py-12">
      <article className="max-w-2xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">
          ┌── crypto · in development ──┐
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">
          Crypto payment <span className="accent-gradient">coming soon</span>
        </h1>
        <p className="text-muted text-base mb-6">
          {label} tier &middot; ${price.toLocaleString()}/mo &mdash; crypto checkout in final testing.
        </p>

        <div className="card p-5 sm:p-6 mb-6 border-amber-500/40 bg-amber-500/[0.04]">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-lg leading-none mt-0.5">⚠</span>
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-ink mb-1">Card billing is live today. Crypto is days away.</p>
              <p className="text-muted">
                The crypto payment integration (USDC, USDT, ETH, BNB across
                Ethereum, BSC, Base, Arbitrum, Optimism) is built and the backend
                is plumbed end-to-end. We&apos;re holding the final cutover
                until we&apos;ve verified the production NOWPayments configuration
                so nobody loses funds to a misrouted invoice. Target: next 2 weeks.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Join the crypto waitlist</h2>
          <p className="text-sm text-muted mb-5">
            One-line email to support &mdash; we&apos;ll send you a sign-up link the
            moment crypto checkout goes live. No newsletter, no marketing
            sequence, just the one notification.
          </p>
          <a href={mailto} className="btn-primary inline-flex">
            Email support to join waitlist →
          </a>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-2">Want to start today?</h2>
          <p className="text-sm text-muted mb-4">
            Card subscription via Stripe goes live the moment payment clears
            (typically &lt;30 seconds). Cancel anytime. Same hardware, same
            tier features &mdash; the only difference is the billing rail.
          </p>
          <Link href="/pricing" className="btn-ghost inline-flex">
            ← Back to pricing (card billing)
          </Link>
        </div>
      </article>
    </main>
  );
}
