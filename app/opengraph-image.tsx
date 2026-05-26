import { ImageResponse } from 'next/og';

// Dynamic 1200×630 OpenGraph image, served at /opengraph-image (Next.js
// app-router convention). Discord / Slack / Twitter / iMessage / LinkedIn
// fetch and cache this URL when someone shares a streamsuite.io link.
//
// Rendered via @vercel/og (ships with next/og). No external fonts or images:
// keeps the build fast and the function-cold-start under 1s. Default font
// (Noto Sans) is fine for OG cards — they're skimmed in a feed, not read.

export const runtime = 'edge';
export const alt = 'StreamSuite — Bare-metal blockchain infrastructure';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#07090c';
const PANEL = '#0e1116';
const BORDER = '#2a2d33';
const INK = '#e5e9f0';
const MUTED = '#8a8f99';
const ACCENT = '#34d399';
const ACCENT_DIM = '#34d39933';

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '"SF Mono", "Menlo", "Monaco", monospace',
          color: INK,
          padding: 64,
          position: 'relative',
        }}
      >
        {/* dot grid bg */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(${BORDER} 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            opacity: 0.5,
          }}
        />

        {/* top row: pulsing pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 16,
            letterSpacing: 2,
            color: ACCENT,
            border: `1px solid ${ACCENT_DIM}`,
            padding: '8px 16px',
            borderRadius: 999,
            alignSelf: 'flex-start',
            background: 'rgba(52,211,153,0.05)',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: ACCENT,
              boxShadow: `0 0 12px ${ACCENT}`,
            }}
          />
          ASHBURN / VA · BARE METAL
        </div>

        {/* mark + wordmark lockup */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 36,
            marginTop: 56,
          }}
        >
          {/* mark — terminal brackets framing a sharp data pulse */}
          <svg
            width="180"
            height="180"
            viewBox="0 0 256 256"
            fill="none"
            stroke={ACCENT}
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 62 52 L 36 52 L 36 204 L 62 204" />
            <path d="M 194 52 L 220 52 L 220 204 L 194 204" />
            <path d="M 62 128 L 96 128 L 114 72 L 140 184 L 160 128 L 194 128" />
          </svg>

          {/* wordmark */}
          <div style={{ display: 'flex', fontSize: 124, fontWeight: 800, letterSpacing: -4 }}>
            <span style={{ color: INK }}>Stream</span>
            <span style={{ color: ACCENT }}>Suite</span>
          </div>
        </div>

        {/* tagline */}
        <div
          style={{
            marginTop: 36,
            fontSize: 36,
            color: INK,
            fontWeight: 600,
            letterSpacing: -1,
            maxWidth: 920,
            lineHeight: 1.15,
          }}
        >
          Bare-metal BSC RPC. Zero rate limits. Sub-millisecond p50.
        </div>

        {/* tag row + bottom */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {['$399/mo · Real-Time', '$999/mo · Mempool', '$2,499/mo · Full Node'].map((t) => (
                <div
                  key={t}
                  style={{
                    fontSize: 18,
                    color: MUTED,
                    border: `1px solid ${BORDER}`,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: PANEL,
                    display: 'flex',
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', fontSize: 18, color: MUTED, letterSpacing: 1 }}>
              <span style={{ color: ACCENT }}>streamsuite.io</span>
              <span style={{ margin: '0 12px' }}>·</span>
              <span>HTTPS + WSS · 10 operators per node max</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
