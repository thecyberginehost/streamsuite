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
