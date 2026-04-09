
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { useTokenContracts } from '../hooks/useContract';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { formatAmount } from '../utils/format';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const STATS = [
  { label: 'Protocol', value: 'NoFeeSwap', icon: '◆' },
  { label: 'Network', value: 'Localhost:31337', icon: '🔗' },
  { label: 'Total Pools', value: '1', icon: '🏊' },
  { label: 'Contract', value: 'NofeeOperatorLike', icon: '📄' },
];

const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Dashboard() {
  const { isConnected, balance } = useWallet();
  const { tokenA, tokenB } = useTokenContracts();
  const balanceA = useTokenBalance(tokenA);
  const balanceB = useTokenBalance(tokenB);

  return (
    <div className="page-container">
      <motion.div
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        {/* Hero */}
        <motion.div className="dashboard-hero" variants={fadeUp}>
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="text-gradient">NoFeeSwap</span> Protocol
            </h1>
            <p className="hero-subtitle">
              A zero-fee decentralized exchange with customizable liquidity distribution kernels.
              Explore pools, manage liquidity, and execute swaps on your local development environment.
            </p>
            <div className="hero-actions">
              <Link to="/swap" className="btn btn-primary btn-lg">
                Start Swapping →
              </Link>
              <Link to="/pool" className="btn btn-secondary btn-lg">
                Create Pool
              </Link>
            </div>
          </div>
          <div className="hero-graphic">
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-orb hero-orb-3" />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div className="stats-grid" variants={fadeUp}>
          {STATS.map((stat) => (
            <div key={stat.label} className="glass-card stat-card">
              <span className="stat-icon">{stat.icon}</span>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Wallet Section */}
        {isConnected && (
          <motion.div className="wallet-section" variants={fadeUp}>
            <h2 className="section-title">Your Wallet</h2>
            <div className="wallet-cards">
              <div className="glass-card wallet-card">
                <div className="wallet-card-icon">⟠</div>
                <div className="wallet-card-info">
                  <span className="wallet-card-label">Ethereum</span>
                  <span className="wallet-card-value">{balance} ETH</span>
                </div>
              </div>
              <div className="glass-card wallet-card">
                <div className="wallet-card-icon">🔷</div>
                <div className="wallet-card-info">
                  <span className="wallet-card-label">NoFeeSwap Alpha</span>
                  <span className="wallet-card-value">{formatAmount(balanceA.balance)} NFSA</span>
                </div>
              </div>
              <div className="glass-card wallet-card">
                <div className="wallet-card-icon">🔶</div>
                <div className="wallet-card-info">
                  <span className="wallet-card-label">NoFeeSwap Beta</span>
                  <span className="wallet-card-value">{formatAmount(balanceB.balance)} NFSB</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div className="quick-actions-section" variants={fadeUp}>
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/swap" className="glass-card action-link">
              <div className="action-link-icon">🔄</div>
              <div className="action-link-info">
                <span className="action-link-title">Swap Tokens</span>
                <span className="action-link-desc">Exchange NFSA and NFSB with real-time quotes</span>
              </div>
              <span className="action-arrow">→</span>
            </Link>
            <Link to="/pool" className="glass-card action-link">
              <div className="action-link-icon">🏊</div>
              <div className="action-link-info">
                <span className="action-link-title">Create Pool</span>
                <span className="action-link-desc">Initialize a new pool with custom kernel function</span>
              </div>
              <span className="action-arrow">→</span>
            </Link>
            <Link to="/liquidity" className="glass-card action-link">
              <div className="action-link-icon">💧</div>
              <div className="action-link-info">
                <span className="action-link-title">Manage Liquidity</span>
                <span className="action-link-desc">Add or remove tokens from existing pools</span>
              </div>
              <span className="action-arrow">→</span>
            </Link>
          </div>
        </motion.div>

        {/* Architecture Card */}
        <motion.div className="glass-card architecture-card" variants={fadeUp}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Protocol Architecture</h2>
          <div className="arch-grid">
            <div className="arch-item">
              <div className="arch-item-number">01</div>
              <h4>Kernel Functions</h4>
              <p>Piece-wise linear functions that shape liquidity distribution across price intervals. Customizable per pool.</p>
            </div>
            <div className="arch-item">
              <div className="arch-item-number">02</div>
              <h4>Constant Product AMM</h4>
              <p>Each price interval uses x·y=k invariant, with the kernel modulating how much liquidity each interval receives.</p>
            </div>
            <div className="arch-item">
              <div className="arch-item-number">03</div>
              <h4>Operator Contract</h4>
              <p>Orchestrates pool operations — initialization, liquidity management, and swap execution via a batch instruction set.</p>
            </div>
            <div className="arch-item">
              <div className="arch-item-number">04</div>
              <h4>Transient Storage</h4>
              <p>Uses EIP-1153 transient storage for gas-efficient settlement of multi-step operations within a single transaction.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
