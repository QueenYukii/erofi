import 'server-only';

/** Server-side helpers for talking to the Relay API. The API key never leaves the server. */

export const RELAY_API_URL = (process.env.RELAY_API_URL ?? 'https://api.relay.link').replace(/\/$/, '');

export function relayHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' };
  if (process.env.RELAY_API_KEY) headers['x-api-key'] = process.env.RELAY_API_KEY;
  return headers;
}

export async function relayFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${RELAY_API_URL}${path}`, {
    ...init,
    headers: { ...relayHeaders(), ...(init.headers ?? {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: 'The routing service returned an unexpected response.' };
  }
  return { status: res.status, body: whiteLabel(body) };
}

/** Upstream error messages are shown to users; keep the provider's name out of them. */
function whiteLabel(body: unknown): unknown {
  if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
    return { ...body, message: body.message.replace(/\brelay(?:er)?\b/gi, (m) => (m[0] === 'R' ? 'Bridge' : 'bridge')) };
  }
  return body;
}
