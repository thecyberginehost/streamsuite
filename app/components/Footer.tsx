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

        <nav className="flex flex-wrap items-center gap-6 text-sm">
          <Link href="/" className="text-muted hover:text-ink transition-colors">Home</Link>
          <Link href="/pricing" className="text-muted hover:text-ink transition-colors">Pricing</Link>
          <Link href="/docs" className="text-muted hover:text-ink transition-colors">Docs</Link>
          <Link href="/request-access" className="text-muted hover:text-ink transition-colors">Request Access</Link>
          <a
            href="mailto:hello@streamsuite.io"
            className="text-muted hover:text-ink transition-colors"
          >
            hello@streamsuite.io
          </a>
          <a
            href="https://twitter.com/streamsuite"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-ink transition-colors"
            aria-label="Twitter"
          >
            X / Twitter
          </a>
          <a
            href="https://github.com/streamsuite"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-ink transition-colors"
            aria-label="GitHub"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
