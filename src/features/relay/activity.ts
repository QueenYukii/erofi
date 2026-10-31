'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RelayIntentStatus } from './types';

/**
 * In-flight and recent relays are kept in localStorage so a refresh or a
 * closed tab never loses track of funds that are mid-bridge.
 */
export interface ActivityItem {
  id: string; // requestId or a local id before one exists
  requestId?: string;
  createdAt: number;
  originChainId: number;
  destinationChainId: number;
  amountIn: string;
  symbolIn: string;
  amountOut?: string;
  symbolOut: string;
  recipient: string;
  status: RelayIntentStatus | 'submitting' | 'rejected' | 'error';
  originTx?: string;
  destinationTx?: string;
}

const KEY = 'erofi.activity.v1';
const EVENT = 'erofi:activity';

const read = (): ActivityItem[] => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as ActivityItem[];
  } catch {
    return [];
  }
};

const write = (items: ActivityItem[]) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 25)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable (private mode) — activity stays in memory only */
  }
};

export function upsertActivity(item: Partial<ActivityItem> & { id: string }) {
  const items = read();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx === -1) items.unshift(item as ActivityItem);
  else items[idx] = { ...items[idx], ...item };
  write(items);
}

export function useActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const clear = useCallback(() => write([]), []);
  return { items, clear };
}

export const isInFlight = (s: ActivityItem['status']) =>
  s === 'submitting' || s === 'waiting' || s === 'depositing' || s === 'pending' || s === 'failure';
