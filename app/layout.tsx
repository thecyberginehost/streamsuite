import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StreamSuite — Open-Source Developer Tooling for Solana',
  description: 'Free APIs and SDKs for Solana trade data, wallet reputation scores, influencer PnL, and ML signals. Open-source developer tooling for the Solana ecosystem.',
  openGraph: {
    title: 'StreamSuite — Open-Source Developer Tooling for Solana',
    description: 'Free APIs and SDKs for Solana trade data, wallet reputation scores, influencer PnL, and ML signals. Open-source developer tooling for the Solana ecosystem.',
    url: 'https://streamsuite.io',
    siteName: 'StreamSuite',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamSuite — Open-Source Developer Tooling for Solana',
    description: 'Free APIs and SDKs for Solana trade data, wallet scores, and ML signals.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
