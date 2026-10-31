'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

export const TOKEN_CA = 'DjBy4FSeC7dqPL7yuFLeYoCRC627YUm2js41icDjpump';

const LINKS = [
  { label: 'Solscan', href: `https://solscan.io/token/${TOKEN_CA}` },
  { label: 'pump.fun', href: `https://pump.fun/coin/${TOKEN_CA}` },
  { label: 'DexScreener', href: `https://dexscreener.com/solana/${TOKEN_CA}` },
];

function useCopyCa() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(TOKEN_CA);
      setCopied(true);
    } catch {
      // Clipboard blocked: the address stays selectable for a manual copy.
    }
  };

  return { copied, copy };
}

/** Header pill: one click copies the CA from any page. */
export function CopyCaButton() {
  const { copied, copy } = useCopyCa();
  return (
    <button
      type="button"
      className="ca-pill"
      onClick={copy}
      aria-label={copied ? 'Contract address copied' : 'Copy contract address'}
      title={TOKEN_CA}
    >
      <span className="ca-pill__label">CA</span>
      {copied ? <Check width={15} height={15} aria-hidden="true" /> : <Copy width={15} height={15} aria-hidden="true" />}
    </button>
  );
}

export function ContractAddress({ compact = false }: { compact?: boolean }) {
  const { copied, copy } = useCopyCa();

  return (
    <div className={compact ? 'ca ca--compact' : 'ca'}>
      <div className="ca__row">
        <span className="ca__label">CA</span>
        <button type="button" className="ca__addr mono" onClick={copy} title="Click to copy">
          {TOKEN_CA}
        </button>
        <button
          type="button"
          className="ca__copy"
          onClick={copy}
          aria-label={copied ? 'Contract address copied' : 'Copy contract address'}
          title="Copy contract address"
        >
          {copied ? <Check width={16} height={16} aria-hidden="true" /> : <Copy width={16} height={16} aria-hidden="true" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {!compact && (
        <div className="ca__links">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
