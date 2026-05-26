import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-6 h-6 rounded-sm border border-accent/40 flex items-center justify-center">
            <span className="w-2 h-2 rounded-sm bg-accent group-hover:bg-accent-bright transition-colors" />
          </span>
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
