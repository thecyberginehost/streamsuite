import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#07090c',
};

const title = 'StreamSuite | Bare-Metal Blockchain Infrastructure';
const description =
  'Bare-metal BSC RPC and blockchain nodes. Zero rate limits. Bare-metal hardware in Ashburn, VA. Built for MEV, arbitrage, and serious operators.';

export const metadata: Metadata = {
  metadataBase: new URL('https://streamsuite.io'),
  title,
  description,
  keywords: [
    'BSC RPC',
    'BNB Chain RPC',
    'dedicated blockchain node',
    'dedicated RPC node',
    'MEV infrastructure',
    'low latency RPC',
    'mempool RPC',
    'pendingTransactions subscription',
    'trading bot node',
  ],
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title,
    description,
    url: 'https://streamsuite.io',
    siteName: 'StreamSuite',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@streamsuite',
    creator: '@streamsuite',
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  );
}
