import { ethers, WebSocketProvider, JsonRpcProvider, Wallet, Contract, formatEther, parseEther } from "ethers";
import { decodeSwapCalldata, SwapParams } from "./decoder";
import { calculateSandwichProfit, SandwichResult } from "./profitability";

// ─── Configuration ───
const RPC_URL = "http://127.0.0.1:8545";
const WS_URL = "ws://127.0.0.1:8545";
const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const TOKEN_A_ADDRESS = process.env.TOKEN_A_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const TOKEN_B_ADDRESS = process.env.TOKEN_B_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Bot uses Hardhat account #1 (not the deployer)
const BOT_PRIVATE_KEY = process.env.BOT_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

// ─── ABI Fragment ───
const OPERATOR_ABI = [
  "function swap(bytes32 poolId, bool zeroForOne, uint256 amountIn, uint256 minAmountOut, uint256 slippageBps) external returns (uint256)",
  "function quoteSwap(bytes32 poolId, bool zeroForOne, uint256 amountIn) external view returns (uint256 amountOut, uint256 priceImpactBps)",
  "function getPoolId(address tokenA, address tokenB, uint24 feeBps) external pure returns (bytes32)",
  "event SwapExecuted(bytes32 indexed poolId, address indexed trader, bool zeroForOne, uint256 amountIn, uint256 amountOut, uint256 minAmountOut, uint256 slippageBps)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
];

// ─── Logging ───
const banner = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🥪 NoFeeSwap Sandwich Attack Bot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

function log(category: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `[${timestamp}] [${category.padEnd(10)}]`;
  console.log(`${prefix} ${message}`);
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      console.log(`${"".padStart(26)} ${key}: ${value}`);
    });
  }
}

