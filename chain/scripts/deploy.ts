import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  NoFeeSwap Local Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer: ${deployer.address}`);
  console.log("");

  // ─── 1. Deploy Mock ERC-20 Tokens ───
  console.log("① Deploying Mock ERC-20 Tokens...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const initialSupply = ethers.parseEther("1000000"); // 1M tokens each

  const tokenA = await MockERC20.deploy("NoFeeSwap Alpha", "NFSA", initialSupply);
  await tokenA.waitForDeployment();
  const tokenAAddr = await tokenA.getAddress();
  console.log(`   ✓ NFSA deployed: ${tokenAAddr}`);

  const tokenB = await MockERC20.deploy("NoFeeSwap Beta", "NFSB", initialSupply);
  await tokenB.waitForDeployment();
  const tokenBAddr = await tokenB.getAddress();
  console.log(`   ✓ NFSB deployed: ${tokenBAddr}`);

  // ─── 2. Deploy NofeeOperatorLike ───
  console.log("\n② Deploying NofeeOperatorLike (Operator)...");
  const Operator = await ethers.getContractFactory("NofeeOperatorLike");
  const operator = await Operator.deploy();
  await operator.waitForDeployment();
  const operatorAddr = await operator.getAddress();
  console.log(`   ✓ Operator deployed: ${operatorAddr}`);

  // ─── 3. Initialize Default Pool ───
  console.log("\n③ Initializing default pool (NFSA/NFSB, 30bps)...");
  const feeBps = 30; // 0.3% fee
  // sqrtPriceX96 for 1:1 price = 2^96 ≈ 79228162514264337593543950336
  const initialPriceX96 = 79228162514264337593543950336n;

  const initTx = await operator.initializePool(
    tokenAAddr,
    tokenBAddr,
    feeBps,
    initialPriceX96
  );
  await initTx.wait();

  const poolId = await operator.getPoolId(tokenAAddr, tokenBAddr, feeBps);
  console.log(`   ✓ Pool initialized: ${poolId}`);

  // ─── 4. Add Initial Liquidity ───
  console.log("\n④ Adding initial liquidity (10,000 NFSA + 10,000 NFSB)...");
  const liquidityAmount = ethers.parseEther("10000");

  // Approve tokens for operator
  await (await tokenA.approve(operatorAddr, liquidityAmount)).wait();
  await (await tokenB.approve(operatorAddr, liquidityAmount)).wait();
  console.log("   ✓ Tokens approved");

  // Mint liquidity
  const mintTx = await operator.mintLiquidity(
    poolId,
    liquidityAmount,
    liquidityAmount
  );
  await mintTx.wait();
  console.log("   ✓ Liquidity added");

  // ─── 5. Write Deployment Manifest ───
  const deployment = {
    network: "localhost",
    chainId: 31337,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      tokenA: {
        address: tokenAAddr,
        name: "NoFeeSwap Alpha",
        symbol: "NFSA",
        decimals: 18,
      },
      tokenB: {
        address: tokenBAddr,
        name: "NoFeeSwap Beta",
        symbol: "NFSB",
        decimals: 18,
      },
      operator: {
        address: operatorAddr,
      },
    },
    defaultPool: {
      poolId: poolId,
      token0: tokenAAddr < tokenBAddr ? tokenAAddr : tokenBAddr,
      token1: tokenAAddr < tokenBAddr ? tokenBAddr : tokenAAddr,
      feeBps: feeBps,
      initialLiquidity: "10000",
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(deploymentsDir, "localhost.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ✅ Deployment Complete!");
  console.log(`  📄 Manifest: chain/deployments/localhost.json`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
