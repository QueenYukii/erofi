'use client';

import { useMemo } from 'react';
import { Connection } from '@solana/web3.js';
import { useAccount } from 'wagmi';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAppKitConnection, type Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react';
import { useDisconnect } from '@reown/appkit-controllers/react';
import type { ChainVm } from '@/config/chains';
import type { SolanaSigner } from './executor';

const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

/**
 * eroFi can hold a Solana and an EVM wallet at the same time (AppKit
 * multichain). This hook exposes both, plus helpers to open the right modal.
 */
export function useWallets() {
  const { open } = useAppKit();
  const { disconnect: disconnectAppKit } = useDisconnect();
  const sol = useAppKitAccount({ namespace: 'solana' });
  const evm = useAccount();
  const { walletProvider } = useAppKitProvider<SolanaProvider>('solana');
  const { connection: appKitConnection } = useAppKitConnection();

  const solanaConnection = useMemo<Connection | undefined>(() => {
    if (customRpc) return new Connection(customRpc, 'confirmed');
    return appKitConnection ?? undefined;
  }, [appKitConnection]);

  const solanaSigner = useMemo<SolanaSigner | undefined>(() => {
    if (!walletProvider) return undefined;
    return {
      signAndSendTransaction: async (tx) => {
        const sig = await walletProvider.signAndSendTransaction(tx);
        return typeof sig === 'string' ? sig : String(sig);
      },
    };
  }, [walletProvider]);

  const addressFor = (vm: ChainVm) => (vm === 'svm' ? sol.address : evm.address);
  const isConnectedFor = (vm: ChainVm) => (vm === 'svm' ? Boolean(sol.isConnected && sol.address) : evm.isConnected);

  const connect = (vm?: ChainVm) =>
    open(vm ? { view: 'Connect', namespace: vm === 'svm' ? 'solana' : 'eip155' } : { view: 'Connect' });

  return {
    solana: {
      address: sol.address,
      isConnected: Boolean(sol.isConnected && sol.address),
      status: sol.status,
      connection: solanaConnection,
      signer: solanaSigner,
    },
    evm: {
      address: evm.address,
      isConnected: evm.isConnected,
      chainId: evm.chainId,
      status: evm.status,
    },
    addressFor,
    isConnectedFor,
    connect,
    openAccount: () => open({ view: 'Account' }),
    disconnect: (vm: ChainVm) => disconnectAppKit({ namespace: vm === 'svm' ? 'solana' : 'eip155' }),
  };
}
