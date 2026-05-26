'use client';

import { useRef, useState } from 'react';

// Reusable code-block wrapper that adds a hover-revealed "Copy" button. The
// raw text to copy is auto-extracted from the rendered children via the inner
// <pre> reference — so any string we render visually is what gets copied,
// including the no-key placeholder (we never substitute the real key here).
//
// Usage:
//   <CodeBlock label="curl">{curlExample}</CodeBlock>
//   <CodeBlock label="TypeScript · viem" hint="node / edge / browser" framed>
//     {viemExample}
//   </CodeBlock>
//
// framed=true wraps the block in the panel-header style used in the existing
// /docs page (label row + bordered card). Leave it off for naked snippets.
export function CodeBlock({
  children,
  className = '',
  label,
  hint,
  framed = false,
}: {
  children: string | React.ReactNode;
  className?: string;
  label?: string;
  hint?: string;
  framed?: boolean;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = preRef.current?.innerText ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail in non-HTTPS or restricted contexts —
      // silently no-op rather than crashing the page.
    }
  }

  // Button positioned over the top-right of the code block. On the framed
  // variant it lives in the header row instead.
  const copyBtn = (
    <button
      type="button"
      onClick={copy}
      className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm border border-border text-muted hover:text-ink hover:border-border-strong transition-colors"
      aria-label={copied ? 'Copied' : 'Copy code'}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );

  if (framed) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-panel-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {label && <span className="font-mono text-xs uppercase tracking-wider text-ink truncate">{label}</span>}
            {hint && <span className="font-mono text-[10px] text-muted truncate hidden sm:inline">{hint}</span>}
          </div>
          {copyBtn}
        </div>
        <pre ref={preRef} className={`code-block !rounded-none !border-0 ${className}`}>
          {typeof children === 'string' ? <code>{children}</code> : children}
        </pre>
      </div>
    );
  }

  return (
    <div className="relative group">
      <pre ref={preRef} className={`code-block ${className}`}>
        {typeof children === 'string' ? <code>{children}</code> : children}
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {copyBtn}
      </div>
    </div>
  );
}
