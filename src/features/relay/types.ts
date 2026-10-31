/** Subset of the Relay /quote/v2 response that eroFi relies on. */

export interface RelayCurrency {
  chainId: number;
  address: string;
  symbol: string;
  name?: string;
  decimals: number;
  metadata?: { logoURI?: string };
}

export interface RelayAmount {
  currency: RelayCurrency;
  amount: string;
  amountFormatted?: string;
  amountUsd?: string;
  minimumAmount?: string;
}

export interface SvmInstruction {
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  programId: string;
  data: string; // hex
}

export interface EvmTxData {
  from: string;
  to: string;
  data: string;
  value?: string;
  chainId: number;
  gas?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface SvmTxData {
  instructions: SvmInstruction[];
  addressLookupTableAddresses?: string[];
}

export interface SignatureData {
  sign: {
    signatureKind: 'eip191' | 'eip712';
    message?: string;
    domain?: Record<string, unknown>;
    types?: Record<string, { name: string; type: string }[]>;
    value?: Record<string, unknown>;
    primaryType?: string;
  };
  post?: { endpoint: string; method: string; body: Record<string, unknown> };
}

export interface RelayStepItem {
  status: 'incomplete' | 'complete';
  data: EvmTxData | SvmTxData | SignatureData;
  check?: { endpoint: string; method: string };
}

export interface RelayStep {
  id: string; // e.g. "approve" | "deposit" | "authorize"
  action: string;
  description: string;
  kind: 'transaction' | 'signature';
  requestId?: string;
  items: RelayStepItem[];
}

export interface RelayFee {
  amount?: string;
  amountFormatted?: string;
  amountUsd?: string;
  currency?: RelayCurrency;
}

export interface RelayQuote {
  steps: RelayStep[];
  fees?: { gas?: RelayFee; relayer?: RelayFee; relayerGas?: RelayFee; relayerService?: RelayFee; app?: RelayFee };
  details?: {
    operation?: string;
    sender?: string;
    recipient?: string;
    currencyIn?: RelayAmount;
    currencyOut?: RelayAmount;
    totalImpact?: { usd?: string; percent?: string };
    rate?: string;
    timeEstimate?: number;
  };
}

export type RelayIntentStatus = 'waiting' | 'depositing' | 'pending' | 'success' | 'refund' | 'failure';

export interface RelayStatusResponse {
  status: RelayIntentStatus;
  inTxHashes?: string[];
  txHashes?: string[];
  updatedAt?: number;
  originChainId?: number;
  destinationChainId?: number;
}

export const isSvmData = (d: RelayStepItem['data']): d is SvmTxData =>
  Array.isArray((d as SvmTxData).instructions);

export const isSignatureData = (d: RelayStepItem['data']): d is SignatureData =>
  typeof (d as SignatureData).sign === 'object';
