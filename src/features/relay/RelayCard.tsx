'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDownUp, CheckCircle2, Info, Pencil, Wallet } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { wagmiConfig } from '@/config/appkit';
import { findToken, getChain, SOLANA_RELAY_CHAIN_ID, tokensFor, type LugiaToken } from '@/config/chains';
import { PREVIEW_ADDRESS, isValidAddressFor } from '@/lib/address';
import { formatDecimalString, formatTokenAmount, formatUsd, sanitizeAmountInput, truncateAddress } from '@/lib/format';
import { AssetSelect } from './AssetSelect';
import { QuoteDetails } from './QuoteDetails';
import { ProgressPanel, type ProgressStep } from './ProgressPanel';
import { useWallets } from './useWallets';
import { useAssetBalance } from './useAssetBalance';
import { useQuote } from './useQuote';
import { executeQuote, UserRejectedError, type ExecutionEvent } from './executor';
import { upsertActivity } from './activity';
import type { RelayQuote } from './types';

type Phase = 'idle' | 'running' | 'success' | 'refund' | 'error' | 'rejected';

const DEFAULT_FROM = findToken(SOLANA_RELAY_CHAIN_ID, '11111111111111111111111111111111')!;
const DEFAULT_TO = tokensFor(1)[0];

/** Keep a little native gas behind when the user hits Max. */
const nativeReserve = (t: LugiaToken): bigint => {
  if (!t.isNative) return 0n;
  return t.chainId === SOLANA_RELAY_CHAIN_ID ? 10_000_000n /* 0.01 SOL */ : parseUnits('0.002', t.decimals);
};

const stepTitle = (id: string, fromToken: LugiaToken) => {
  const origin = getChain(fromToken.chainId).name;
  if (id === 'approve') return `Approve ${fromToken.symbol}`;
  if (id === 'authorize' || id === 'authorize1' || id === 'authorize2') return 'Sign authorization';
  if (id === 'deposit') return `Deposit on ${origin}`;
  if (id === 'swap') return `Swap on ${origin}`;
  return id.charAt(0).toUpperCase() + id.slice(1);
};

