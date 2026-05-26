'use client';

import { useState } from 'react';

export function KeyDisplay({ apiKey: initialKey }: { apiKey: string }) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function rotate() {
    setRotating(true);
    setError(null);
    try {
      const res = await fetch('/api/keys/rotate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Rotation failed');
        return;
      }
      setApiKey(data.api_key);
      setShown(true);
      setRotated(true);
      setConfirming(false);
      setTimeout(() => setRotated(false), 8000);
    } catch (err) {
      setError('Network error');
    } finally {
      setRotating(false);
    }
  }

  const masked = '●●●●●●●●●●●●●●●●●●●●●●●●●●●●';

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="font-mono text-xs sm:text-sm break-all bg-bg border border-border rounded-md p-3 pr-20 select-all min-h-[44px] flex items-center">
          {shown ? apiKey : masked}
        </div>
        <button
          onClick={() => setShown(!shown)}
          className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-wider text-accent hover:text-accent-bright px-2 py-1"
          aria-label={shown ? 'Hide' : 'Show'}
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>

      {rotated && (
        <div className="border border-accent/30 bg-accent/5 rounded-md p-3 text-xs font-mono">
          <p className="text-accent uppercase tracking-wider mb-1">✓ key rotated</p>
          <p className="text-muted">New key is active. Old key stops working at the edge within ~5s.</p>
        </div>
      )}

      {error && (
        <div className="border border-red-500/30 bg-red-500/5 rounded-md p-3 text-xs font-mono text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={copy}
          className="btn-ghost flex-1 min-w-[120px] !py-2 !px-3 text-xs font-mono uppercase tracking-wider"
        >
          {copied ? '✓ Copied' : 'Copy key'}
        </button>
        {!confirming ? (
          <button
            onClick={() => { setConfirming(true); setError(null); }}
            disabled={rotating}
            className="btn-ghost flex-1 min-w-[120px] !py-2 !px-3 text-xs font-mono uppercase tracking-wider !border-amber-500/40 !text-amber-400 hover:!bg-amber-500/5"
          >
            Rotate key
          </button>
        ) : (
          <div className="flex flex-1 min-w-full gap-2">
            <span className="text-xs font-mono text-amber-400 self-center mr-1">
              Old key dies. Confirm?
            </span>
            <button
              onClick={rotate}
              disabled={rotating}
              className="btn-ghost flex-1 !py-2 !px-3 text-xs font-mono uppercase tracking-wider !border-red-500/40 !text-red-400 hover:!bg-red-500/5"
            >
              {rotating ? 'Rotating…' : 'Yes, rotate'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={rotating}
              className="btn-ghost !py-2 !px-3 text-xs font-mono uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CopyEndpoint({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="space-y-1">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <div className="relative">
        <div className="font-mono text-xs sm:text-sm break-all bg-bg border border-border rounded-md p-3 pr-16 select-all min-h-[44px] flex items-center">
          {url}
        </div>
        <button
          onClick={copy}
          className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-wider text-accent hover:text-accent-bright px-2 py-1"
          aria-label="Copy"
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
