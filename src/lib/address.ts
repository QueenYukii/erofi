import { isAddress } from 'viem';
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

export const isValidAddressFor = (vm: ChainVm, value: string) =>
  vm === 'svm' ? isValidSolanaAddress(value) : isValidEvmAddress(value);

/**
 * Placeholder addresses used only to fetch an *indicative* quote before a
 * wallet is connected. They never receive funds: execution always requires
 * the real connected address and a user-confirmed recipient.
 */
export const PREVIEW_ADDRESS: Record<ChainVm, string> = {
  evm: '0x000000000000000000000000000000000000dEaD',
  svm: 'GTtzwxqy67xx9DVESJjx28TgXqpc8xTqtiytgNMaQBTE',
};
