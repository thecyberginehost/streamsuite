import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Not found · StreamSuite',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent/80 mb-3">
          ── 404 ──
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold mb-3">
          That endpoint doesn&apos;t exist.
        </h1>
        <p className="text-muted mb-8 leading-relaxed">
          Either the URL is mistyped, the page was moved, or you&apos;re looking for something
          we never built. Try one of these:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <Link href="/" className="card p-4 hover:border-accent/40 transition-colors">
            <p className="font-mono text-[11px] uppercase tracking-wider text-accent/80 mb-1">Home</p>
            <p className="text-sm text-muted">What we do, who it&apos;s for</p>
          </Link>
          <Link href="/pricing" className="card p-4 hover:border-accent/40 transition-colors">
            <p className="font-mono text-[11px] uppercase tracking-wider text-accent/80 mb-1">Pricing</p>
            <p className="text-sm text-muted">Tiers + sign-up</p>
          </Link>
          <Link href="/docs" className="card p-4 hover:border-accent/40 transition-colors">
            <p className="font-mono text-[11px] uppercase tracking-wider text-accent/80 mb-1">Docs</p>
            <p className="text-sm text-muted">RPC methods + quickstart</p>
          </Link>
          <Link href="/status" className="card p-4 hover:border-accent/40 transition-colors">
            <p className="font-mono text-[11px] uppercase tracking-wider text-accent/80 mb-1">Status</p>
            <p className="text-sm text-muted">Live BSC node health</p>
          </Link>
        </div>

        <p className="text-muted text-xs font-mono mt-10">
          Customer dashboard at{' '}
          <Link href="/dashboard" className="text-accent hover:underline">
            /dashboard
          </Link>{' '}
          · Sign in at{' '}
          <Link href="/login" className="text-accent hover:underline">
            /login
          </Link>
        </p>
      </div>
    </main>
  );
}
