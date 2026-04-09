import { SwapParams } from "./decoder";

export interface SandwichResult {
  isProfitable: boolean;
  frontRunAmount: bigint;
  backRunAmount: bigint;
  estimatedProfit: bigint;
  priceImpact: number;
}

// Minimum profitability threshold (in wei)
const MIN_PROFIT_WEI = 1000000000000000n; // 0.001 tokens

// Front-run sizing: use a fraction of the victim's trade
const FRONT_RUN_RATIO = 50n; // 50% of victim's trade size

/**
 * Calculates whether a sandwich attack is profitable for a given swap.
 *
 * Simplified model for demonstration:
 * 1. Front-run: Trade in the same direction as victim, moving the price
 * 2. Victim's trade executes at a worse price (within their slippage)
 * 3. Back-run: Trade in opposite direction at the now-favorable price
 *
 * The profit comes from the price difference introduced by the front-run.
 *
 * In a constant product AMM (x * y = k):
 *   - Price impact ≈ amountIn / reserve
 *   - Profit ≈ frontRunAmount * priceImpact / 2
 */
export function calculateSandwichProfit(victimSwap: SwapParams): SandwichResult {
  const { amountIn, slippageBps } = victimSwap;

  // Minimum trade size to be worth attacking (> 0.1 tokens)
  if (amountIn < 100000000000000000n) { // 0.1 ETH
    return {
      isProfitable: false,
      frontRunAmount: 0n,
      backRunAmount: 0n,
      estimatedProfit: 0n,
      priceImpact: 0,
    };
  }

  // Calculate front-run size (fraction of victim's trade)
  const frontRunAmount = (amountIn * FRONT_RUN_RATIO) / 100n;

  // Estimate the slippage window we can exploit
  // The victim accepts up to slippageBps of price movement
  const exploitableBps = slippageBps > 0n ? slippageBps : 50n;

  // Simplified profit estimation:
  // Profit ≈ frontRunAmount * exploitable_slippage / 2
  // The /2 accounts for the spread between front-run and back-run prices
  const estimatedProfit = (frontRunAmount * exploitableBps) / 20000n;

  // Back-run amount is approximately the front-run amount plus profit
  const backRunAmount = frontRunAmount;

  // Price impact estimate (for logging)
  const priceImpact = Number(exploitableBps) / 100;

  const isProfitable = estimatedProfit > MIN_PROFIT_WEI;

  return {
    isProfitable,
    frontRunAmount,
    backRunAmount,
    estimatedProfit,
    priceImpact,
  };
}

/**
 * Calculates the optimal front-run amount using a simple heuristic.
 * In a real MEV bot, this would use binary search against actual pool state.
 */
export function calculateOptimalFrontRun(
  victimAmount: bigint,
  victimSlippageBps: bigint,
  poolReserve: bigint
): bigint {
  // Optimal front-run ~ sqrt(victimAmount * reserve * slippage / 10000)
  // Simplified: use a fixed ratio
  const rawAmount = (victimAmount * victimSlippageBps) / 10000n;
  // Cap at victim's amount to avoid excessive risk
  return rawAmount < victimAmount ? rawAmount : victimAmount;
}
