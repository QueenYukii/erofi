#!/usr/bin/env node
// Checks .env.local before a real relay: Reown project ID, Relay API key, Solana RPC.
// Usage: npm run check:setup   (reads .env.local, never prints secret values)

import { readFileSync, existsSync } from 'node:fs';

const ENV_FILE = new URL('../.env.local', import.meta.url);

function loadEnv() {
  if (!existsSync(ENV_FILE)) return null;
  const env = {};
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.log(`  ! ${msg}`);
const fail = (msg) => {
  console.log(`  ✗ ${msg}`);
  process.exitCode = 1;
};

// A small SOL → ETH (Base) quote; quoting is free and moves no funds.
const SAMPLE_QUOTE = {
  user: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  recipient: '0x000000000000000000000000000000000000dEaD',
  originChainId: 792703809,
  destinationChainId: 8453,
  originCurrency: '11111111111111111111111111111111',
  destinationCurrency: '0x0000000000000000000000000000000000000000',
  amount: '50000000', // 0.05 SOL
  tradeType: 'EXACT_INPUT',
};

async function checkReown(env) {
  console.log('\nReown (wallet connection)');
  const id = env.NEXT_PUBLIC_REOWN_PROJECT_ID;
  if (!id) return fail('NEXT_PUBLIC_REOWN_PROJECT_ID is empty. Get one at https://dashboard.reown.com');
  if (!/^[0-9a-f]{32}$/i.test(id)) return fail('NEXT_PUBLIC_REOWN_PROJECT_ID does not look like a Reown project ID (32 hex chars).');
  ok('Project ID is set and well-formed');

  const site = env.NEXT_PUBLIC_SITE_URL;
  if (!site) warn('NEXT_PUBLIC_SITE_URL is empty; wallets may show a domain warning.');
  else ok(`Site URL: ${site} (must also be in the Reown project allowlist)`);
}

async function checkRelay(env) {
  console.log('\nRelay (quotes & execution)');
  const base = (env.RELAY_API_URL || 'https://api.relay.link').replace(/\/$/, '');
  const headers = { 'content-type': 'application/json' };
  if (env.RELAY_API_KEY) headers['x-api-key'] = env.RELAY_API_KEY;
  else warn('RELAY_API_KEY is empty. Quotes currently work without it, but Relay may rate-limit or require it.');

  try {
    const res = await fetch(`${base}/quote/v2`, {
      method: 'POST',
      headers,
      body: JSON.stringify(SAMPLE_QUOTE),
      signal: AbortSignal.timeout(15_000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) return fail(`Relay rejected the API key (HTTP ${res.status}).`);
    if (!res.ok) return fail(`Sample quote failed (HTTP ${res.status}): ${body.message ?? 'unknown error'}`);
    const out = body.details?.currencyOut;
    ok(`Sample quote OK: 0.05 SOL → ${out?.amountFormatted ?? '?'} ${out?.currency?.symbol ?? ''} on Base`);
    if (env.RELAY_API_KEY) ok('API key accepted');
  } catch (err) {
    fail(`Could not reach Relay at ${base}: ${err.message}`);
  }
}

async function checkSolanaRpc(env) {
  console.log('\nSolana RPC');
  const url = env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (!url) return warn('Not set; using the default RPC from AppKit. Use Helius/QuickNode/Triton in production.');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.json().catch(() => ({}));
    if (body.result === 'ok') ok('RPC is healthy');
    else fail(`RPC responded but is not healthy (HTTP ${res.status}).`);
  } catch (err) {
    fail(`Could not reach the Solana RPC: ${err.message}`);
  }
}

const env = loadEnv();
if (!env) {
  console.log('No .env.local found. Run: cp .env.example .env.local');
  process.exit(1);
}
await checkReown(env);
await checkRelay(env);
await checkSolanaRpc(env);
console.log(process.exitCode ? '\nFix the ✗ items above, then run again.' : '\nReady. Start with: npm run dev');
