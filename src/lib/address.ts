import { isAddress, sha256 } from 'viem';
import { PublicKey } from '@solana/web3.js';
import type { ChainVm } from '@/config/chains';

export const isValidSolanaAddress = (value: string) => {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return false;
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
};

export const isValidEvmAddress = (value: string) => isAddress(value, { strict: false });

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const base58Decode = (value: string): Uint8Array | null => {
  let n = 0n;
  for (const ch of value) {
    const i = BASE58.indexOf(ch);
    if (i === -1) return null;
    n = n * 58n + BigInt(i);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n % 256n));
    n /= 256n;
  }
  for (const ch of value) {
    if (ch !== '1') break;
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
};

/** TRON base58check address: 0x41 prefix + 20-byte account + 4-byte double-SHA256 checksum. */
export const isValidTronAddress = (value: string) => {
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)) return false;
  const bytes = base58Decode(value);
  if (!bytes || bytes.length !== 25 || bytes[0] !== 0x41) return false;
  const payload = bytes.slice(0, 21);
  const checksum = sha256(sha256(payload, 'bytes'), 'bytes').slice(0, 4);
  return checksum.every((b, i) => b === bytes[21 + i]);
};

const crc16 = (data: Uint8Array) => {
  let crc = 0;
  for (const byte of data) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
};

/**
 * TON mainnet address: raw `0:<64 hex>` / `-1:<64 hex>`, or user-friendly
 * (EQ…/UQ…): base64(url) of tag + workchain + 32-byte hash + CRC16.
 * Testnet-flagged addresses are rejected.
 */
export const isValidTonAddress = (value: string) => {
  if (/^(0|-1):[0-9a-fA-F]{64}$/.test(value)) return true;
  if (!/^[A-Za-z0-9_+/-]{48}$/.test(value)) return false;
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }
  if (bytes.length !== 36) return false;
  const [tag, workchain] = bytes;
  if (tag !== 0x11 && tag !== 0x51) return false;
  if (workchain !== 0x00 && workchain !== 0xff) return false;
  const crc = crc16(bytes.slice(0, 34));
  return bytes[34] === crc >> 8 && bytes[35] === (crc & 0xff);
};

const VALIDATORS: Record<ChainVm, (value: string) => boolean> = {
  evm: isValidEvmAddress,
  svm: isValidSolanaAddress,
  tvm: isValidTronAddress,
  ton: isValidTonAddress,
};

export const isValidAddressFor = (vm: ChainVm, value: string) => VALIDATORS[vm](value);

/** Human name of each VM's address format, for labels and errors. */
export const VM_LABEL: Record<ChainVm, string> = { evm: 'EVM', svm: 'Solana', tvm: 'TRON', ton: 'TON' };

/**
 * Placeholder addresses used only to fetch an *indicative* quote before a
 * wallet is connected. They never receive funds: execution always requires
 * the real connected address and a user-confirmed recipient.
 */
export const PREVIEW_ADDRESS: Record<ChainVm, string> = {
  evm: '0x000000000000000000000000000000000000dEaD',
  svm: 'GTtzwxqy67xx9DVESJjx28TgXqpc8xTqtiytgNMaQBTE',
  // 0x41 + 0x1111…1111: a plain account (Relay rejects the TRX sentinel and blacklisted burn addresses)
  tvm: 'TBXSw8fM4jpQkGc6zZjsVABFpVN7UvXPdV',
  // Non-bounceable form of 0:1111…1111
  ton: 'UQAREREREREREREREREREREREREREREREREREREREREREbvW',
};
