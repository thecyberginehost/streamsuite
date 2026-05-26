'use client';

import { useEffect, useState, useRef } from 'react';

type TOCItem = { href: string; label: string };

export default function DocsTOC({ items }: { items: TOCItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.href.slice(1) ?? '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // ── Scroll-spy: track which section is "current" based on viewport ──
  useEffect(() => {
    const ids = items.map((i) => i.href.slice(1));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // rootMargin pushes the "trigger line" to ~25% from the top of the viewport,
    // so a section becomes 'active' as its heading approaches the upper third.
    const observer = new IntersectionObserver(
      (entries) => {
        // Among intersecting entries, pick the one closest to the trigger line (top).
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  // ── Close mobile sheet on Escape ──
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // ── Lock body scroll when mobile sheet is open ──
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileOpen]);

  const activeLabel = items.find((i) => i.href === `#${activeId}`)?.label ?? items[0]?.label ?? '';

  function linkClass(active: boolean): string {
    return [
      'block py-1.5 text-sm transition-colors border-l-2 pl-3 -ml-px',
      active
        ? 'text-ink border-accent font-medium'
        : 'text-muted border-transparent hover:text-ink hover:border-accent/60',
    ].join(' ');
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR (sticky, scroll-spy active highlight) ─────── */}
      <aside className="hidden md:block w-48 lg:w-56 shrink-0">
        <div className="sticky top-20">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted/80 mb-3 pl-3">
            On this page
          </div>
          <nav className="flex flex-col gap-0.5 border-l border-border">
            {items.map((item) => {
              const isActive = item.href === `#${activeId}`;
              return (
                <a key={item.href} href={item.href} className={linkClass(isActive)}>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ── MOBILE: floating "Contents" button (always visible) ──────── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent text-bg font-mono text-xs uppercase tracking-wider font-semibold shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-shadow"
        aria-label="Open table of contents"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="13" y2="18" />
        </svg>
        Contents
      </button>

      {/* ── MOBILE: slide-up sheet with TOC ──────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop — tap to close */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sheet */}
          <div
            ref={sheetRef}
            className="relative w-full max-h-[80vh] bg-bg border-t border-border rounded-t-xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-panel/40">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted/80">
                  On this page
                </div>
                <div className="text-sm text-ink mt-0.5">
                  <span className="text-accent mr-1.5">●</span>
                  {activeLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-md border border-border text-muted hover:text-ink hover:bg-panel-2"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="18" y1="6"  x2="6"  y2="18" />
                  <line x1="6"  y1="6"  x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0.5 border-l-0">
              {items.map((item) => {
                const isActive = item.href === `#${activeId}`;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={linkClass(isActive)}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