// ─── Main ───
async function main() {
  console.log(banner);

  // Setup provider & wallet
  const httpProvider = new JsonRpcProvider(RPC_URL);
  const botWallet = new Wallet(BOT_PRIVATE_KEY, httpProvider);

  log("INIT", `Bot address: ${botWallet.address}`);
  const botBalance = await httpProvider.getBalance(botWallet.address);
  log("INIT", `Bot ETH balance: ${formatEther(botBalance)} ETH`);

  // Setup contracts
  const operator = new Contract(OPERATOR_ADDRESS, OPERATOR_ABI, botWallet);
  const tokenA = new Contract(TOKEN_A_ADDRESS, ERC20_ABI, botWallet);
  const tokenB = new Contract(TOKEN_B_ADDRESS, ERC20_ABI, botWallet);

  // Get pool ID
  let poolId: string;
  try {
    poolId = await operator.getPoolId(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, 30);
    log("INIT", `Default pool ID: ${poolId}`);
  } catch (e) {
    log("ERROR", "Failed to get pool ID. Is the contract deployed?");
    process.exit(1);
  }

  // Ensure automine is enabled for setup phase (previous runs may have left interval mining)
  try {
    await httpProvider.send("evm_setAutomine", [true]);
  } catch {}

  // Check token balances & mint if needed
  let balA = await tokenA.balanceOf(botWallet.address);
  let balB = await tokenB.balanceOf(botWallet.address);
  log("INIT", `Token balances: ${formatEther(balA)} NFSA, ${formatEther(balB)} NFSB`);

  if (balA === 0n || balB === 0n) {
    log("INIT", "Bot has no tokens, minting 100,000 of each...");
    const mintAmount = parseEther("100000");
    try {
      await (await tokenA.mint(botWallet.address, mintAmount)).wait();
      await (await tokenB.mint(botWallet.address, mintAmount)).wait();
      balA = await tokenA.balanceOf(botWallet.address);
      balB = await tokenB.balanceOf(botWallet.address);
      log("INIT", `✓ Minted. New balances: ${formatEther(balA)} NFSA, ${formatEther(balB)} NFSB`);
    } catch (e) {
      log("WARN", `Could not mint tokens: ${(e as Error).message?.slice(0, 80)}`);
      log("WARN", "Bot will still monitor mempool but cannot execute sandwiches");
    }
  }

  // Approve max tokens for operator
  log("INIT", "Approving tokens for operator...");
  try {
    await (await tokenA.approve(OPERATOR_ADDRESS, ethers.MaxUint256)).wait();
    await (await tokenB.approve(OPERATOR_ADDRESS, ethers.MaxUint256)).wait();
    log("INIT", "✓ Tokens approved");
  } catch (e) {
    log("WARN", `Approval failed: ${(e as Error).message?.slice(0, 80)}`);
  }

  // Configure mempool simulation
  // Hardhat auto-mines by default. We switch to interval mining for realistic mempool.
  log("INIT", "Configuring interval mining (5s blocks)...");
  try {
    await httpProvider.send("evm_setAutomine", [false]);
    await httpProvider.send("evm_setIntervalMining", [5000]);
    log("INIT", "✓ Interval mining enabled (5 second blocks)");
  } catch {
    log("WARN", "Could not set mining mode. Auto-mine may interfere with sandwich.");
  }

  // ─── Monitor Pending Transactions ───
  log("MONITOR", "Listening for pending transactions...");
  log("MONITOR", `Target contract: ${OPERATOR_ADDRESS}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let txCount = 0;
  let sandwichCount = 0;

  // Poll pending transactions
  const pollPending = async () => {
    try {
      const pendingBlock = await httpProvider.send("eth_getBlockByNumber", ["pending", true]);
      if (!pendingBlock?.transactions) return;

      for (const tx of pendingBlock.transactions) {
        if (typeof tx === "string") continue; // Skip hash-only entries
        
        // Filter for operator contract interactions
        if (tx.to?.toLowerCase() !== OPERATOR_ADDRESS.toLowerCase()) continue;

        txCount++;
        log("DETECT", `🎯 Pending tx to operator: ${tx.hash}`);
        log("DETECT", `   From: ${tx.from}`);
        log("DETECT", `   Gas Price: ${tx.gasPrice ? parseInt(tx.gasPrice, 16) : 'N/A'}`);

        // Skip our own transactions
        if (tx.from.toLowerCase() === botWallet.address.toLowerCase()) {
          log("SKIP", "Ignoring own transaction");
          continue;
        }

        // Decode calldata
        const swapParams = decodeSwapCalldata(tx.data);
        if (!swapParams) {
          log("DECODE", "Not a swap transaction, skipping");
          continue;
        }

        log("DECODE", "📋 Decoded swap parameters:", {
          poolId: swapParams.poolId,
          direction: swapParams.zeroForOne ? "NFSA → NFSB" : "NFSB → NFSA",
          amountIn: formatEther(swapParams.amountIn),
          minAmountOut: formatEther(swapParams.minAmountOut),
          slippageBps: swapParams.slippageBps.toString(),
        });

        // Calculate profitability
        const sandwichResult = calculateSandwichProfit(swapParams);

        if (sandwichResult.isProfitable) {
          log("SANDWICH", "💰 Profitable sandwich opportunity found!");
          log("SANDWICH", `   Front-run amount: ${formatEther(sandwichResult.frontRunAmount)}`);
          log("SANDWICH", `   Expected profit: ${formatEther(sandwichResult.estimatedProfit)}`);

          try {
            // ─── Step 1: Front-run ───
            log("EXECUTE", "⚡ Submitting front-run transaction...");
            const frontRunTx = await operator.swap(
              swapParams.poolId,
              swapParams.zeroForOne,
              sandwichResult.frontRunAmount,
              0n, // No min out for front-run
              1000, // 10% slippage tolerance
              { gasPrice: BigInt(tx.gasPrice ? parseInt(tx.gasPrice, 16) : 20000000000) + 1000000000n }
            );
            log("EXECUTE", `   Front-run tx: ${frontRunTx.hash}`);

            // ─── Step 2: Wait for victim tx ───
            log("EXECUTE", "⏳ Waiting for victim transaction to be mined...");
            
            // Mine a block to process both
            await httpProvider.send("evm_mine", []);

            await frontRunTx.wait();
            log("EXECUTE", "   ✓ Front-run confirmed");

            // ─── Step 3: Back-run ───
            log("EXECUTE", "⚡ Submitting back-run transaction...");
            const backRunTx = await operator.swap(
              swapParams.poolId,
              !swapParams.zeroForOne, // Opposite direction
              sandwichResult.backRunAmount,
              0n,
              1000,
            );
            
            await httpProvider.send("evm_mine", []);
            await backRunTx.wait();
            log("EXECUTE", `   Back-run tx: ${backRunTx.hash}`);
            log("EXECUTE", "   ✓ Back-run confirmed");

            sandwichCount++;
            log("PROFIT", `🥪 Sandwich #${sandwichCount} complete!`, {
              estimatedProfit: formatEther(sandwichResult.estimatedProfit),
              totalSandwiches: sandwichCount.toString(),
            });
          } catch (err) {
            log("ERROR", `Sandwich execution failed: ${(err as Error).message}`);
          }
        } else {
          log("SKIP", `Not profitable (estimated profit: ${formatEther(sandwichResult.estimatedProfit)})`);
        }
      }
    } catch (err) {
      // Silence polling errors
    }
  };

  // Poll every 1 second
  setInterval(pollPending, 1000);

  // Also listen for swap events for logging
  operator.on("SwapExecuted", (poolId, trader, zeroForOne, amountIn, amountOut) => {
    log("EVENT", `Swap executed: ${formatEther(amountIn)} → ${formatEther(amountOut)}`, {
      trader,
      direction: zeroForOne ? "NFSA → NFSB" : "NFSB → NFSA",
    });
  });

  // Keep alive
  log("BOT", "Bot running. Press Ctrl+C to stop.\n");
  process.on("SIGINT", async () => {
    console.log("\n");
    log("SHUTDOWN", "Shutting down...");
    log("STATS", `Total transactions monitored: ${txCount}`);
    log("STATS", `Total sandwiches executed: ${sandwichCount}`);
    
    // Restore auto-mine
    try {
      await httpProvider.send("evm_setAutomine", [true]);
      log("SHUTDOWN", "Restored auto-mining");
    } catch {}
    
    process.exit(0);
  });
}

main().catch(console.error);
