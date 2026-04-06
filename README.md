# NoFeeSwap Protocol - Full Stack Assignment

This repository contains the full stack implementation of the NoFeeSwap screening assignment, featuring a local protocol deployment environment, a premium dApp frontend, and a mempool-monitoring sandwich bot.

## Project Structure

- `core/`: (Submodule) The core NoFeeSwap protocol singleton contracts.
- `operator/`: (Submodule) The operator interface for interacting with the protocol.
- `frontend/`: A Next.js 16 dApp for swapping, liquidity management, and pool initialization.
- `bot/`: A TypeScript bot for monitoring the mempool and executing sandwich attacks.
- `hardhat.config.js`: Configuration for the local Hardhat blockchain.

## Features

- **Protocol**: Locally simulated NoFeeSwap environment with `StorageAccess` and `TransientAccess`.
- **DApp**:
    - Built with **Next.js (App Router)** and **Tailwind CSS**.
    - **RainbowKit & Wagmi** integration for multi-wallet connectivity.
    - Glassmorphic UI with **Framer Motion** animations.
    - Components for Token Swaps, Pool Initialization, and Liquidity management.
- **Bot**:
    - **Ethers 6** mempool listener.
    - Decodes `Nofeeswap.swap` calldata.
    - Implements gas-price competition for front-running and back-running victim transactions.

## Setup Instructions

### Prerequisites

- Node.js v18+
- Git

### Initial Setup

```bash
# Clone the repository and initialize submodules
git submodule update --init --recursive

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install bot dependencies
cd bot
npm install
cd ..
```

### Running the Project

1. **Start the Local Blockchain**:
    ```bash
    npx hardhat node
    ```

2. **Deploy the Protocol** (Wait for node to start):
    ```bash
    npx hardhat run scripts/deploy.js --network localhost
    ```

3. **Start the DApp**:
    ```bash
    cd frontend
    npm run dev
    ```
    Visit `http://localhost:3000`

4. **Start the Sandwich Bot**:
    ```bash
    cd bot
    npx ts-node index.ts
    ```

## Transparency Statement

This project was built as a screening assignment. Due to local environment path limits and deep repository recursion, the `full_contracts/` directory was used to flatten the dependency tree for local Hardhat compilation.

---
Built by Antigravity for NoFeeSwap.
