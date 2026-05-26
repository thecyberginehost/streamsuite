/**
 * /bench/install.sh
 *
 * Serves the streamsuite-bench installer when fetched with curl|wget.
 * Plain-text response so `curl -sSL .../install.sh | sh` works.
 *
 * The script itself is intentionally tiny and does only one thing: download
 * the right release binary from GitHub Releases into ./streamsuite-bench
 * and chmod +x it. No telemetry, no PATH writes, no sudo.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = 3600;

const REPO = 'StreamSuite-RPC/bench';

const SCRIPT = `#!/usr/bin/env sh
# streamsuite-bench installer
# source: https://github.com/${REPO}
# verify: curl -sSL https://streamsuite.io/bench/install.sh | shasum -a 256

set -eu

REPO="${REPO}"
DEST="\${DEST:-./streamsuite-bench}"

detect_platform() {
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64) arch="amd64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) echo "unsupported arch: $arch" >&2; exit 1 ;;
  esac
  case "$os" in
    linux|darwin) ;;
    *)
      echo "unsupported os: $os" >&2
      echo "windows users: download the .exe from https://github.com/$REPO/releases/latest" >&2
      exit 1
      ;;
  esac
  echo "\${os}-\${arch}"
}

# v1.0 ships with the public launch. Until then, this script gives a friendly
# heads-up rather than 404'ing on a missing release asset.
preflight_release_check() {
  url="https://api.github.com/repos/$REPO/releases/latest"
  status="$(curl -sS -o /dev/null -w '%{http_code}' "$url" || echo 000)"
  if [ "$status" != "200" ]; then
    cat <<'EOF' >&2

  streamsuite-bench v1.0 is publishing with our launch.
  Until then, the page at https://streamsuite.io/bench has live sample
  output and the methodology so you can preview what the tool produces.

  Want early access? mailto:support@streamsuite.io with subject
  "bench early access" and your platform (linux-amd64 / darwin-arm64 / etc).

EOF
    exit 0
  fi
}

main() {
  preflight_release_check
  platform="$(detect_platform)"
  echo "→ detected platform: $platform"

  version="\${VERSION:-latest}"
  if [ "$version" = "latest" ]; then
    url="https://github.com/$REPO/releases/latest/download/streamsuite-bench-$platform"
  else
    url="https://github.com/$REPO/releases/download/$version/streamsuite-bench-$platform"
  fi

  echo "→ downloading: $url"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$DEST"
  elif command -v wget >/dev/null 2>&1; then
    wget -q "$url" -O "$DEST"
  else
    echo "need curl or wget" >&2; exit 1
  fi

  chmod +x "$DEST"
  echo "→ installed: $DEST"
  echo ""
  echo "run it:"
  echo "  $DEST"
  echo ""
  echo "compare against your current RPC:"
  echo "  $DEST --vs https://your-current-rpc.example/<YOUR_API_KEY>"
}

main "$@"
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
      'x-content-type-options': 'nosniff',
    },
  });
}
