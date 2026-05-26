'use client';

import { useEffect, useState } from 'react';

const REPO = 'StreamSuite-RPC/bench';

type Platform = {
  id: string;
  label: string;
  archive: string;     // filename inside the GitHub Release
  binary: string;      // raw binary filename (for curl-pipe install lookup)
};

const PLATFORMS: Platform[] = [
  { id: 'linux-amd64',   label: 'Linux (x86_64)',    archive: 'streamsuite-bench_{V}_linux_amd64.tar.gz',     binary: 'streamsuite-bench-linux-amd64' },
  { id: 'linux-arm64',   label: 'Linux (arm64)',     archive: 'streamsuite-bench_{V}_linux_arm64.tar.gz',     binary: 'streamsuite-bench-linux-arm64' },
  { id: 'darwin-arm64',  label: 'macOS (Apple Silicon)', archive: 'streamsuite-bench_{V}_darwin_arm64.tar.gz', binary: 'streamsuite-bench-darwin-arm64' },
  { id: 'darwin-amd64',  label: 'macOS (Intel)',     archive: 'streamsuite-bench_{V}_darwin_amd64.tar.gz',    binary: 'streamsuite-bench-darwin-amd64' },
  { id: 'windows-amd64', label: 'Windows (x86_64)',  archive: 'streamsuite-bench_{V}_windows_amd64.zip',      binary: 'streamsuite-bench-windows-amd64.exe' },
];

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'linux-amd64';
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  if (/macintosh|mac os x/.test(ua)) {
    // Apple Silicon detection heuristic — Safari hides arch, so we default to arm64
    // for modern macOS (the overwhelming majority of new Macs since 2020).
    if (/intel/.test(platform)) return 'darwin-amd64';
    return 'darwin-arm64';
  }
  if (/win/.test(ua)) return 'windows-amd64';
  if (/android/.test(ua)) return 'linux-arm64'; // termux users
  // Linux x86 fallback
  return 'linux-amd64';
}

export default function BenchDownload({ version }: { version: string }) {
  const [picked, setPicked] = useState<string>('linux-amd64');
  const [detected, setDetected] = useState<boolean>(false);

  useEffect(() => {
    setPicked(detectPlatform());
    setDetected(true);
  }, []);

  const platform = PLATFORMS.find((p) => p.id === picked) || PLATFORMS[0];
  const archiveUrl = `https://github.com/${REPO}/releases/download/v${version}/${platform.archive.replace('{V}', version)}`;
  const checksumsUrl = `https://github.com/${REPO}/releases/download/v${version}/checksums.txt`;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent mb-2">
            direct download &middot; v{version}
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Prefer not to <code className="font-mono text-accent">curl | sh</code>?{' '}
            Download the archive directly.
            {detected && (
              <span className="block mt-1 text-xs text-muted/70">
                Auto-detected your platform from the browser.
              </span>
            )}
          </p>
        </div>
        <select
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          className="bg-panel-2 border border-border rounded-md text-sm text-ink px-3 py-2 font-mono focus:outline-none focus:border-accent"
        >
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <a
        href={archiveUrl}
        className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 no-underline"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Download {platform.label} archive
      </a>

      <p className="mt-3 text-xs text-muted leading-relaxed">
        After download:{' '}
        <code className="font-mono text-accent">tar -xzf streamsuite-bench_*.tar.gz</code>{' '}
        (or unzip on Windows) &rarr;{' '}
        <code className="font-mono text-accent">./streamsuite-bench</code>.
        Verify the binary with the{' '}
        <a href={checksumsUrl} className="text-accent hover:text-accent-bright underline underline-offset-2">
          SHA-256 checksums
        </a>
        .
      </p>
    </div>
  );
}
