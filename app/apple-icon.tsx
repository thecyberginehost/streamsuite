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
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 62 52 L 36 52 L 36 204 L 62 204" />
          <path d="M 194 52 L 220 52 L 220 204 L 194 204" />
          <path d="M 62 128 L 96 128 L 114 72 L 140 184 L 160 128 L 194 128" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
