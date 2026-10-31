'use client';

import { type ReactNode, useState } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider, cookieToInitialState, type Config } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  metadata,
  networks,
  projectId,
  solanaAdapter,
  wagmiAdapter,
  wagmiConfig,
} from '@/config/appkit';

// One AppKit instance for the whole app: a single modal for Phantom, Solflare,
// Backpack, MetaMask, Rabby, Trust, OKX and 300+ WalletConnect wallets.
createAppKit({
  adapters: [solanaAdapter, wagmiAdapter],
  networks,
  defaultNetwork: networks[0],
  projectId,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#7CC8F5',
    '--w3m-color-mix': '#070B14',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '2px',
    '--w3m-font-family': 'var(--font-sans), system-ui, sans-serif',
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
    swaps: false,
    onramp: false,
  },
});

export function Web3Provider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } },
      }),
  );
  const initialState = cookieToInitialState(wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
