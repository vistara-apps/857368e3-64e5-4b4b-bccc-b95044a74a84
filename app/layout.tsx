import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LiquidityLink - Unify Your DeFi Liquidity',
  description: 'Compare rates, manage positions, and assess risk effortlessly across DEXs and CEXs on Base.',
  keywords: ['DeFi', 'liquidity', 'Base', 'DEX', 'yield farming', 'crypto'],
  authors: [{ name: 'LiquidityLink Team' }],
  openGraph: {
    title: 'LiquidityLink - Unify Your DeFi Liquidity',
    description: 'Compare rates, manage positions, and assess risk effortlessly across DEXs and CEXs on Base.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LiquidityLink - Unify Your DeFi Liquidity',
    description: 'Compare rates, manage positions, and assess risk effortlessly across DEXs and CEXs on Base.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
