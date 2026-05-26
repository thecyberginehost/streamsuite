'use client';

import { useState } from 'react';

const MASK = '••••••••••••••••••••••••••••••••••••••••••••••••';

export function CredentialsBlock({
  apiKey: initialKey,
  endpointHost,
}: {
  apiKey: string;
  endpointHost: string;
}) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [shown, setShown] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const realHttps = `https://${endpointHost}/?key=${apiKey}`;
  const realWss = `wss://${endpointHost}/ws?key=${apiKey}`;
  const maskedHttps = `https://${endpointHost}/?key=${MASK.slice(0, 12)}`;
  const maskedWss = `wss://${endpointHost}/ws?key=${MASK.slice(0, 12)}`;

  async function copy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
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
    } catch {
      setError('Network error');
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent/90">
          ── credentials ──
        </h3>
        <button
          onClick={() => setShown(!shown)}
          className="font-mono text-[11px] uppercase tracking-wider text-accent hover:text-accent-bright px-2 py-1 border border-border rounded-sm"
        >
          {shown ? 'Hide values' : 'Show values'}
        </button>
      </div>

      <UrlRow
        label="HTTPS RPC"
        value={shown ? realHttps : maskedHttps}
        copyValue={realHttps}
        copied={copiedField === 'https'}
        onCopy={() => copy(realHttps, 'https')}
      />
      <UrlRow
        label="WebSocket"
        value={shown ? realWss : maskedWss}
        copyValue={realWss}
        copied={copiedField === 'wss'}
        onCopy={() => copy(realWss, 'wss')}
      />

      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1">API key</p>
        <div className="relative">
          <div className="font-mono text-xs sm:text-sm break-all bg-bg border border-border rounded-md p-3 pr-20 select-all min-h-[44px] flex items-center">
            {shown ? apiKey : MASK}
          </div>
          <button
            onClick={() => copy(apiKey, 'key')}
            className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-wider text-accent hover:text-accent-bright px-2 py-1"
            aria-label="Copy key"
          >
            {copiedField === 'key' ? '✓' : 'Copy'}
          </button>
        </div>
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
        {!confirming ? (
          <button
            onClick={() => { setConfirming(true); setError(null); }}
            disabled={rotating}
            className="btn-ghost flex-1 min-w-[120px] !py-2 !px-3 text-xs font-mono uppercase tracking-wider !border-amber-500/40 !text-amber-400 hover:!bg-amber-500/5"
          >
            Rotate key
          </button>
        ) : (
          <div className="flex flex-1 min-w-full gap-2 flex-wrap">
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

function UrlRow({
  label,
  value,
  copyValue,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copyValue: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <div className="relative">
        <div className="font-mono text-xs sm:text-sm break-all bg-bg border border-border rounded-md p-3 pr-16 select-all min-h-[44px] flex items-center">
          {value}
        </div>
        <button
          onClick={onCopy}
          className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-wider text-accent hover:text-accent-bright px-2 py-1"
          aria-label="Copy"
          title={`Copy ${copyValue.length > 60 ? copyValue.slice(0, 40) + '…' : copyValue}`}
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
