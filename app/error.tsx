'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to pm2 stderr; ops can grep for this in pm2 logs.
    console.error('app-error-boundary:', error);
  }, [error]);

  return (
    <main className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-red-400/80 mb-3">
          ── 500 · server error ──
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3">Something broke on our side.</h1>
        <p className="text-muted mb-2 leading-relaxed">
          The operator has been notified. If you were in the middle of a sign-in, payment, or
          key-rotation flow, check your inbox or refresh the page — we don&apos;t double-charge.
        </p>
        {error.digest && (
          <p className="font-mono text-[11px] text-muted mb-8">
            Reference: <span className="text-ink">{error.digest}</span>
          </p>
        )}

        <div className="flex gap-3 flex-wrap justify-center mt-6">
          <button onClick={reset} className="btn-primary !py-3 !px-6">
            Try again
          </button>
          <Link href="/" className="btn-ghost !py-3 !px-6">
            Back to home
          </Link>
        </div>

        <p className="text-muted text-xs font-mono mt-10">
          Status:{' '}
          <Link href="/status" className="text-accent hover:underline">
            /status
          </Link>{' '}
          · Support:{' '}
          <a href="mailto:support@streamsuite.io" className="text-accent hover:underline">
            support@streamsuite.io
          </a>
        </p>
      </div>
    </main>
  );
}