export function RelayCard() {
  const w = useWallets();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [from, setFrom] = useState<LugiaToken>(DEFAULT_FROM);
  const [to, setTo] = useState<LugiaToken>(DEFAULT_TO);
  const [amountInput, setAmountInput] = useState('');
  const [customRecipient, setCustomRecipient] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const fromChain = getChain(from.chainId);
  const toChain = getChain(to.chainId);

  // ── Addresses ────────────────────────────────────────────────
  const originAddress = mounted ? w.addressFor(fromChain.vm) : undefined;
  const autoRecipient = mounted ? w.addressFor(toChain.vm) : undefined;
  const recipient = customRecipient ?? autoRecipient ?? '';
  const recipientValid = recipient !== '' && isValidAddressFor(toChain.vm, recipient);
  const recipientError = customRecipient !== null && customRecipient !== '' && !recipientValid;

  // ── Amount & balance ─────────────────────────────────────────
  const amountRaw = useMemo(() => {
    if (!amountInput || Number(amountInput) === 0) return undefined;
    try {
      return parseUnits(amountInput, from.decimals);
    } catch {
      return undefined;
    }
  }, [amountInput, from.decimals]);

  const balance = useAssetBalance(from, originAddress, w.solana.connection);
  const insufficient = amountRaw !== undefined && balance.data !== undefined && amountRaw > balance.data;

  // ── Quote ────────────────────────────────────────────────────
  const isPreview = !originAddress || !recipientValid;
  const quote = useQuote(
    {
      user: originAddress ?? PREVIEW_ADDRESS[fromChain.vm],
      recipient: recipientValid ? recipient : PREVIEW_ADDRESS[toChain.vm],
      originChainId: from.chainId,
      destinationChainId: to.chainId,
      originCurrency: from.address,
      destinationCurrency: to.address,
      amount: amountRaw?.toString(),
    },
    phase !== 'running',
  );

  const out = quote.data?.details?.currencyOut;
  const sameAsset = from.chainId === to.chainId && from.address === to.address;

  // ── Handlers ─────────────────────────────────────────────────
  const resetResult = () => {
    if (phase !== 'running') {
      setPhase('idle');
      setProgress([]);
      setMessage(null);
    }
  };

  const flip = () => {
    setFrom(to);
    setTo(from);
    setCustomRecipient(null);
    setAmountInput('');
    resetResult();
  };

  const setMax = () => {
    if (balance.data === undefined) return;
    const max = balance.data - nativeReserve(from);
    setAmountInput(max > 0n ? formatUnits(max, from.decimals) : '0');
    resetResult();
  };

  const onEvent = (activityId: string) => (e: ExecutionEvent) => {
    setProgress((prev) => {
      const next = [...prev];
      const idx = (key: string) => next.findIndex((s) => s.key === key);
      if (e.type === 'awaiting_signature') {
        const i = idx(e.stepId);
        if (i !== -1) next[i] = { ...next[i], state: 'active', meta: 'Confirm in your wallet' };
      }
      if (e.type === 'submitted') {
        const i = idx(e.stepId);
        if (i !== -1) next[i] = { ...next[i], state: 'active', meta: 'Waiting for confirmation', txHash: e.txHash, chainId: e.chainId };
        if (e.stepId === 'deposit') upsertActivity({ id: activityId, originTx: e.txHash });
      }
      if (e.type === 'confirmed') {
        const i = idx(e.stepId);
        if (i !== -1) next[i] = { ...next[i], state: 'done', meta: 'Confirmed' };
      }
      if (e.type === 'relaying') {
        const i = idx('fill');
        const label =
          e.status === 'pending' || e.status === 'depositing'
            ? 'Solver is filling your transfer'
            : e.status === 'failure'
              ? 'Fill delayed — retrying'
              : 'Waiting for the deposit to be indexed';
        if (i !== -1) next[i] = { ...next[i], state: 'active', meta: label };
        upsertActivity({ id: activityId, requestId: e.requestId, status: e.status });
      }
      if (e.type === 'done') {
        const i = idx('fill');
        const destTx = e.status.txHashes?.[0];
        const ok = e.status.status === 'success';
        if (i !== -1)
          next[i] = {
            ...next[i],
            state: ok ? 'done' : 'error',
            meta: ok ? 'Delivered' : e.status.status === 'refund' ? 'Refunded to origin wallet' : 'Still processing — check activity',
            txHash: ok ? destTx : e.status.inTxHashes?.[0],
            chainId: ok ? to.chainId : from.chainId,
          };
        upsertActivity({ id: activityId, requestId: e.requestId, status: e.status.status, destinationTx: destTx });
      }
      return next;
    });
  };

  const execute = async () => {
    if (!originAddress || !recipientValid || !amountRaw) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('running');
    setMessage(null);

    // Always execute against a fresh quote.
    const fresh = await quote.refetch();
    const q: RelayQuote | undefined = fresh.data;
    if (!q || fresh.error) {
      setPhase('error');
      setMessage(fresh.error?.message ?? 'Quote expired. Please try again.');
      return;
    }

    const activityId = `local-${Date.now()}`;
    const outFormatted = q.details?.currencyOut?.amountFormatted;
    upsertActivity({
      id: activityId,
      createdAt: Date.now(),
      originChainId: from.chainId,
      destinationChainId: to.chainId,
      amountIn: amountInput,
      symbolIn: from.symbol,
      amountOut: outFormatted,
      symbolOut: to.symbol,
      recipient,
      status: 'submitting',
    });

    setProgress([
      ...q.steps
        .filter((s) => s.items.some((i) => i.status !== 'complete'))
        .map((s) => ({ key: s.id, title: stepTitle(s.id, from), state: 'pending' as const })),
      { key: 'fill', title: `Receive on ${toChain.name}`, state: 'pending' as const },
    ]);

    try {
      const final = await executeQuote(q, {
        wagmiConfig,
        solana:
          w.solana.connection && w.solana.signer && w.solana.address
            ? { connection: w.solana.connection, signer: w.solana.signer, address: w.solana.address }
            : undefined,
        onEvent: onEvent(activityId),
        signal: controller.signal,
      });
      setPhase(final.status === 'success' ? 'success' : final.status === 'refund' ? 'refund' : 'error');
      if (final.status !== 'success' && final.status !== 'refund') {
        setMessage('Your deposit is confirmed and the fill is still processing. Track it in Activity.');
      }
      setAmountInput('');
      qc.invalidateQueries({ queryKey: ['balance'] });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (err instanceof UserRejectedError) {
        setPhase('rejected');
        setMessage('Request cancelled in wallet. Nothing was sent.');
        upsertActivity({ id: activityId, status: 'rejected' });
      } else {
        setPhase('error');
        setMessage(err instanceof Error ? err.message : 'Something went wrong. Nothing was sent unless a transaction link is shown.');
        upsertActivity({ id: activityId, status: 'error' });
      }
      setProgress((prev) => prev.map((s) => (s.state === 'active' ? { ...s, state: 'error', meta: undefined } : s)));
    }
  };

  // ── CTA state machine ────────────────────────────────────────
  const cta = (() => {
    if (!mounted) return { label: 'Loading…', disabled: true };
    if (phase === 'running') return { label: 'Bridging…', disabled: true, busy: true };
    if (!originAddress)
      return { label: `Connect ${fromChain.vm === 'svm' ? 'Solana' : 'EVM'} wallet`, onClick: () => w.connect(fromChain.vm), icon: true };
    if (sameAsset) return { label: 'Choose a different destination', disabled: true };
    if (!amountRaw) return { label: 'Enter an amount', disabled: true };
    if (insufficient) return { label: `Insufficient ${from.symbol}`, disabled: true };
    if (!recipientValid) return { label: `Enter a recipient on ${toChain.name}`, disabled: true };
    if (quote.isDebouncing || quote.isLoading) return { label: 'Finding best route…', disabled: true, busy: true };
    if (quote.error) return { label: 'No route available', disabled: true };
    if (!quote.data) return { label: 'Enter an amount', disabled: true };
    return { label: `Bridge to ${toChain.name}`, onClick: execute };
  })();

  const disableInputs = phase === 'running';

  return (
    <section className="bridge-card" aria-labelledby="bridge-title">
      <div className="bridge-card__head">
        <h1 className="bridge-card__title" id="bridge-title">
          Bridge
        </h1>
        <span className="badge">
          <span className="live-dot" aria-hidden="true" style={{ width: 5, height: 5 }} /> Live routes
        </span>
      </div>

      <div className="bridge-card__body">
        {/* FROM */}
        <div className="leg">
          <div className="leg__top">
            <label htmlFor="amount-in">You send</label>
            {originAddress && (
              <span className="num">
                Balance:{' '}
                {balance.isLoading ? <span className="skeleton" style={{ width: 56 }} /> : formatTokenAmount(balance.data, from.decimals)}{' '}
                {from.symbol}
                {balance.data !== undefined && balance.data > 0n && (
                  <button type="button" className="link-btn" style={{ marginLeft: 8 }} onClick={setMax} disabled={disableInputs}>
                    Max
                  </button>
                )}
              </span>
            )}
          </div>
          <div className="leg__main">
            <input
              id="amount-in"
              className="amount-input"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amountInput}
              disabled={disableInputs}
              onChange={(e) => {
                setAmountInput(sanitizeAmountInput(e.target.value, from.decimals));
                resetResult();
              }}
              aria-describedby="amount-in-usd"
            />
            <AssetSelect
              label="Send from"
              value={from}
              onChange={(t) => {
                setFrom(t);
                setAmountInput('');
                resetResult();
              }}
            />
          </div>
          <div className="leg__bottom">
            <span id="amount-in-usd" className="num">
              {quote.data?.details?.currencyIn?.amountUsd ? formatUsd(quote.data.details.currencyIn.amountUsd) : ' '}
            </span>
            <span>{fromChain.name}</span>
          </div>
        </div>

        <div className="flip">
          <button type="button" onClick={flip} aria-label="Swap direction" disabled={disableInputs}>
            <ArrowDownUp aria-hidden="true" />
          </button>
        </div>

        {/* TO */}
        <div className="leg">
          <div className="leg__top">
            <span>You receive</span>
            <span className="num">{toChain.name}</span>
          </div>
          <div className="leg__main">
            <output className={`amount-output ${out ? '' : 'is-empty'}`} aria-live="polite">
              {quote.isFetching && !out ? <span className="skeleton" style={{ width: 120, height: 28 }} /> : out?.amountFormatted ? formatDecimalString(out.amountFormatted) : '0'}
            </output>
            <AssetSelect
              label="Receive on"
              value={to}
              onChange={(t) => {
                setTo(t);
                if (getChain(t.chainId).vm !== toChain.vm) setCustomRecipient(null);
                resetResult();
              }}
            />
          </div>
          <div className="leg__bottom">
            <span className="num">{out?.amountUsd ? formatUsd(out.amountUsd) : ' '}</span>
            <span>
              to{' '}
              {recipientValid ? (
                <span className="mono">{truncateAddress(recipient)}</span>
              ) : (
                <span style={{ color: 'var(--warn)' }}>recipient needed</span>
              )}
              <button
                type="button"
                className="link-btn"
                style={{ marginLeft: 8 }}
                onClick={() => setCustomRecipient(customRecipient === null ? autoRecipient ?? '' : null)}
                disabled={disableInputs}
                aria-expanded={customRecipient !== null}
                aria-controls="recipient-field"
              >
                <Pencil aria-hidden="true" style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }} />{' '}
                {customRecipient === null ? 'Edit' : 'Use wallet'}
              </button>
            </span>
          </div>
        </div>

        {/* Recipient */}
        {(customRecipient !== null || (mounted && !autoRecipient)) && (
          <div className="field" id="recipient-field" style={{ padding: '4px 4px 0' }}>
            <label className="field__label" htmlFor="recipient">
              <span>Recipient on {toChain.name}</span>
              {!autoRecipient && (
                <button type="button" className="link-btn" onClick={() => w.connect(toChain.vm)}>
                  Connect {toChain.vm === 'svm' ? 'Solana' : 'EVM'} wallet
                </button>
              )}
            </label>
            <input
              id="recipient"
              className="input"
              spellCheck={false}
              autoComplete="off"
              placeholder={toChain.vm === 'svm' ? 'Solana address' : '0x… address'}
              value={customRecipient ?? ''}
              disabled={disableInputs}
              aria-invalid={recipientError}
              aria-describedby="recipient-hint"
              onChange={(e) => setCustomRecipient(e.target.value.trim())}
            />
            {recipientError ? (
              <span className="field__error" id="recipient-hint" role="alert">
                That is not a valid {toChain.vm === 'svm' ? 'Solana' : 'EVM'} address.
              </span>
            ) : (
              <span className="field__hint" id="recipient-hint">
                Double-check this address. Transfers to the wrong address cannot be reversed.
              </span>
            )}
          </div>
        )}

        {/* Quote */}
        {quote.data && amountRaw && !sameAsset && (
          <QuoteDetails
            quote={quote.data}
            updatedAt={quote.dataUpdatedAt}
            isPreview={isPreview}
            symbolIn={from.symbol}
            symbolOut={to.symbol}
          />
        )}
        {quote.error && amountRaw && !quote.isFetching && (
          <div className="notice notice--warn" role="status">
            <AlertTriangle aria-hidden="true" />
            <span>{quote.error.message}</span>
          </div>
        )}

        {/* Progress */}
        {progress.length > 0 && (
          <div className="leg" style={{ paddingBottom: 0 }}>
            <ProgressPanel steps={progress} />
          </div>
        )}
        {phase === 'success' && (
          <div className="notice notice--info" role="status">
            <CheckCircle2 aria-hidden="true" style={{ color: 'var(--success)' }} />
            <span>
              Delivered to <span className="mono">{truncateAddress(recipient)}</span> on {toChain.name}.
            </span>
          </div>
        )}
        {message && phase !== 'success' && (
          <div className={`notice ${phase === 'error' ? 'notice--danger' : 'notice--info'}`} role={phase === 'error' ? 'alert' : 'status'}>
            <Info aria-hidden="true" />
            <span>{message}</span>
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary btn-lg btn-block"
          style={{ marginTop: 4 }}
          disabled={cta.disabled}
          onClick={cta.onClick}
          aria-busy={cta.busy || undefined}
        >
          {cta.busy && <span className="spinner" aria-hidden="true" />}
          {cta.icon && <Wallet aria-hidden="true" />}
          {cta.label}
        </button>
      </div>
    </section>
  );
}
