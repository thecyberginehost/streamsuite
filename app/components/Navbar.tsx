'use client';

import Link from 'next/link';
import { useState } from 'react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/bench', label: 'Test latency' },
  { href: '/benchmarks', label: 'Benchmarks' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          {/* StreamSuite mark — 3 stream lines + cursor dots inside a
              terminal-window frame. currentColor so it tints with the
              link colour; mark + wordmark brighten together on hover. */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 256 256"
            fill="none"
            stroke="currentColor"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent group-hover:text-accent-bright transition-colors shrink-0"
            aria-hidden
          >
            <path d="M 62 52 L 36 52 L 36 204 L 62 204" />
            <path d="M 194 52 L 220 52 L 220 204 L 194 204" />
            <circle cx="86" cy="100" r="12" fill="currentColor" stroke="none" />
            <circle cx="86" cy="156" r="12" fill="currentColor" stroke="none" />
            <line x1="120" y1="184" x2="148" y2="72" />
            <line x1="156" y1="184" x2="184" y2="72" />
          </svg>
          <span className="font-semibold tracking-tight text-ink">StreamSuite</span>
          <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider text-accent/70 border border-accent/20 rounded px-1.5 py-0.5 ml-1">
            Dedicated
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted hover:text-ink transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="text-sm text-muted hover:text-ink transition-colors">
            Sign in
          </Link>
          <Link href="/pricing" className="btn-primary text-sm !py-2 !px-4">
            Get started
          </Link>
        </nav>

        <button
          className="md:hidden w-10 h-10 flex items-center justify-center text-muted hover:text-ink"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border bg-bg/95 backdrop-blur-md">
          <div className="px-6 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm text-ink"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="py-2 text-sm text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="btn-primary text-sm mt-2"
            >
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
