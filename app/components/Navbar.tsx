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
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <span className="w-7 h-7 rounded-md border border-accent/40 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent shadow-glow group-hover:bg-accent-bright transition-colors" />
          </span>
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
