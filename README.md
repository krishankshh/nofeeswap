# NoFeeSwap Protocol — Full-Stack Implementation

👋 **Hi, I'm Krishank Shah.**

A complete local development environment for the NoFeeSwap decentralized exchange protocol, featuring a **premium React-based frontend dApp**, local blockchain deployment, and a **TypeScript sandwich attack bot**.

> [!NOTE]
> This project was built as a screening assignment demonstrating frontend engineering, Web3 integration, and protocol understanding. While I leveraged AI assistance (Antigravity) for complex blockchain logic and Web3 boilerplate, the **Frontend architecture, design system, and user experience were developed entirely by me** to showcase my core engineering capabilities.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Frontend (React dApp)](#frontend-react-dapp)
- [Chain (Local Deployment)](#chain-local-deployment)
- [Sandwich Bot](#sandwich-bot)
- [Transparency Statement](#transparency-statement)
- [Design Decisions](#design-decisions)
- [Known Limitations](#known-limitations)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │Dashboard │  │  Swap    │  │   Pool   │  │Liquidity│  │
│  │  Page    │  │  Page    │  │   Page   │  │  Page   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       └──────────────┴──────────────┴────────────┘       │
│                         │ ethers.js v6                    │
├─────────────────────────┼────────────────────────────────┤
│                    MetaMask / Web3 Wallet                 │
├─────────────────────────┼────────────────────────────────┤
│              Local Hardhat Node (31337)                   │
│  ┌──────────────────┐  ┌─────────────────────────┐       │
│  │  MockERC20 (×2)  │  │  NofeeOperatorLike      │       │
│  │  NFSA  │  NFSB   │  │  (Pool + Swap + Liq)    │       │
│  └──────────────────┘  └─────────────────────────┘       │
├──────────────────────────────────────────────────────────┤
│                 Sandwich Bot (TypeScript)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐       │
│  │ Mempool  │  │ Calldata │  │  Sandwich         │       │
│  │ Monitor  │──│ Decoder  │──│  Executor         │       │
│  └──────────┘  └──────────┘  └──────────────────┘       │
└──────────────────────────────────────────────────────────┘
```

## ✅ Prerequisites

| Tool       | Version                     | Purpose                    |
|------------|-----------------------------|----------------------------|
| Node.js    | ≥ 20.x                      | Runtime                    |
| npm        | ≥ 10.x                      | Package manager            |
| MetaMask   | Latest browser extension    | Wallet for frontend        |
| Git        | Any recent version          | Version control            |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From project root
cd chain && npm install
cd ../frontend && npm install
cd ../bot && npm install
cd ..
```

### 2. Start Local Blockchain

```bash
cd chain
npx hardhat node
```

> Keep this terminal open. The node runs on `http://127.0.0.1:8545` (Chain ID: 31337).

### 3. Deploy Contracts

Open a **new terminal**:

```bash
cd chain
npx hardhat run scripts/deploy.ts --network localhost
```

This deploys:
- `MockERC20` × 2 (NFSA + NFSB tokens, 1M supply each)
- `NofeeOperatorLike` (Pool operator contract)
- Initializes a default NFSA/NFSB pool (0.3% fee, 1:1 price)
- Adds 10,000 tokens initial liquidity
- Writes addresses to `chain/deployments/localhost.json`

### 4. Configure MetaMask

1. Open MetaMask → Settings → Networks → Add Network
2. Enter:
   - **Network Name:** Hardhat Localhost
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Import the deployer account:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has test ETH + token balances

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

### 6. Run Sandwich Bot (Optional)

```bash
cd bot
npm start
```

The bot monitors the local mempool for swap transactions and attempts sandwich attacks.

---

## 📁 Project Structure

```
nofeeswap/
├── chain/                    # Local blockchain setup
│   ├── contracts/            # Solidity contracts
│   │   ├── MockERC20.sol     # ERC-20 test tokens
│   │   └── NofeeOperatorLike.sol  # Simplified operator
│   ├── scripts/deploy.ts     # Deployment script
│   ├── hardhat.config.ts     # Hardhat configuration
│   └── deployments/          # Deployed addresses (auto-generated)
│
├── frontend/                 # React dApp (⭐ Primary deliverable)
│   ├── src/
│   │   ├── pages/            # Dashboard, Swap, Pool, Liquidity
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks (wallet, contracts, tx)
│   │   ├── config/           # Chain, contract, token configuration
│   │   ├── utils/            # Formatting utilities
│   │   └── abis/             # Contract ABIs
│   └── index.html
│
├── bot/                      # Sandwich attack bot
│   └── src/
│       ├── index.ts          # Main bot loop + event monitoring
│       ├── decoder.ts        # Swap calldata decoder
│       └── profitability.ts  # Profit calculation model
│
├── core/                     # NoFeeSwap core contracts (reference)
├── operator/                 # NoFeeSwap operator contracts (reference)
└── README.md                 # This file
```

---

## 🎨 Frontend (React dApp)

### Tech Stack

- **React 19** + **TypeScript** — Type-safe component architecture
- **Vite 6** — Lightning-fast HMR development
- **ethers.js v6** — Ethereum provider & contract interactions
- **Recharts** — Liquidity distribution visualization
- **Framer Motion** — Smooth micro-animations
- **React Hot Toast** — Transaction notification system
- **React Router** — Client-side routing
- **Vanilla CSS** — Custom design system with CSS custom properties

### Pages

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | Protocol overview, wallet balances, quick actions, architecture info |
| **Swap** | `/swap` | Token swap with quotes, slippage control, price impact, approval flow |
| **Pool** | `/pool` | Create new pools with fee tier selection and kernel editor |
| **Liquidity** | `/liquidity` | Mint/burn liquidity with distribution chart and position tracking |

### Key Frontend Features

- **🔌 Wallet Integration**: MetaMask connect/disconnect with auto-reconnect, chain detection, and network switching
- **📊 Interactive Kernel Editor**: SVG-based editor with draggable control points for kernel function visualization
- **🔄 Transaction Lifecycle**: Full pending → confirming → confirmed/reverted state management with toast notifications
- **📈 Liquidity Charts**: Recharts-powered distribution visualization
- **🎨 Glassmorphism Design**: Dark-mode UI with blur effects, gradient accents, and micro-animations
- **📱 Responsive Layout**: Adapts from desktop to tablet viewports
- **⚡ Approval Flow**: Multi-step ERC-20 approve → swap/mint transaction sequences

### Design System

The UI uses a custom CSS design system defined in `src/index.css`:
- **Colors**: Indigo/Violet primary with Mint accent on deep dark (#0A0B0E) background
- **Typography**: Inter font via Google Fonts
- **Effects**: Glassmorphism cards, gradient CTAs, animated orbs, skeleton loading states
- **Components**: Reusable button variants, input styles, badges, modals, tooltips

---

## ⛓ Chain (Local Deployment)

The `chain/` directory contains a Hardhat project that deploys a simplified local environment:

- **MockERC20.sol**: Standard ERC-20 with mint capability for testing
- **NofeeOperatorLike.sol**: A constant-product AMM that mirrors the NoFeeSwap operator interface
- **deploy.ts**: Automated deployment + pool initialization + initial liquidity

---

## 🥪 Sandwich Bot

The bot in `bot/` monitors the local node's mempool for swap transactions and executes sandwich attacks:

### How It Works

1. **Monitoring**: Polls pending transactions every 1 second
2. **Detection**: Filters transactions targeting the operator contract
3. **Decoding**: Extracts swap parameters (direction, amount, slippage) from calldata
4. **Calculation**: Estimates sandwich profitability based on victim's slippage tolerance
5. **Execution**: Submits front-run (higher gas) → waits for victim → submits back-run

### Architecture

- `index.ts` — Main loop, WebSocket monitoring, transaction execution
- `decoder.ts` — ABI-based calldata decoding for swap function signatures
- `profitability.ts` — Simplified constant-product AMM profit model

---

## ⚠️ Transparency Statement

### NofeeOperatorLike Simplification

The full NoFeeSwap protocol uses advanced EVM features including:
- **Transient storage** (EIP-1153) for gas-efficient multi-step settlements
- **Custom fixed-point types** (X59, X47, Tag) for log-price representations
- **Kernel-modulated liquidity distribution** via piece-wise linear functions
- **Complex delegate-call architecture** between core and delegatee contracts

For this assignment, I used a **simplified `NofeeOperatorLike` contract** — a constant-product AMM that exposes the same external interface (`initializePool`, `mintLiquidity`, `burnLiquidity`, `swap`, `quoteSwap`) as the real operator contract. This approach was chosen because:

1. The real protocol contracts require a Brownie/Python deployment toolchain (not Hardhat-native)
2. The assignment primarily evaluates **frontend engineering** and **protocol comprehension**
3. The contract interface — the boundary the frontend interacts with — is functionally equivalent
4. The kernel editor and liquidity distribution chart demonstrate understanding of the protocol's novel kernel function concept

### What's Real vs. Simulated

| Component | Status |
|-----------|--------|
| ERC-20 token interactions | ✅ Real on-chain |
| Pool initialization | ✅ Real on-chain |
| Swap execution | ✅ Real on-chain (simplified AMM) |
| Liquidity minting/burning | ✅ Real on-chain |
| Kernel function editor | ⚡ Visual UI (kernel concept demo) |
| Liquidity distribution chart | ⚡ Mock data visualization |
| Sandwich bot mempool monitoring | ✅ Real pending tx monitoring |
| Sandwich bot execution | ✅ Real front-run/back-run txs |

---

## 🎯 Design Decisions

1. **React + Vite over Next.js**: No SSR needed for a dApp. Vite provides faster HMR and simpler configuration.
2. **Vanilla CSS over Tailwind**: Demonstrates CSS architecture skills with a proper design token system. More appropriate for a frontend role interview.
3. **ethers.js v6**: Industry standard for React dApp Web3 interactions. Clean, typed API.
4. **Context API over Redux**: Wallet state is the only global state needed. React Context is sufficient.
5. **Custom hooks pattern**: Separates contract interaction logic from UI, making components testable and reusable.
6. **Interactive kernel editor**: The standout frontend feature. Shows SVG manipulation, drag-and-drop, state management, and data visualization skills.

---

## ⚡ Known Limitations

- **No persistent storage**: Pool and position data refreshes on page reload (read from chain each time)
- **Fixed token pair**: The UI is configured for NFSA/NFSB. Multi-pair support would require a token registry
- **Kernel editor is visual-only**: The kernel shape is not written to the contract (the simplified AMM doesn't support kernels). It demonstrates the UI concept
- **Sandwich bot on Hardhat**: Hardhat's mining model differs from mainnet. The bot uses interval mining to simulate realistic mempool behavior
- **No production build optimization**: Code splitting not configured since this is a dev assignment

---

## 📜 License

This project is submitted as part of the NoFeeSwap screening assignment and is not intended for production use.
