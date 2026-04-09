import { useState, useEffect, useCallback } from 'react';
import { useOperatorContract } from './useContract';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { formatEther } from 'ethers';

export interface PoolState {
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  feeBps: number;
  initialPriceX96: bigint;
  totalLiquidity: bigint;
  initialized: boolean;
}

export interface PositionState {
  liquidity: bigint;
  token0Share: bigint;
  token1Share: bigint;
}

export function usePool(poolId: string | null) {
  const operator = useOperatorContract();
  const [pool, setPool] = useState<PoolState | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPool = useCallback(async () => {
    if (!operator || !poolId) return;
    setLoading(true);
    try {
      const state = await operator.getPoolState(poolId);
      setPool({
        token0: state.token0,
        token1: state.token1,
        reserve0: state.reserve0,
        reserve1: state.reserve1,
        feeBps: Number(state.feeBps),
        initialPriceX96: state.initialPriceX96,
        totalLiquidity: state.totalLiquidity,
        initialized: state.initialized,
      });
    } catch (err) {
      console.error('Error fetching pool:', err);
    } finally {
      setLoading(false);
    }
  }, [operator, poolId]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  return { pool, loading, refetch: fetchPool };
}

export function usePosition(poolId: string | null) {
  const operator = useOperatorContract();
  const [position, setPosition] = useState<PositionState | null>(null);
  const { address } = useWalletFromOperator();

  const fetchPosition = useCallback(async () => {
    if (!operator || !poolId || !address) return;
    try {
      const pos = await operator.getPosition(poolId, address);
      setPosition({
        liquidity: pos.liquidity,
        token0Share: pos.token0Share,
        token1Share: pos.token1Share,
      });
    } catch (err) {
      console.error('Error fetching position:', err);
    }
  }, [operator, poolId, address]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!operator || !poolId || !address) return;
      try {
        const pos = await operator.getPosition(poolId, address);
        if (!cancelled) {
          setPosition({
            liquidity: pos.liquidity,
            token0Share: pos.token0Share,
            token1Share: pos.token1Share,
          });
        }
      } catch (err) {
        console.error('Error fetching position:', err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [operator, poolId, address]);

  return { position, refetch: fetchPosition };
}

function useWalletFromOperator() {
  // Inline to avoid circular deps - just read from window.ethereum
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: unknown) => {
        const accs = accounts as string[];
        if (accs.length > 0) setAddress(accs[0]);
      });
    }
  }, []);
  return { address };
}

export function usePoolId() {
  const operator = useOperatorContract();
  
  const getPoolId = useCallback(async (tokenA: string, tokenB: string, feeBps: number): Promise<string | null> => {
    if (!operator) return null;
    try {
      return await operator.getPoolId(tokenA, tokenB, feeBps);
    } catch {
      return null;
    }
  }, [operator]);

  const getDefaultPoolId = useCallback(async (): Promise<string | null> => {
    return getPoolId(
      CONTRACT_ADDRESSES.tokenA,
      CONTRACT_ADDRESSES.tokenB,
      30
    );
  }, [getPoolId]);

  return { getPoolId, getDefaultPoolId };
}

export function useQuoteSwap(poolId: string | null) {
  const operator = useOperatorContract();

  const getQuote = useCallback(async (
    zeroForOne: boolean,
    amountIn: bigint
  ): Promise<{ amountOut: bigint; priceImpactBps: bigint } | null> => {
    if (!operator || !poolId || amountIn <= 0n) return null;
    try {
      const [amountOut, priceImpactBps] = await operator.quoteSwap(poolId, zeroForOne, amountIn);
      return { amountOut, priceImpactBps };
    } catch {
      return null;
    }
  }, [operator, poolId]);

  return { getQuote };
}

export { formatEther };
