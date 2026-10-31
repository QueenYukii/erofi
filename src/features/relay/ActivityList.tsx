'use client';

import { useEffect } from 'react';
import { ArrowRight, ExternalLink, History } from 'lucide-react';
import { getChain } from '@/config/chains';
import { ChainIcon } from '@/components/ChainIcon';
import { formatDecimalString } from '@/lib/format';
import { fetchStatus } from './executor';
import { isInFlight, upsertActivity, useActivity, type ActivityItem } from './activity';

const STATUS_BADGE: Record<ActivityItem['status'], { label: string; tone: string }> = {
  submitting: { label: 'Submitting', tone: '' },
  waiting: { label: 'Waiting', tone: 'badge--warn' },
  depositing: { label: 'Depositing', tone: 'badge--warn' },
  pending: { label: 'Filling', tone: 'badge--warn' },
  failure: { label: 'Retrying', tone: 'badge--warn' },
  success: { label: 'Delivered', tone: 'badge--success' },
  refund: { label: 'Refunded', tone: '' },
  rejected: { label: 'Cancelled', tone: '' },
  error: { label: 'Failed', tone: 'badge--danger' },
};

const timeAgo = (ts: number) => {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(ts).toLocaleDateString();
};

export function ActivityList() {
  const { items, clear } = useActivity();

  // Resume tracking of relays that were in flight when the page was closed.
  useEffect(() => {
    const pending = items.filter((i) => i.requestId && isInFlight(i.status));
    if (pending.length === 0) return;
    const t = setInterval(async () => {
      for (const item of pending) {
        const s = await fetchStatus(item.requestId!).catch(() => null);
        if (s && s.status !== item.status) {
          upsertActivity({ id: item.id, status: s.status, destinationTx: s.txHashes?.[0] ?? item.destinationTx });
        }
      }
    }, 4000);
    return () => clearInterval(t);
  }, [items]);

  return (
    <section className="panel" aria-labelledby="activity-title">
      <div className="panel__head">
        <h2 className="panel__title" id="activity-title">
          Activity
        </h2>
        {items.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
            Clear
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="empty">
          <History aria-hidden="true" />
          <strong>No transfers yet</strong>
          Your transfers appear here, including ones still in flight.
        </div>
      ) : (
        <ul className="activity">
          {items.map((i) => {
            const badge = STATUS_BADGE[i.status] ?? STATUS_BADGE.waiting;
            const link = i.destinationTx
              ? getChain(i.destinationChainId).explorerTx(i.destinationTx)
              : i.originTx
                ? getChain(i.originChainId).explorerTx(i.originTx)
                : undefined;
            return (
              <li key={i.id}>
                <span className="activity__route" aria-label={`${getChain(i.originChainId).name} to ${getChain(i.destinationChainId).name}`}>
                  <ChainIcon chainId={i.originChainId} size={22} />
                  <ArrowRight className="arrow" aria-hidden="true" />
                  <ChainIcon chainId={i.destinationChainId} size={22} />
                </span>
                <div>
                  <div className="activity__amount num">
                    {formatDecimalString(i.amountIn)} {i.symbolIn}
                    {i.amountOut && (
                      <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
                        {' '}
                        → {formatDecimalString(i.amountOut)} {i.symbolOut}
                      </span>
                    )}
                  </div>
                  <div className="activity__meta">
                    {timeAgo(i.createdAt)}
                    {link && (
                      <>
                        {' · '}
                        <a className="tx-link" href={link} target="_blank" rel="noopener noreferrer">
                          Explorer <ExternalLink aria-hidden="true" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
                <span className={`badge ${badge.tone}`}>{badge.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
