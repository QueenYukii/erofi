import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import { Web3Provider } from '@/providers/Web3Provider';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-inter-tight', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'eroFi — Bridge from Solana to any chain', template: '%s · eroFi' },
  description:
    'Move SOL, USDC and USDT from Solana to Ethereum, BNB Chain, Base, Arbitrum, Optimism and Polygon in one signature.',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  openGraph: {
    title: 'eroFi — Bridge from Solana to any chain',
    description: 'One signature. Every fee shown up front. Settled in seconds.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070B14',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookies = (await headers()).get('cookie');

  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${interTight.variable} ${mono.variable}`}
      style={
        {
          '--font-sans': 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
          '--font-display': 'var(--font-inter-tight), var(--font-inter), ui-sans-serif, sans-serif',
          '--font-mono': 'var(--font-jetbrains), ui-monospace, monospace',
        } as React.CSSProperties
      }
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Web3Provider cookies={cookies}>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </Web3Provider>
      </body>
    </html>
  );
}
