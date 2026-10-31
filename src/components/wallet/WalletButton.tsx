'use client';

import { useEffect, useState } from 'react';
import { LogOut, Wallet } from 'lucide-react';
import { useWallets } from '@/features/relay/useWallets';
import { ChainIcon } from '@/components/ChainIcon';
import { SOLANA_RELAY_CHAIN_ID } from '@/config/chains';
import { truncateAddress } from '@/lib/format';

/**
 * Header wallet control. Shows one pill per connected ecosystem (Solana / EVM)
 * so users always know which addresses eroFi is acting on.
 */
export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const w = useWallets();
  useEffect(() => setMounted(true), []);

  if (!mounted) return <span className="skeleton" style={{ width: 132, height: 40, borderRadius: 999 }} />;

  const anyConnected = w.solana.isConnected || w.evm.isConnected;
  if (!anyConnected) {
    return (
      <button type="button" className="btn btn-primary btn-sm" onClick={() => w.connect('svm')}>
        <Wallet aria-hidden="true" />
        Connect wallet
      </button>
    );
  }

  return (
    <div className="wallet-group">
      {w.solana.isConnected && (
        <div className="wallet-pill-group">
          <button type="button" className="wallet-pill" onClick={w.openAccount} aria-label="Solana wallet">
            <ChainIcon chainId={SOLANA_RELAY_CHAIN_ID} size={22} />
            <span className="addr-text mono">{truncateAddress(w.solana.address)}</span>
            <span className="status-dot" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="wallet-disconnect"
            onClick={() => w.disconnect('svm')}
            aria-label="Disconnect Solana wallet"
            title="Disconnect Solana wallet"
          >
            <LogOut aria-hidden="true" />
          </button>
        </div>
      )}
      {w.evm.isConnected && (
        <div className="wallet-pill-group">
          <button type="button" className="wallet-pill" onClick={w.openAccount} aria-label="EVM wallet">
            <ChainIcon chainId={w.evm.chainId ?? 1} size={22} />
            <span className="addr-text mono">{truncateAddress(w.evm.address)}</span>
            <span className="status-dot" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="wallet-disconnect"
            onClick={() => w.disconnect('evm')}
            aria-label="Disconnect EVM wallet"
            title="Disconnect EVM wallet"
          >
            <LogOut aria-hidden="true" />
          </button>
        </div>
      )}
      {!(w.solana.isConnected && w.evm.isConnected) && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => w.connect(w.solana.isConnected ? 'evm' : 'svm')}
        >
          + {w.solana.isConnected ? 'EVM' : 'Solana'}
        </button>
      )}
    </div>
  );
}
