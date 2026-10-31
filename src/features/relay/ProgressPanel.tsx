'use client';

import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import { getChain } from '@/config/chains';
import { truncateAddress } from '@/lib/format';

export type StepState = 'pending' | 'active' | 'done' | 'error';

export interface ProgressStep {
  key: string;
  title: string;
  state: StepState;
  meta?: string;
  txHash?: string;
  chainId?: number;
}

export function ProgressPanel({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="timeline" aria-label="Transfer progress">
      {steps.map((s) => (
        <li key={s.key} data-state={s.state} aria-current={s.state === 'active' ? 'step' : undefined}>
          <span className="timeline__dot" aria-hidden="true">
            {s.state === 'done' ? (
              <Check />
            ) : s.state === 'active' ? (
              <Loader2 style={{ animation: 'spin 900ms linear infinite' }} />
            ) : s.state === 'error' ? (
              <X />
            ) : null}
          </span>
          <div>
            <div className="timeline__title">{s.title}</div>
            {s.meta && <div className="timeline__meta">{s.meta}</div>}
            {s.txHash && s.chainId && (
              <a
                className="tx-link"
                href={getChain(s.chainId).explorerTx(s.txHash)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {truncateAddress(s.txHash, 6, 6)}
                <ExternalLink aria-hidden="true" />
                <span className="sr-only">View on {getChain(s.chainId).name} explorer</span>
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
