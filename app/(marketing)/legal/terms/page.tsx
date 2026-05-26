export const metadata = {
  title: 'Terms of Service — StreamSuite',
  description: 'StreamSuite Terms of Service. Plain-English terms governing use of our BSC RPC service.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="max-w-3xl mx-auto prose-streamsuite">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">┌── legal ──┐</p>
        <h1 className="text-3xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-muted text-sm mb-8">Effective 2026-05-16 · plain-English version, not a substitute for legal advice on your end.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">1. What you&apos;re paying for</h2>
        <p className="text-sm leading-relaxed mb-3">StreamSuite provides authenticated access to BSC (BNB Smart Chain) JSON-RPC endpoints over HTTPS and WebSockets. The exact methods available depend on the tier you&apos;ve subscribed to. We do not custody assets, hold private keys, or execute transactions on your behalf — you provide signed transactions, we relay them to the network like any RPC.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">2. Acceptable use</h2>
        <p className="text-sm leading-relaxed mb-2">You won&apos;t use StreamSuite to:</p>
        <ul className="list-disc ml-6 text-sm space-y-1 mb-3">
          <li>Attack other users of the BSC network or third parties (DoS, oracle manipulation, etc.)</li>
          <li>Violate applicable laws (sanctions, money laundering, fraud)</li>
          <li>Resell or sublicense access to your API key</li>
          <li>Attempt to compromise our infrastructure</li>
        </ul>
        <p className="text-sm leading-relaxed mb-3">We may suspend service immediately if we observe abuse. We&apos;ll explain why and refund any unused portion of the current billing period if the suspension was our call, not yours.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">3. Your API key</h2>
        <p className="text-sm leading-relaxed mb-3">Your API key is yours to protect. We don&apos;t enforce IP allowlists by default — if your key leaks publicly, anyone who finds it can call our RPC against your quota. You can rotate the key anytime from your dashboard.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">4. Service availability</h2>
        <p className="text-sm leading-relaxed mb-3">We target high availability but make no contractual uptime guarantee at this time. Our infrastructure runs on a single colocation site in Ashburn, VA. Maintenance windows and unexpected outages happen. We&apos;ll publish status updates and notify you of incidents materially affecting your tier.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">5. Billing</h2>
        <p className="text-sm leading-relaxed mb-3">Subscriptions bill monthly in advance via Stripe. You can cancel anytime from the &quot;Manage billing&quot; link in your dashboard — cancellation is effective at the end of your current period. Failed payments enter a short grace window during which we&apos;ll retry the charge and email you to update your card. See our <a href="/legal/refunds" className="text-accent hover:underline">Refund Policy</a> for partial-period and exceptional refunds.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">6. Data</h2>
        <p className="text-sm leading-relaxed mb-3">We log RPC requests (method, timestamp, latency) for operational analytics and abuse prevention. We do not store the bodies of your requests beyond what nginx access logs capture. We never sell your data. See our <a href="/legal/privacy" className="text-accent hover:underline">Privacy Policy</a> for the full list of what we collect.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">7. Liability</h2>
        <p className="text-sm leading-relaxed mb-3">StreamSuite is provided &quot;as is.&quot; Our maximum liability for any claim arising from the service is the amount you paid us in the 3 months before the claim arose. We&apos;re not liable for indirect losses (lost trading profits, MEV opportunities missed during downtime, etc.). If you depend on us for revenue, build redundancy.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">8. Changes to these terms</h2>
        <p className="text-sm leading-relaxed mb-3">If we materially change these terms, we&apos;ll email all active subscribers at least 14 days before the change takes effect. Continuing to use the service after that counts as acceptance. If you don&apos;t accept, cancel — we&apos;ll prorate a refund per the Refund Policy.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">9. Contact</h2>
        <p className="text-sm leading-relaxed mb-3">Questions, disputes, or notices: <a href="mailto:support@streamsuite.io" className="text-accent hover:underline">support@streamsuite.io</a>.</p>

        <p className="text-muted text-xs font-mono mt-12 pt-6 border-t border-border">v1.0 · last updated 2026-05-16</p>
      </article>
    </main>
  );
}
