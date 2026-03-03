import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StreamSuite — Real-Time Solana Market Intelligence',
  description: 'Wallet reputation scores, influencer accountability, ML-driven market signals. Open-source intelligence platform for Solana memecoin markets.',
  openGraph: {
    title: 'StreamSuite — Real-Time Solana Market Intelligence',
    description: 'Wallet reputation scores, influencer accountability, ML-driven market signals. Open-source intelligence platform for Solana memecoin markets.',
    url: 'https://streamsuite.io',
    siteName: 'StreamSuite',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamSuite — Real-Time Solana Market Intelligence',
    description: 'Open-source intelligence platform for Solana memecoin markets.',
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
