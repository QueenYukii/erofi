'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { formatUnits } from 'viem';
import type { RelayQuote } from './types';
import { QUOTE_REFRESH_MS } from './useQuote';
import { formatDecimalString, formatSeconds, formatUsd } from '@/lib/format';

interface Props {
  quote: RelayQuote;
  updatedAt: number;
  isPreview: boolean;
  symbolIn: string;
  symbolOut: string;
}

const sumUsd = (...vals: (string | undefined)[]) =>
  vals.reduce((s, v) => s + (v && Number.isFinite(Number(v)) ? Number(v) : 0), 0);

export function QuoteDetails({ quote, updatedAt, isPreview, symbolIn, symbolOut }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const d = quote.details ?? {};
  const out = d.currencyOut;
  const minOut =
    out?.minimumAmount && out.currency ? formatUnits(BigInt(out.minimumAmount), out.currency.decimals) : undefined;
  const gasUsd = quote.fees?.gas?.amountUsd;
  const relayerUsd = quote.fees?.relayer?.amountUsd;
  const totalFeeUsd = sumUsd(gasUsd, relayerUsd);
  const impact = d.totalImpact?.percent ? Number(d.totalImpact.percent) : undefined;
  const progress = Math.max(0, 1 - (now - updatedAt) / QUOTE_REFRESH_MS);

  return (
    <dl className="quote" aria-live="polite">
      <div className="quote__row">
        <dt>Rate</dt>
        <dd className="num">
          {d.rate ? `1 ${symbolIn} = ${formatDecimalString(d.rate)} ${symbolOut}` : '—'}
          <span
            className="refresh-ring"
            style={{ '--p': progress, display: 'inline-block', marginLeft: 8, verticalAlign: '-3px' } as CSSProperties}
            title="Quote refreshes automatically"
            aria-hidden="true"
          />
        </dd>
      </div>
      <div className="quote__row">
        <dt>Network fee</dt>
        <dd className="num">{formatUsd(gasUsd)}</dd>
      </div>
      <div className="quote__row">
        <dt>Bridge fee</dt>
        <dd className="num">{formatUsd(relayerUsd)}</dd>
      </div>
      <div className="quote__row">
        <dt>Price impact</dt>
        <dd className="num" style={impact !== undefined && impact < -1 ? { color: 'var(--warn)' } : undefined}>
          {impact !== undefined ? `${impact.toFixed(2)}%` : '—'}
        </dd>
      </div>
      <div className="quote__divider" />
      <div className="quote__row">
        <dt>Minimum received</dt>
        <dd className="num">{minOut ? `${formatDecimalString(minOut)} ${symbolOut}` : '—'}</dd>
      </div>
      <div className="quote__row">
        <dt>Total cost</dt>
        <dd className="num">{totalFeeUsd ? formatUsd(totalFeeUsd) : '—'}</dd>
      </div>
      <div className="quote__row">
        <dt>Estimated time</dt>
        <dd className="num">{formatSeconds(d.timeEstimate)}</dd>
      </div>
      <div className="quote__row">
        <dt>Route</dt>
        <dd>
          <span className="badge badge--accent">eroFi Route</span>
          {isPreview && (
            <span className="badge" style={{ marginLeft: 6 }}>
              Estimate
            </span>
          )}
        </dd>
      </div>
    </dl>
  );
}
