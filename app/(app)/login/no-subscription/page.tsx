import Link from 'next/link';

export default function NoSubscriptionPage() {
  return (
    <main className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">
            ┌── no subscription ──┐
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Not so fast</h1>
          <p className="text-muted text-sm">
            Your GitHub account isn&apos;t linked to a StreamSuite subscription yet.
          </p>
        </div>

        <div className="card p-6 space-y-5">
          <div className="space-y-2">
            <p className="text-sm">If you already paid for a plan:</p>
            <p className="text-muted text-xs">
              Your Stripe email might be different from your primary GitHub email. Sign in
              with the email on your Stripe receipt and you&apos;ll be in. After your first
              sign-in we&apos;ll link your GitHub for next time.
            </p>
            <Link
              href="/login"
              className="btn-primary w-full !py-3 !bg-transparent !text-ink !border !border-white/15 hover:!bg-white/5 inline-flex items-center justify-center"
            >
              Sign in with email →
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-muted text-xs font-mono uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <div className="space-y-2">
            <p className="text-sm">New here?</p>
            <p className="text-muted text-xs">
              Pick a plan — sub-50ms BSC RPC, live mempool, full archive. Pay with card,
              key is provisioned in seconds.
            </p>
            <Link
              href="/pricing"
              className="btn-primary w-full !py-3 inline-flex items-center justify-center"
            >
              View plans →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
