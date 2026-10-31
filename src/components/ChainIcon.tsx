'use client';

import { useState, type CSSProperties } from 'react';
import { chainIconUrl, getChain, tokenLogoUrl } from '@/config/chains';

export function ChainIcon({ chainId, size = 24, className = '' }: { chainId: number; size?: number; className?: string }) {
  const chain = getChain(chainId);
  const [failed, setFailed] = useState(false);
  const style = { '--size': `${size}px`, background: failed ? chain.tint : undefined } as CSSProperties;

  return (
    <span className={`chain-icon ${className}`} style={style} title={chain.name}>
      {failed ? (
        <span className="chain-icon__mono" aria-hidden="true">
          {chain.short.slice(0, 2)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={chainIconUrl(chainId)} alt="" width={size} height={size} loading="lazy" onError={() => setFailed(true)} />
      )}
      <span className="sr-only">{chain.name}</span>
    </span>
  );
}

/** Token logo (monogram fallback) with its chain as a corner badge. */
export function TokenBadge({ symbol, chainId, size = 28 }: { symbol: string; chainId: number; size?: number }) {
  const logo = tokenLogoUrl(symbol);
  const [failed, setFailed] = useState(false);
  const showLogo = logo && !failed;
  const hue = [...symbol].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  const style = {
    '--size': `${size}px`,
    background: showLogo ? undefined : `hsl(${hue} 30% 78%)`,
  } as CSSProperties;
  return (
    <span className="token-stack">
      <span className="chain-icon token-icon" style={style} aria-hidden="true">
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width={size} height={size} onError={() => setFailed(true)} />
        ) : (
          <span className="chain-icon__mono">{symbol.slice(0, 3)}</span>
        )}
      </span>
      <ChainIcon chainId={chainId} size={Math.round(size * 0.5)} className="chain-badge" />
    </span>
  );
}
