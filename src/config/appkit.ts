import { cookieStorage, createStorage } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import {
  solana,
  mainnet,
  bsc,
  base,
  arbitrum,
  optimism,
  polygon,
  type AppKitNetwork,
} from '@reown/appkit/networks';

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? '';

if (!projectId && typeof window !== 'undefined') {
  // Surface the misconfiguration early instead of a silent broken modal.
  console.warn('[eroFi] NEXT_PUBLIC_REOWN_PROJECT_ID is not set. Wallet connection will not work.');
}

/** Solana first — it is eroFi's home network. */
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  solana,
  mainnet,
  bsc,
  base,
  arbitrum,
  optimism,
  polygon,
];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks: [mainnet, bsc, base, arbitrum, optimism, polygon],
});

export const solanaAdapter = new SolanaAdapter();

export const wagmiConfig = wagmiAdapter.wagmiConfig;

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata = {
  name: 'eroFi',
  description: 'Bridge assets from Solana to Ethereum, BNB Chain, Base, Arbitrum and more.',
  url: siteUrl, // must match the deployed origin, or wallets will show a warning
  icons: [`${siteUrl}/logo.png`],
};
