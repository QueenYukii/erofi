'use client';

import { useQuery } from '@tanstack/react-query';
import { PublicKey, type Connection } from '@solana/web3.js';
import { erc20Abi, type Hex } from 'viem';
import { getBalance, readContract } from 'wagmi/actions';
import { wagmiConfig } from '@/config/appkit';
import { getChain, type LugiaToken } from '@/config/chains';

async function solanaBalance(connection: Connection, owner: string, token: LugiaToken): Promise<bigint> {
  const ownerKey = new PublicKey(owner);
  if (token.isNative) return BigInt(await connection.getBalance(ownerKey, 'confirmed'));
  const res = await connection.getParsedTokenAccountsByOwner(ownerKey, { mint: new PublicKey(token.address) });
  return res.value.reduce((sum, acc) => {
    const amount = (acc.account.data as { parsed?: { info?: { tokenAmount?: { amount?: string } } } }).parsed?.info
      ?.tokenAmount?.amount;
    return sum + BigInt(amount ?? '0');
  }, 0n);
}

async function evmBalance(owner: string, token: LugiaToken): Promise<bigint> {
  if (token.isNative) {
    const b = await getBalance(wagmiConfig, { address: owner as Hex, chainId: token.chainId as never });
    return b.value;
  }
  return readContract(wagmiConfig, {
    address: token.address as Hex,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [owner as Hex],
    chainId: token.chainId as never,
  });
}

export function useAssetBalance(token: LugiaToken, owner?: string, connection?: Connection) {
  const vm = getChain(token.chainId).vm;
  return useQuery({
    queryKey: ['balance', token.chainId, token.address, owner],
    enabled: Boolean(owner) && (vm === 'evm' || Boolean(connection)),
    refetchInterval: 20_000,
    queryFn: () => (vm === 'svm' ? solanaBalance(connection!, owner!, token) : evmBalance(owner!, token)),
  });
}
