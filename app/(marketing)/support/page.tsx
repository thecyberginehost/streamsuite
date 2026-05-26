export const metadata = {
  title: 'Support — StreamSuite',
  description: 'How to reach StreamSuite support. Response times, escalation paths.',
};

const RESPONSE_TARGETS = [
  { tier: 'BSC Real-Time', target: 'Next business day', priority: 'normal' },
  { tier: 'BSC Mempool', target: 'Within 4 business hours', priority: 'high' },
  { tier: 'BSC Full Node', target: 'Within 4 hours, 7 days a week', priority: 'urgent' },
  { tier: 'Outage / production-down (any tier)', target: 'Within 1 hour, 24/7', priority: 'sev-1' },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <article className="max-w-3xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">┌── support ──┐</p>
        <h1 className="text-3xl font-semibold mb-2">Support</h1>
        <p className="text-muted text-base mb-8">One person reads this inbox. Same person who runs the infrastructure. No tier-1 outsourcing, no AI replies, no ticket runaround.</p>

        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Email</h2>
          <p className="mb-4">
            <a href="mailto:support@streamsuite.io" className="text-accent hover:underline font-mono text-lg">support@streamsuite.io</a>
          </p>
          <p className="text-sm text-muted leading-relaxed">
            For fastest triage, include your <strong>operator ID</strong> (4 chars, visible at the top of your dashboard) and the timestamp of the issue.
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-3">Response targets</h2>
        <div className="card overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-bg/40">
              <tr className="text-left text-muted text-[11px] uppercase tracking-wider font-mono">
                <th className="p-3">Severity</th>
                <th className="p-3">Target first response</th>
              </tr>
            </thead>
            <tbody>
              {RESPONSE_TARGETS.map(r => (
                <tr key={r.tier} className="border-b border-border/40 last:border-0">
                  <td className="p-3">{r.tier}</td>
                  <td className="p-3 font-mono text-xs text-accent">{r.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mb-8">These are first-response targets, not resolution. For a sev-1, you&apos;ll be on a thread with a human within an hour.</p>

        <h2 className="text-xl font-semibold mb-3">Before you email</h2>
        <ul className="list-disc ml-6 text-sm space-y-2 mb-8">
          <li>Check the <a href="/status" className="text-accent hover:underline">status page</a> — if BSC node is lagging, we already know.</li>
          <li>Try rotating your key from the dashboard. Most &quot;my bot stopped working&quot; cases are a leaked or expired key.</li>
          <li>Check the <a href="/docs" className="text-accent hover:underline">docs</a> for tier-specific method allowlists. &quot;debug_traceTransaction returns method not allowed&quot; means you&apos;re on a tier that doesn&apos;t include it.</li>
        </ul>

        <h2 className="text-xl font-semibold mb-3">Production-down escalation</h2>
        <div className="card p-5 border-amber-500/30 mb-8">
          <p className="text-sm leading-relaxed mb-3">
            If your bot is offline due to our infrastructure and the response target above feels too slow, email <a href="mailto:support@streamsuite.io" className="text-accent hover:underline">support@streamsuite.io</a> with <strong>[SEV-1]</strong> in the subject line.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Sev-1 emails page the operator directly. Don&apos;t use this for &quot;my key isn&apos;t working&quot; — that&apos;s normal support.
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-3">Other channels</h2>
        <ul className="list-disc ml-6 text-sm space-y-1 mb-8">
          <li>Billing or refund questions: <a href="mailto:support@streamsuite.io" className="text-accent hover:underline">support@streamsuite.io</a> (see <a href="/legal/refunds" className="text-accent hover:underline">refund policy</a>)</li>
          <li>Security issue or vulnerability disclosure: <a href="mailto:support@streamsuite.io" className="text-accent hover:underline">support@streamsuite.io</a> — please put <strong>[SECURITY]</strong> in the subject</li>
          <li>Custom deployment / colocation quote: <a href="/request-access" className="text-accent hover:underline">/request-access</a></li>
        </ul>

        <p className="text-muted text-xs font-mono pt-6 border-t border-border">
          One operator. One inbox. Real response.
        </p>
      </article>
    </main>
  );
}
