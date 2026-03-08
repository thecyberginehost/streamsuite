import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from './components/Navbar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'StreamSuite — Open-Source Data Infrastructure for Solana',
  description: 'Real-time trade archival, wallet intelligence, and ML signals for Solana memecoin markets. Free API access and Parquet data exports.',
  openGraph: {
    title: 'StreamSuite — Open-Source Data Infrastructure for Solana',
    description: 'Real-time trade archival, wallet intelligence, and ML signals for Solana memecoin markets. Free API access and Parquet data exports.',
    url: 'https://streamsuite.io',
    siteName: 'StreamSuite',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamSuite — Open-Source Data Infrastructure for Solana',
    description: 'Real-time trade archival, wallet intelligence, and ML signals for Solana markets.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Navbar />
        <div className="pt-12">{children}</div>
      </body>
    </html>
  );
}
