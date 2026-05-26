import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { SUPPORTED_PAY_CURRENCIES, TIER_PRICES_USD, CRYPTO_ACCESS_DAYS } from '@/lib/nowpayments';
import CryptoCheckoutForm from './CryptoCheckoutForm';

export const metadata: Metadata = {
  title: 'Pay with crypto | StreamSuite',
  description: 'Pay for your StreamSuite BSC RPC subscription with USDC, USDT, ETH, or BNB on Ethereum, BSC, Base, Arbitrum, or Optimism.',
};

const TIER_LABELS: Record<string, string> = {
  realtime: 'Real-Time',
  mempool:  'Mempool',
  fullnode: 'Full Node',
};

export default function CryptoCheckout({ params }: { params: { tier: string } }) {
  const tier = params.tier.toLowerCase();
  const price = TIER_PRICES_USD[tier];
  const label = TIER_LABELS[tier];
  if (!price || !label) notFound();

  return (
    <main className="min-h-screen px-4 py-12">
      <article className="max-w-2xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">
          ┌── crypto checkout ──┐
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">
          Pay with crypto &middot; <span className="accent-gradient">{label}</span>
        </h1>
        <p className="text-muted text-base mb-6">
          ${price.toLocaleString()}/mo &mdash; one payment, {CRYPTO_ACCESS_DAYS} days of access.
        </p>

        <div className="card p-5 sm:p-6 mb-6 border-amber-500/40 bg-amber-500/[0.04]">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-lg leading-none mt-0.5">⚠</span>
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-ink mb-1">One-time payment, manual renewal.</p>
              <p className="text-muted">
                Crypto payments are processed as one-time charges good for {CRYPTO_ACCESS_DAYS} days.
                We&apos;ll email you a renewal reminder before expiry. For
                automatic monthly billing, use the card option on the{' '}
                <Link href="/pricing" className="text-accent hover:underline">pricing page</Link>.
              </p>
            </div>
          </div>
        </div>

        <CryptoCheckoutForm
          tier={tier}
          tierLabel={label}
          priceUsd={price}
          currencies={SUPPORTED_PAY_CURRENCIES}
        />

        <p className="text-xs text-muted mt-8 leading-relaxed">
          We use <a href="https://nowpayments.io" target="_blank" rel="noreferrer" className="text-accent hover:underline">NOWPayments</a>{' '}
          to process crypto. You&apos;ll be redirected to their secure hosted checkout to send the payment.
          The moment payment confirms on-chain (typically 1&ndash;5 minutes for BSC, 5&ndash;15
          minutes for ETH) we&apos;ll email you a sign-in code. Type it at{' '}
          <Link href="/login" className="text-accent hover:underline">streamsuite.io/login</Link> to
          reach your dashboard &mdash; that&apos;s where your API key, endpoints, and live stats live.
          The API key is never sent over email.
        </p>

        <div className="mt-10 text-sm text-muted">
          <Link href="/pricing" className="text-accent hover:underline">&larr; Back to pricing</Link>
        </div>
      </article>
    </main>
  );
}
