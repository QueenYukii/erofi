import { NextResponse, type NextRequest } from 'next/server';
import { RECEIVE_ONLY_CHAIN_IDS, isSupportedChain } from '@/config/chains';
import { relayFetch } from '@/lib/relay-server';

export const dynamic = 'force-dynamic';

interface QuoteRequest {
  user: string;
  recipient: string;
  originChainId: number;
  destinationChainId: number;
  originCurrency: string;
  destinationCurrency: string;
  amount: string;
}

const isStr = (v: unknown, max = 128): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

export async function POST(req: NextRequest) {
  let input: Partial<QuoteRequest>;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
  }

  const { user, recipient, originChainId, destinationChainId, originCurrency, destinationCurrency, amount } = input;

  if (
    !isStr(user) ||
    !isStr(recipient) ||
    !isStr(originCurrency) ||
    !isStr(destinationCurrency) ||
    typeof originChainId !== 'number' ||
    typeof destinationChainId !== 'number' ||
    !isSupportedChain(originChainId) ||
    !isSupportedChain(destinationChainId) ||
    RECEIVE_ONLY_CHAIN_IDS.includes(originChainId) ||
    !isStr(amount, 80) ||
    !/^\d+$/.test(amount) ||
    amount === '0'
  ) {
    return NextResponse.json({ message: 'Invalid quote parameters.' }, { status: 400 });
  }

  // Only forward whitelisted fields — the client cannot inject arbitrary options.
  const payload = {
    user,
    recipient,
    originChainId,
    destinationChainId,
    originCurrency,
    destinationCurrency,
    amount,
    tradeType: 'EXACT_INPUT',
    // Relay rejects `referrer` with 401 unless the request carries an API key.
    ...(process.env.RELAY_API_KEY && { referrer: process.env.RELAY_REFERRER ?? 'erofi' }),
  };

  const { status, body } = await relayFetch('/quote/v2', { method: 'POST', body: JSON.stringify(payload) });
  return NextResponse.json(body, { status });
}
