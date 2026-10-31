import { Buffer } from 'buffer';
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  type AddressLookupTableAccount,
} from '@solana/web3.js';
import type { Config } from 'wagmi';
import {
  getAccount,
  sendTransaction,
  signMessage,
  signTypedData,
  switchChain,
  waitForTransactionReceipt,
  type SignTypedDataParameters,
} from 'wagmi/actions';
import type { Hex } from 'viem';
import {
  isSignatureData,
  isSvmData,
  type EvmTxData,
  type RelayQuote,
  type RelayStatusResponse,
  type SignatureData,
  type SvmTxData,
} from './types';

/** Minimal surface of the AppKit Solana wallet provider we need. */
export interface SolanaSigner {
  signAndSendTransaction: (tx: VersionedTransaction) => Promise<string>;
}

export interface ExecutionContext {
  wagmiConfig: Config;
  solana?: { connection: Connection; signer: SolanaSigner; address: string };
  onEvent: (event: ExecutionEvent) => void;
  /** Abort polling when the component unmounts */
  signal?: AbortSignal;
}

export type ExecutionEvent =
  | { type: 'step'; stepId: string; description: string; index: number; total: number }
  | { type: 'awaiting_signature'; stepId: string }
  | { type: 'submitted'; stepId: string; txHash: string; chainId: number; requestId?: string }
  | { type: 'confirmed'; stepId: string; txHash: string }
  | { type: 'relaying'; requestId: string; status: RelayStatusResponse['status'] }
  | { type: 'done'; requestId?: string; status: RelayStatusResponse };

