/**
 * Single source of truth for every chain and token eroFi supports.
 *
 * Chain IDs follow Relay's convention: EVM chains use their normal chain ID,
 * Solana uses Relay's custom ID 792703809 and TRON 728126428.
 *
 * TRON is destination-only: no TRON wallet is wired up, so users paste a
 * TRON recipient address and always send from Solana or EVM.
 *
 * The token list below is a curated default. Route availability is always
 * confirmed at runtime by the Relay quote — if Relay can't route a pair, the
 * quote fails and the UI says so.
 */

export type ChainVm = 'evm' | 'svm' | 'tvm';

export interface LugiaChain {
  /** Relay chain id */
  id: number;
  name: string;
  short: string;
  vm: ChainVm;
  /** Reown AppKit CAIP-2 network id, used to switch networks */
  caipNetworkId: string;
  nativeSymbol: string;
  explorerTx: (hash: string) => string;
  explorerAddress: (address: string) => string;
  /** Fallback monogram colour when the chain icon fails to load */
  tint: string;
}

export interface LugiaToken {
  chainId: number;
  /** Contract / mint address. Native assets use Relay's sentinel. */
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
}

export const SOLANA_RELAY_CHAIN_ID = 792703809;
export const EVM_NATIVE = '0x0000000000000000000000000000000000000000';
export const SOL_NATIVE = '11111111111111111111111111111111';
export const TRON_RELAY_CHAIN_ID = 728126428;
/** Relay's sentinel address for native TRX */
export const TRX_NATIVE = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';

const evmExplorer = (base: string) => ({
  explorerTx: (h: string) => `${base}/tx/${h}`,
  explorerAddress: (a: string) => `${base}/address/${a}`,
});

export const CHAINS: LugiaChain[] = [
  {
    id: SOLANA_RELAY_CHAIN_ID,
    name: 'Solana',
    short: 'SOL',
    vm: 'svm',
    caipNetworkId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    nativeSymbol: 'SOL',
    explorerTx: (h) => `https://solscan.io/tx/${h}`,
    explorerAddress: (a) => `https://solscan.io/account/${a}`,
    tint: '#14F195',
  },
  {
    id: 1,
    name: 'Ethereum',
    short: 'ETH',
    vm: 'evm',
    caipNetworkId: 'eip155:1',
    nativeSymbol: 'ETH',
    ...evmExplorer('https://etherscan.io'),
    tint: '#8A92B2',
  },
  {
    id: 56,
    name: 'BNB Chain',
    short: 'BNB',
    vm: 'evm',
    caipNetworkId: 'eip155:56',
    nativeSymbol: 'BNB',
    ...evmExplorer('https://bscscan.com'),
    tint: '#F0B90B',
  },
  {
    id: 8453,
    name: 'Base',
    short: 'BASE',
    vm: 'evm',
    caipNetworkId: 'eip155:8453',
    nativeSymbol: 'ETH',
    ...evmExplorer('https://basescan.org'),
    tint: '#0052FF',
  },
  {
    id: 42161,
    name: 'Arbitrum',
    short: 'ARB',
    vm: 'evm',
    caipNetworkId: 'eip155:42161',
    nativeSymbol: 'ETH',
    ...evmExplorer('https://arbiscan.io'),
    tint: '#28A0F0',
  },
  {
    id: 10,
    name: 'Optimism',
    short: 'OP',
    vm: 'evm',
    caipNetworkId: 'eip155:10',
    nativeSymbol: 'ETH',
    ...evmExplorer('https://optimistic.etherscan.io'),
    tint: '#FF0420',
  },
  {
    id: 137,
    name: 'Polygon',
    short: 'POL',
    vm: 'evm',
    caipNetworkId: 'eip155:137',
    nativeSymbol: 'POL',
    ...evmExplorer('https://polygonscan.com'),
    tint: '#8247E5',
  },
  {
    id: TRON_RELAY_CHAIN_ID,
    name: 'TRON',
    short: 'TRX',
    vm: 'tvm',
    caipNetworkId: 'tron:0x2b6653dc',
    nativeSymbol: 'TRX',
    explorerTx: (h) => `https://tronscan.org/#/transaction/${h.replace(/^0x/, '')}`,
    explorerAddress: (a) => `https://tronscan.org/#/address/${a}`,
    tint: '#FF060A',
  },
];

/** Chains that can only receive: there is no wallet to send from them. */
export const RECEIVE_ONLY_CHAIN_IDS = [TRON_RELAY_CHAIN_ID];

export const TOKENS: LugiaToken[] = [
  // Solana
  { chainId: SOLANA_RELAY_CHAIN_ID, address: SOL_NATIVE, symbol: 'SOL', name: 'Solana', decimals: 9, isNative: true },
  { chainId: SOLANA_RELAY_CHAIN_ID, address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { chainId: SOLANA_RELAY_CHAIN_ID, address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether USD', decimals: 6 },

  // Ethereum
  { chainId: 1, address: EVM_NATIVE, symbol: 'ETH', name: 'Ether', decimals: 18, isNative: true },
  { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { chainId: 1, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },

  // BNB Chain (note: USDC/USDT use 18 decimals on BSC)
  { chainId: 56, address: EVM_NATIVE, symbol: 'BNB', name: 'BNB', decimals: 18, isNative: true },
  { chainId: 56, address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
  { chainId: 56, address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },

  // Base
  { chainId: 8453, address: EVM_NATIVE, symbol: 'ETH', name: 'Ether', decimals: 18, isNative: true },
  { chainId: 8453, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },

  // Arbitrum
  { chainId: 42161, address: EVM_NATIVE, symbol: 'ETH', name: 'Ether', decimals: 18, isNative: true },
  { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { chainId: 42161, address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },

  // Optimism
  { chainId: 10, address: EVM_NATIVE, symbol: 'ETH', name: 'Ether', decimals: 18, isNative: true },
  { chainId: 10, address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { chainId: 10, address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 },

  // Polygon
  { chainId: 137, address: EVM_NATIVE, symbol: 'POL', name: 'Polygon', decimals: 18, isNative: true },
  { chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { chainId: 137, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },

  // TRON (receive only)
  { chainId: TRON_RELAY_CHAIN_ID, address: TRX_NATIVE, symbol: 'TRX', name: 'TRON', decimals: 6, isNative: true },
  { chainId: TRON_RELAY_CHAIN_ID, address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
];

export const getChain = (id: number): LugiaChain => {
  const chain = CHAINS.find((c) => c.id === id);
  if (!chain) throw new Error(`Unsupported chain ${id}`);
  return chain;
};

export const tokensFor = (chainId: number) => TOKENS.filter((t) => t.chainId === chainId);

export const findToken = (chainId: number, address: string) =>
  TOKENS.find((t) => t.chainId === chainId && t.address.toLowerCase() === address.toLowerCase());

export const isSupportedChain = (id: number) => CHAINS.some((c) => c.id === id);

/** Chain icons bundled in public/chains; ChainIcon falls back to a monogram on error. */
export const chainIconUrl = (id: number) => `/chains/${id}.png`;

/** Token logos bundled in public/tokens. */
const TOKEN_LOGOS: Record<string, string> = {
  SOL: '/tokens/sol.png',
  ETH: '/tokens/eth.png',
  BNB: '/tokens/bnb.png',
  POL: '/tokens/pol.png',
  USDC: '/tokens/usdc.png',
  USDT: '/tokens/usdt.png',
  TRX: '/tokens/trx.png',
};

export const tokenLogoUrl = (symbol: string): string | undefined => TOKEN_LOGOS[symbol.toUpperCase()];
