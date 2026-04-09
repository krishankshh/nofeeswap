import { useState, useEffect, useCallback } from 'react';
import { Contract, formatEther } from 'ethers';
import { useWallet } from './useWallet';

export function useTokenBalance(tokenContract: Contract | null) {
  const { address } = useWallet();
  const [balance, setBalance] = useState('0');
  const [rawBalance, setRawBalance] = useState(0n);
  const [allowance, setAllowance] = useState(0n);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!tokenContract || !address) return;
    setLoading(true);
    try {
      const bal = await tokenContract.balanceOf(address);
      setRawBalance(bal);
      setBalance(formatEther(bal));
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setLoading(false);
    }
  }, [tokenContract, address]);

  const fetchAllowance = useCallback(async (spender: string) => {
    if (!tokenContract || !address) return 0n;
    try {
      const a = await tokenContract.allowance(address, spender);
      setAllowance(a);
      return a;
    } catch {
      return 0n;
    }
  }, [tokenContract, address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    rawBalance,
    allowance,
    loading,
    refetch: fetchBalance,
    fetchAllowance,
  };
}
