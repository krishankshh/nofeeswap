import { useMemo } from 'react';
import { Contract } from 'ethers';
import { useWallet } from './useWallet';
import { CONTRACT_ADDRESSES, ABIS } from '../config/contracts';

export function useOperatorContract(): Contract | null {
  const { signer } = useWallet();
  return useMemo(() => {
    if (!signer) return null;
    return new Contract(CONTRACT_ADDRESSES.operator, ABIS.NofeeOperatorLike, signer);
  }, [signer]);
}

export function useTokenContract(address: string): Contract | null {
  const { signer } = useWallet();
  return useMemo(() => {
    if (!signer || !address) return null;
    return new Contract(address, ABIS.MockERC20, signer);
  }, [signer, address]);
}

export function useTokenContracts() {
  const tokenA = useTokenContract(CONTRACT_ADDRESSES.tokenA);
  const tokenB = useTokenContract(CONTRACT_ADDRESSES.tokenB);
  return { tokenA, tokenB };
}
