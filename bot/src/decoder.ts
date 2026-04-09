import { ethers } from "ethers";

export interface SwapParams {
  poolId: string;
  zeroForOne: boolean;
  amountIn: bigint;
  minAmountOut: bigint;
  slippageBps: bigint;
}

// Swap function selector: swap(bytes32,bool,uint256,uint256,uint256)
const SWAP_SELECTOR = ethers.id("swap(bytes32,bool,uint256,uint256,uint256)").slice(0, 10);

const swapInterface = new ethers.Interface([
  "function swap(bytes32 poolId, bool zeroForOne, uint256 amountIn, uint256 minAmountOut, uint256 slippageBps)",
]);

/**
 * Decodes swap calldata from a raw transaction.
 * Returns null if the transaction is not a swap.
 */
export function decodeSwapCalldata(data: string): SwapParams | null {
  if (!data || data.length < 10) return null;

  const selector = data.slice(0, 10);
  if (selector !== SWAP_SELECTOR) return null;

  try {
    const decoded = swapInterface.decodeFunctionData("swap", data);
    return {
      poolId: decoded[0],
      zeroForOne: decoded[1],
      amountIn: decoded[2],
      minAmountOut: decoded[3],
      slippageBps: decoded[4],
    };
  } catch {
    return null;
  }
}

/**
 * Checks if a transaction's calldata targets the swap function.
 */
export function isSwapTransaction(data: string): boolean {
  if (!data || data.length < 10) return false;
  return data.slice(0, 10) === SWAP_SELECTOR;
}
