export const metadata = {
  title: 'Privacy Policy — StreamSuite',
  description: 'StreamSuite Privacy Policy. What we collect, why, and what we never do.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="max-w-3xl mx-auto prose-streamsuite">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">┌── legal ──┐</p>
        <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-muted text-sm mb-8">Effective 2026-05-16 · what we collect, why, and what we never do.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">What we collect</h2>
        <p className="text-sm leading-relaxed mb-2"><strong>Account data:</strong> email address (from Stripe checkout or GitHub OAuth), name (if provided at checkout), GitHub user ID and login (if you sign in with GitHub), API key, operator ID.</p>
        <p className="text-sm leading-relaxed mb-2"><strong>Billing data:</strong> Stripe customer ID, subscription ID, and the tier you&apos;re subscribed to. Stripe handles your card directly — we never see or store card numbers.</p>
        <p className="text-sm leading-relaxed mb-2"><strong>Usage data:</strong> nginx access logs capture timestamp, IP, RPC method name, response code, response time, and bytes for every authenticated request. We use this for service analytics on your dashboard, billing accuracy, and abuse prevention. Logs are retained for 30 days by default.</p>
        <p className="text-sm leading-relaxed mb-3"><strong>Session data:</strong> when you sign in, we set an httpOnly cookie containing a random opaque session token. The token maps to your email in our database. Cookie expires after 30 days of inactivity.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">What we never collect</h2>
        <ul className="list-disc ml-6 text-sm space-y-1 mb-3">
          <li>Card numbers (Stripe handles those)</li>
          <li>Private keys, wallet seeds, or signed transaction contents beyond what your RPC calls relay through us</li>
          <li>Personally identifiable information beyond what&apos;s listed above</li>
          <li>Cookies from third parties — no Google Analytics, no Facebook pixels, no advertising trackers</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">Why we collect it</h2>
        <ul className="list-disc ml-6 text-sm space-y-1 mb-3">
          <li>To deliver the service you paid for (auth, billing, RPC routing)</li>
          <li>To show you analytics on your own usage</li>
          <li>To detect and respond to abuse (key sharing, attacks)</li>
          <li>To send you operational emails (welcome, payment failed, security notices)</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">Who we share it with</h2>
        <p className="text-sm leading-relaxed mb-2">A short list, by necessity only:</p>
        <ul className="list-disc ml-6 text-sm space-y-1 mb-3">
          <li><strong>Stripe</strong> — billing. We send your email and a tier identifier. Stripe&apos;s own privacy policy applies to what they collect.</li>
          <li><strong>Resend</strong> — transactional email. We send your email address and message bodies (welcome, payment failed, etc.).</li>
          <li><strong>GitHub</strong> — only if you sign in with GitHub. Standard OAuth scopes (`read:user`, `user:email`) get your basic profile and verified emails.</li>
          <li><strong>Hostinger and our colocation provider</strong> — infrastructure hosting. They don&apos;t see your data above the disk-encryption layer.</li>
        </ul>
        <p className="text-sm leading-relaxed mb-3">We do not sell data. We do not give it to advertisers. We respond to lawful legal requests but will notify you unless prohibited.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">How long we keep it</h2>
        <ul className="list-disc ml-6 text-sm space-y-1 mb-3">
          <li>Account + billing data: as long as your subscription is active, plus 7 years after cancellation for tax/compliance reasons</li>
          <li>nginx access logs: 30 days rolling</li>
          <li>Session cookies: 30 days from last use</li>
          <li>Magic-link tokens: 15 minutes (login) or 7 days (welcome email), then deleted</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">Your rights</h2>
        <p className="text-sm leading-relaxed mb-2">You can:</p>
        <ul className="list-disc ml-6 text-sm space-y-1 mb-3">
          <li>See your data — most of it is visible on your dashboard. For the rest, email us.</li>
          <li>Export your data — email us, we&apos;ll send a JSON dump within 14 days.</li>
          <li>Delete your account — cancel via Stripe, then email us to delete the remaining row. We&apos;ll keep billing records for tax purposes (see above).</li>
          <li>Rotate your API key — one click in the dashboard.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">EU / UK users</h2>
        <p className="text-sm leading-relaxed mb-3">GDPR/UK-GDPR applies. We process your data under the &quot;contract&quot; lawful basis (delivering the service you paid for). For a DPA, email us.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">Security</h2>
        <p className="text-sm leading-relaxed mb-3">We use HTTPS everywhere, store passwords nowhere (passwordless auth only), and isolate the customer database to a single host with regular off-host backups. If we have a breach affecting your data, we&apos;ll notify you within 72 hours of confirmation.</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
        <p className="text-sm leading-relaxed mb-3">Privacy questions, data requests, breach reports: <a href="mailto:support@streamsuite.io" className="text-accent hover:underline">support@streamsuite.io</a>.</p>

        <p className="text-muted text-xs font-mono mt-12 pt-6 border-t border-border">v1.0 · last updated 2026-05-16</p>
      </article>
    </main>
  );
}
