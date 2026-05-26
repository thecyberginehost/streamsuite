import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <svg
            width="20"
            height="20"
            viewBox="0 0 256 256"
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent group-hover:text-accent-bright transition-colors shrink-0"
            aria-hidden
          >
            <rect x="28" y="36" width="200" height="184" rx="22" ry="22" />
            <line x1="28" y1="72" x2="228" y2="72" />
            <line x1="56" y1="112" x2="172" y2="112" />
            <line x1="56" y1="148" x2="148" y2="148" />
            <line x1="56" y1="184" x2="124" y2="184" />
            <circle cx="190" cy="112" r="11" fill="currentColor" stroke="none" />
            <circle cx="166" cy="148" r="11" fill="currentColor" stroke="none" />
            <circle cx="142" cy="184" r="11" fill="currentColor" stroke="none" />
          </svg>
          <span className="font-mono text-sm tracking-tight text-ink uppercase">StreamSuite</span>
        </Link>
        <Link
          href="/api/auth/logout"
          className="font-mono text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors"
        >
          Sign out
        </Link>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
