'use client';

import { useRef, useState } from 'react';

export type CodeTab = {
  id: string;       // stable id for keyboard nav + persistence
  label: string;    // visible tab label, e.g. "TypeScript · viem"
  hint?: string;    // small right-aligned hint, e.g. "node / edge / browser"
  code: string;     // the snippet itself
};

// Tabbed multi-language code-sample switcher. Collapses 4–5 stacked code
// blocks into one panel, reducing vertical scroll especially on mobile.
//
// Implementation notes:
// - The selected tab's snippet renders into a single <pre>; the others
//   live only in state. (Mounting all snippets and toggling visibility was
//   tried and visibly bloats the DOM for the longer Rust/web3.py examples.)
// - Copy button reads from the visible <pre> directly, so what you see is
//   what you copy.
// - Tab labels overflow-x-auto on mobile so the row can scroll horizontally
//   when there are 4+ languages.
export function CodeTabs({
  tabs,
  defaultTab,
  className = '',
}: {
  tabs: CodeTab[];
  defaultTab?: string;
  className?: string;
}) {
  const initial = tabs.find((t) => t.id === defaultTab)?.id ?? tabs[0]?.id ?? '';
  const [active, setActive] = useState(initial);
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const cur = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!cur) return null;

  async function copy() {
    const text = preRef.current?.innerText ?? cur.code;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="border-b border-border bg-panel-2 flex items-center justify-between gap-3 pr-3">
        <div role="tablist" className="flex items-stretch overflow-x-auto -mx-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === active}
              onClick={() => setActive(t.id)}
              className={`px-4 py-3 font-mono text-[11px] uppercase tracking-wider whitespace-nowrap border-r border-border transition-colors ${
                t.id === active
                  ? 'bg-bg text-accent-bright'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {cur.hint && (
            <span className="font-mono text-[10px] text-muted hidden sm:inline">{cur.hint}</span>
          )}
          <button
            type="button"
            onClick={copy}
            className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm border border-border text-muted hover:text-ink hover:border-border-strong transition-colors"
            aria-label={copied ? 'Copied' : 'Copy code'}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <pre ref={preRef} className="code-block !rounded-none !border-0">
        <code>{cur.code}</code>
      </pre>
    </div>
  );
}
