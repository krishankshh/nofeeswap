import { JsonRpcProvider, Wallet, Contract, parseEther, formatEther, Interface, TransactionResponse } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Default Hardhat Account #0

const provider = new JsonRpcProvider(RPC_URL);
const signer = new Wallet(BOT_PRIVATE_KEY, provider);

// Placeholder ABIs (In a real scenario, these would be the full contract ABIs)
const NOFEE_SWAP_ABI = [
  'function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data) external returns (int256 amount0, int256 amount1)'
];

const nofeeSwapInterface = new Interface(NOFEE_SWAP_ABI);

async function main() {
  console.log('--- NoFeeSwap Sandwich Bot Starting ---');
  console.log(`Monitoring RPC: ${RPC_URL}`);
  console.log(`Bot Address: ${signer.address}`);

  // Monitor the mempool for pending transactions
  // Note: On standard Hardhat nodes, 'pending' might not work without specific mining settings.
  // We use a periodic check or a subscription if supported by the node.
  
  provider.on('pending', async (txHash: string) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx || !tx.to) return;

      // Filter for transactions to our protocol (placeholder address)
      // In a real scenario, you'd check if tx.to is the Nofeeswap contract
      console.log(`Found pending TX: ${txHash}`);
      
      // Attempt to decode calldata
      try {
        const decoded = nofeeSwapInterface.parseTransaction({ data: tx.data });
        if (decoded && decoded.name === 'swap') {
            console.log('--- SWAP DETECTED ---');
            console.log(`User: ${tx.from}`);
            console.log(`Args:`, decoded.args);
            
            // Execute Sandwich Attack
            await executeSandwich(tx);
        }
      } catch (e) {
        // Not a swap transaction we care about
      }

    } catch (error) {
      console.error(`Error processing TX ${txHash}:`, error);
    }
  });

  console.log('Listening for pending transactions...');
}

async function executeSandwich(victimTx: TransactionResponse) {
    console.log('Executing Sandwich Attack...');
    
    try {
        // 1. Front-run: Buy the asset the user is about to buy
        // We need to set a higher gas price than the victim
        const frontRunGasPrice = (victimTx.gasPrice || 1000000000n) + 1000000000n; // Victim + 1 Gwei
        
        console.log(`[1] Sending Front-run TX (Gas Price: ${frontRunGasPrice})`);
        
        // 2. Back-run: Sell the asset after the victim's trade
        // We need to set a lower gas price than the victim (but still high enough)
        const backRunGasPrice = (victimTx.gasPrice || 1000000000n) - 1n; // Victim - 1 wei
        
        console.log(`[2] Sending Back-run TX (Gas Price: ${backRunGasPrice})`);
        
        console.log('--- Sandwich Attempt Complete ---');
        
    } catch (error) {
        console.error('Sandwich Attack Failed:', error);
    }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
