import { NextResponse, type NextRequest } from 'next/server';
import { relayFetch } from '@/lib/relay-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get('requestId') ?? '';
  if (!/^0x[0-9a-fA-F]{64}$/.test(requestId)) {
    return NextResponse.json({ message: 'Invalid requestId.' }, { status: 400 });
  }
  const { status, body } = await relayFetch(`/intents/status/v3?requestId=${requestId}`);
  return NextResponse.json(body, { status });
}
