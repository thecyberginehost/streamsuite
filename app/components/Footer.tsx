import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-md border border-accent/40 flex items-center justify-center">
            <span className="w-2 h-2 rounded-sm bg-accent" />
          </span>
          <span className="text-sm text-muted">
            &copy; 2026 StreamSuite &middot; Bare-metal blockchain infrastructure
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/" className="text-muted hover:text-ink transition-colors">Home</Link>
          <Link href="/pricing" className="text-muted hover:text-ink transition-colors">Pricing</Link>
          <Link href="/docs" className="text-muted hover:text-ink transition-colors">Docs</Link>
          <Link href="/benchmarks" className="text-muted hover:text-ink transition-colors">Benchmarks</Link>
          <Link href="/status" className="text-muted hover:text-ink transition-colors">Status</Link>
          <Link href="/login" className="text-muted hover:text-ink transition-colors">Sign in</Link>
          <Link href="/request-access" className="text-muted hover:text-ink transition-colors">Custom builds</Link>
          <Link href="/support" className="text-muted hover:text-ink transition-colors">Support</Link>
          <Link href="/legal/terms" className="text-muted hover:text-ink transition-colors">Terms</Link>
          <Link href="/legal/privacy" className="text-muted hover:text-ink transition-colors">Privacy</Link>
          <Link href="/legal/refunds" className="text-muted hover:text-ink transition-colors">Refunds</Link>
          <a
            href="mailto:support@streamsuite.io"
            className="text-muted hover:text-ink transition-colors"
          >
            support@streamsuite.io
          </a>
        </nav>
      </div>
    </footer>
  );
}
