'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RelayQuote } from './types';

export interface QuoteParams {
  user?: string;
  recipient?: string;
  originChainId: number;
  destinationChainId: number;
  originCurrency: string;
  destinationCurrency: string;
  amount?: string; // raw base units
}

export const QUOTE_REFRESH_MS = 25_000;

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export class QuoteError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

const friendlyQuoteError = (body: { message?: string; errorCode?: string }) => {
  const code = body.errorCode ?? '';
  if (code === 'AMOUNT_TOO_LOW') return 'Amount is too low to cover bridge fees.';
  if (code === 'INSUFFICIENT_LIQUIDITY' || code === 'NO_SWAP_ROUTES_FOUND')
    return 'No route available for this pair right now. Try another token or a smaller amount.';
  if (code === 'SOLANA_TX_TOO_LARGE') return 'This route is too complex for one Solana transaction. Try a different token.';
  return body.message ?? 'Could not get a quote. Please try again.';
};

export function useQuote(params: QuoteParams, enabled: boolean) {
  const debounced = useDebounced(params, 500);
  const ready =
    enabled &&
    Boolean(debounced.user && debounced.recipient && debounced.amount && debounced.amount !== '0') &&
    !(
      debounced.originChainId === debounced.destinationChainId &&
      debounced.originCurrency.toLowerCase() === debounced.destinationCurrency.toLowerCase()
    );

  const query = useQuery({
    queryKey: ['quote', debounced],
    enabled: ready,
    refetchInterval: QUOTE_REFRESH_MS,
    retry: false,
    queryFn: async ({ signal }) => {
      const res = await fetch('/api/bridge/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(debounced),
        signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new QuoteError(friendlyQuoteError(body), body.errorCode);
      return body as RelayQuote;
    },
  });

  const isDebouncing = JSON.stringify(params) !== JSON.stringify(debounced);
  return { ...query, isDebouncing, ready };
}
