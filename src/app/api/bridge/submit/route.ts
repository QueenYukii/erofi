import { NextResponse, type NextRequest } from 'next/server';
import { relayFetch } from '@/lib/relay-server';

export const dynamic = 'force-dynamic';

/**
 * Forwards the `post` part of a Relay signature step (e.g. permit/authorize)
 * so the API key stays server-side. Only relative Relay paths are accepted —
 * this cannot be used as an open proxy to other hosts.
 */
export async function POST(req: NextRequest) {
  let input: { endpoint?: unknown; method?: unknown; body?: unknown };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
  }

  const endpoint = typeof input.endpoint === 'string' ? input.endpoint : '';
  const method = typeof input.method === 'string' ? input.method.toUpperCase() : 'POST';

  if (!/^\/[A-Za-z0-9/_\-.?=&%]{1,300}$/.test(endpoint) || endpoint.includes('..') || endpoint.startsWith('//')) {
    return NextResponse.json({ message: 'Invalid endpoint.' }, { status: 400 });
  }
  if (method !== 'POST' && method !== 'GET') {
    return NextResponse.json({ message: 'Invalid method.' }, { status: 400 });
  }

  const { status, body } = await relayFetch(endpoint, {
    method,
    body: method === 'POST' ? JSON.stringify(input.body ?? {}) : undefined,
  });
  return NextResponse.json(body, { status });
}
