export const metadata = {
  title: 'Refund Policy — StreamSuite',
  description: 'When we refund, when we don\'t. Plain English.',
};

export default function RefundsPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="max-w-3xl mx-auto prose-streamsuite">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">┌── legal ──┐</p>
        <h1 className="text-3xl font-semibold mb-2">Refund Policy</h1>
        <p className="text-muted text-sm mb-8">Effective 2026-05-16 · when we refund, when we don&apos;t.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">Standard rule</h2>
        <p className="text-sm leading-relaxed mb-3">StreamSuite subscriptions bill monthly in advance. We do <strong>not</strong> issue prorated refunds for partial-period cancellations. If you cancel mid-month, your service continues until the end of the current period — you keep what you paid for.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">When we&apos;ll refund anyway</h2>
        <ul className="list-disc ml-6 text-sm space-y-2 mb-3">
          <li><strong>First 48 hours.</strong> If you signed up within the last 48 hours and decide it&apos;s not for you, email us — we&apos;ll refund 100% of the most recent invoice, no questions.</li>
          <li><strong>Service-side outage exceeding 4 consecutive hours</strong> within a billing period: we&apos;ll credit you 1 day of service per hour of confirmed downtime, automatically applied to your next invoice or refundable on request.</li>
          <li><strong>Billing error on our side</strong> (double-charge, wrong tier, etc.): full refund, immediate.</li>
          <li><strong>We suspend your account by mistake</strong>: prorated refund for the remaining period plus a service credit.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">When we won&apos;t refund</h2>
        <ul className="list-disc ml-6 text-sm space-y-2 mb-3">
          <li>Mid-period cancellation outside the 48-hour window (you used the service)</li>
          <li>Failure to use the service after subscribing (use it or pause it, but the time is yours)</li>
          <li>Account suspension due to confirmed violation of our <a href="/legal/terms" className="text-accent hover:underline">Terms of Service</a></li>
          <li>Chargebacks initiated without contacting us first — we&apos;ll dispute these and may not service the account again</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">How to request</h2>
        <p className="text-sm leading-relaxed mb-3">Email <a href="mailto:support@streamsuite.io" className="text-accent hover:underline">support@streamsuite.io</a> from the address on your account with your operator ID. We aim to respond within 1 business day; refunds typically post within 5-10 business days via Stripe.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">Chargebacks</h2>
        <p className="text-sm leading-relaxed mb-3">If you don&apos;t recognize a charge or believe it&apos;s in error, please contact us first — chargebacks cost both of us significantly more than a refund, and we&apos;ll resolve any legitimate issue without one. Repeated chargebacks may result in service refusal.</p>

        <p className="text-muted text-xs font-mono mt-12 pt-6 border-t border-border">v1.0 · last updated 2026-05-16</p>
      </article>
    </main>
  );
}