export class UserRejectedError extends Error {
  constructor() {
    super('You rejected the request in your wallet.');
    this.name = 'UserRejectedError';
  }
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

export const isUserRejection = (err: unknown) => {
  const e = err as { name?: string; code?: number; message?: string; cause?: { code?: number } };
  const msg = (e?.message ?? '').toLowerCase();
  return (
    e?.name === 'UserRejectedRequestError' ||
    e?.name === 'UserRejectedError' ||
    e?.code === 4001 ||
    e?.cause?.code === 4001 ||
    msg.includes('user rejected') ||
    msg.includes('rejected the request') ||
    msg.includes('user denied') ||
    msg.includes('declined')
  );
};

async function sendEvm(ctx: ExecutionContext, data: EvmTxData) {
  const account = getAccount(ctx.wagmiConfig);
  if (!account.address) throw new Error('Connect an EVM wallet to continue.');
  if (account.address.toLowerCase() !== data.from.toLowerCase()) {
    throw new Error('The connected EVM wallet changed. Refresh the quote and try again.');
  }
  if (account.chainId !== data.chainId) {
    await switchChain(ctx.wagmiConfig, { chainId: data.chainId as never });
  }
  const hash = await sendTransaction(ctx.wagmiConfig, {
    account: data.from as Hex,
    chainId: data.chainId as never,
    to: data.to as Hex,
    data: data.data as Hex,
    value: data.value ? BigInt(data.value) : 0n,
    ...(data.gas ? { gas: BigInt(data.gas) } : {}),
  });
  return hash;
}

async function confirmEvm(ctx: ExecutionContext, hash: Hex, chainId: number) {
  const receipt = await waitForTransactionReceipt(ctx.wagmiConfig, { hash, chainId: chainId as never, confirmations: 1 });
  if (receipt.status !== 'success') throw new OnChainError('The transaction reverted on-chain.');
}

async function sendSvm(ctx: ExecutionContext, data: SvmTxData) {
  if (!ctx.solana) throw new Error('Connect a Solana wallet to continue.');
  const { connection, signer, address } = ctx.solana;

  const instructions = data.instructions.map(
    (i) =>
      new TransactionInstruction({
        programId: new PublicKey(i.programId),
        keys: i.keys.map((k) => ({ pubkey: new PublicKey(k.pubkey), isSigner: k.isSigner, isWritable: k.isWritable })),
        data: Buffer.from(i.data, 'hex'),
      }),
  );

  const lookupTables = (
    await Promise.all(
      (data.addressLookupTableAddresses ?? []).map((a) =>
        connection.getAddressLookupTable(new PublicKey(a)).then((r) => r.value),
      ),
    )
  ).filter((t): t is AddressLookupTableAccount => t !== null);

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const message = new TransactionMessage({
    payerKey: new PublicKey(address),
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(lookupTables);

  return signer.signAndSendTransaction(new VersionedTransaction(message));
}

/** Thrown only when a transaction is known to have failed on-chain. */
class OnChainError extends Error {}

/**
 * Polls the signature over plain HTTP. `confirmTransaction` needs a websocket,
 * which many RPCs (including AppKit's default) don't offer — it then throws
 * even though the deposit landed. If confirmation can't be observed in time we
 * return and let the bridge status poll decide the outcome.
 */
async function confirmSvm(ctx: ExecutionContext, signature: string) {
  const { connection } = ctx.solana!;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const { value } = await connection.getSignatureStatuses([signature]).catch(() => ({ value: [null] }));
    const s = value[0];
    if (s?.err) throw new OnChainError('The Solana transaction failed on-chain.');
    if (s?.confirmationStatus === 'confirmed' || s?.confirmationStatus === 'finalized') return;
    await sleep(1500, ctx.signal);
  }
}

async function handleSignature(ctx: ExecutionContext, data: SignatureData) {
  const account = getAccount(ctx.wagmiConfig);
  if (!account.address) throw new Error('Connect an EVM wallet to sign.');
  const { sign, post } = data;

  let signature: Hex;
  if (sign.signatureKind === 'eip712') {
    // Relay returns the typed data at runtime; its shape can't be known statically.
    signature = await signTypedData(ctx.wagmiConfig, {
      domain: sign.domain,
      types: sign.types,
      primaryType: sign.primaryType,
      message: sign.value,
    } as unknown as SignTypedDataParameters);
  } else {
    const msg = sign.message ?? '';
    signature = await signMessage(ctx.wagmiConfig, {
      message: msg.startsWith('0x') ? { raw: msg as Hex } : msg,
    });
  }

  if (post) {
    const endpoint = `${post.endpoint}${post.endpoint.includes('?') ? '&' : '?'}signature=${signature}`;
    const res = await fetch('/api/bridge/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint, method: post.method, body: post.body }),
    });
    if (!res.ok) throw new Error('The signature was rejected. Refresh the quote and try again.');
  }
}

export async function fetchStatus(requestId: string, signal?: AbortSignal): Promise<RelayStatusResponse | null> {
  const res = await fetch(`/api/bridge/status?requestId=${requestId}`, { signal, cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as RelayStatusResponse;
}

/** Poll Relay until the intent reaches a final state (or ~10 minutes pass). */
export async function pollUntilFinal(
  requestId: string,
  onUpdate: (s: RelayStatusResponse) => void,
  signal?: AbortSignal,
): Promise<RelayStatusResponse> {
  const deadline = Date.now() + 10 * 60_000;
  let last: RelayStatusResponse = { status: 'waiting' };
  while (Date.now() < deadline) {
    const s = await fetchStatus(requestId, signal).catch(() => null);
    if (s) {
      last = s;
      onUpdate(s);
      if (s.status === 'success' || s.status === 'refund') return s;
    }
    await sleep(1500, signal);
  }
  return last;
}

/**
 * Executes every step of a Relay quote in order. Steps are generic: an
 * approval, a deposit on EVM, a Solana deposit, or a permit signature.
 */
export async function executeQuote(quote: RelayQuote, ctx: ExecutionContext) {
  const steps = quote.steps.filter((s) => s.items.some((i) => i.status !== 'complete'));
  let requestId: string | undefined;
  // Once a deposit is broadcast, only a known on-chain failure ends the flow;
  // anything else (RPC hiccups, timeouts) falls through to status polling.
  let deposited = false;

  try {
    for (const [index, step] of steps.entries()) {
      requestId = step.requestId ?? requestId;
      ctx.onEvent({ type: 'step', stepId: step.id, description: step.description, index, total: steps.length });

      for (const item of step.items) {
        if (item.status === 'complete') continue;
        ctx.onEvent({ type: 'awaiting_signature', stepId: step.id });

        if (step.kind === 'signature' && isSignatureData(item.data)) {
          await handleSignature(ctx, item.data);
          continue;
        }

        if (isSvmData(item.data)) {
          const sig = await sendSvm(ctx, item.data);
          deposited = true;
          ctx.onEvent({ type: 'submitted', stepId: step.id, txHash: sig, chainId: 792703809, requestId });
          await confirmSvm(ctx, sig);
          ctx.onEvent({ type: 'confirmed', stepId: step.id, txHash: sig });
        } else {
          const data = item.data as EvmTxData;
          const hash = await sendEvm(ctx, data);
          if (step.id === 'deposit') deposited = true;
          ctx.onEvent({ type: 'submitted', stepId: step.id, txHash: hash, chainId: data.chainId, requestId });
          await confirmEvm(ctx, hash, data.chainId);
          ctx.onEvent({ type: 'confirmed', stepId: step.id, txHash: hash });
        }
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    if (isUserRejection(err)) throw new UserRejectedError();
    if (!deposited || !requestId || err instanceof OnChainError) throw err;
  }

  if (!requestId) {
    const status: RelayStatusResponse = { status: 'success' };
    ctx.onEvent({ type: 'done', status });
    return status;
  }

  const final = await pollUntilFinal(
    requestId,
    (s) => ctx.onEvent({ type: 'relaying', requestId: requestId!, status: s.status }),
    ctx.signal,
  );
  ctx.onEvent({ type: 'done', requestId, status: final });
  return final;
}
