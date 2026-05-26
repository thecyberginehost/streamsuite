import { ImageResponse } from 'next/og';

// Apple touch icon — shown when a customer adds streamsuite.io to their
// iPhone home screen. iOS rounds corners automatically. Apple recommends
// 180×180; smaller works but renders blurry on iPad / large home-screen
// icons. We render the mark on the brand dark background.

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#07090c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 256 256"
          fill="none"
          stroke="#34d399"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="28" y="36" width="200" height="184" rx="22" ry="22" />
          <line x1="28" y1="72" x2="228" y2="72" />
          <line x1="56" y1="112" x2="172" y2="112" />
          <line x1="56" y1="148" x2="148" y2="148" />
          <line x1="56" y1="184" x2="124" y2="184" />
          <circle cx="190" cy="112" r="11" fill="#34d399" stroke="none" />
          <circle cx="166" cy="148" r="11" fill="#34d399" stroke="none" />
          <circle cx="142" cy="184" r="11" fill="#34d399" stroke="none" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
