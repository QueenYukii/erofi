import { formatUnits } from 'viem';

export const truncateAddress = (address?: string, lead = 4, tail = 4) => {
  if (!address) return '';
  if (address.length <= lead + tail + 1) return address;
  const start = address.startsWith('0x') ? lead + 2 : lead;
  return `${address.slice(0, start)}…${address.slice(-tail)}`;
};

/** Format a raw bigint amount with a sensible number of significant digits. */
export const formatTokenAmount = (raw: bigint | undefined, decimals: number, maxFraction = 6) => {
  if (raw === undefined) return '—';
  return formatDecimalString(formatUnits(raw, decimals), maxFraction);
};

export const formatDecimalString = (value: string | number | undefined, maxFraction = 6) => {
  if (value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (n === 0) return '0';
  if (Math.abs(n) < 10 ** -maxFraction) return `<${(10 ** -maxFraction).toFixed(maxFraction)}`;
  const fraction = Math.abs(n) >= 1000 ? 2 : Math.abs(n) >= 1 ? 4 : maxFraction;
  return n.toLocaleString('en-US', { maximumFractionDigits: fraction });
};

export const formatUsd = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n > 0 && n < 0.01) return '<$0.01';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
};

export const formatSeconds = (s?: number) => {
  if (s === undefined || s === null) return '—';
  if (s < 60) return `~${Math.max(1, Math.round(s))}s`;
  return `~${Math.round(s / 60)} min`;
};

/** Keep only digits and one decimal separator, capped to `decimals` places. */
export const sanitizeAmountInput = (input: string, decimals: number) => {
  let v = input.replace(',', '.').replace(/[^\d.]/g, '');
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
    const [int, frac = ''] = v.split('.');
    v = `${int}.${frac.slice(0, decimals)}`;
  }
  if (v.startsWith('.')) v = `0${v}`;
  return v;
};
