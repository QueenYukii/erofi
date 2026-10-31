'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';
import { CHAINS, getChain, tokensFor, type LugiaToken } from '@/config/chains';
import { ChainIcon, TokenBadge } from '@/components/ChainIcon';

interface Props {
  label: string;
  value: LugiaToken;
  onChange: (token: LugiaToken) => void;
  /** Chains that may not be picked here (e.g. the other leg's VM restriction) */
  disabledChainIds?: number[];
}

export function AssetSelect({ label, value, onChange, disabledChainIds = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [chainId, setChainId] = useState(value.chainId);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chain = getChain(value.chainId);

  useEffect(() => {
    if (!open) return;
    setChainId(value.chainId);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      triggerRef.current?.focus();
    };
  }, [open, value.chainId]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="asset-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${label}: ${value.symbol} on ${chain.name}. Change`}
      >
        <TokenBadge symbol={value.symbol} chainId={value.chainId} size={30} />
        <span className="asset-btn__text">
          <span>{value.symbol}</span>
          <span className="asset-btn__chain">{chain.name}</span>
        </span>
        <ChevronDown className="chev" aria-hidden="true" />
      </button>

      {/* Portal to <body>: the card's backdrop-filter would otherwise trap this fixed overlay inside the card. */}
      {open &&
        createPortal(
          <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="asset-sheet-title">
              <div className="sheet__head">
                <h2 className="panel__title" id="asset-sheet-title">
                  {label}
                </h2>
                <button ref={closeRef} type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className="sheet__body">
                <div className="sheet__chains" role="listbox" aria-label="Network">
                  {CHAINS.map((c) => {
                    const disabled = disabledChainIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="option"
                        className="option"
                        aria-selected={c.id === chainId}
                        disabled={disabled}
                        style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                        onClick={() => setChainId(c.id)}
                      >
                        <ChainIcon chainId={c.id} size={24} />
                        <span>
                          <span className="option__name">{c.name}</span>
                          <br />
                          <span className="option__sub">{c.vm.toUpperCase()}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="sheet__tokens" role="listbox" aria-label="Token">
                  {tokensFor(chainId).map((t) => {
                    const selected = t.chainId === value.chainId && t.address === value.address;
                    return (
                      <button
                        key={t.address}
                        type="button"
                        role="option"
                        className="option"
                        aria-selected={selected}
                        onClick={() => {
                          onChange(t);
                          setOpen(false);
                        }}
                      >
                        <TokenBadge symbol={t.symbol} chainId={t.chainId} size={32} />
                        <span>
                          <span className="option__name">{t.symbol}</span>
                          <br />
                          <span className="option__sub">
                            {t.name}
                            {t.isNative ? ' · native' : ''}
                          </span>
                        </span>
                        {selected && <Check className="option__right" width={16} height={16} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
