import { useState, useEffect } from 'react';
import { parseEther, formatEther } from 'ethers';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useWallet } from '../hooks/useWallet';
import { useOperatorContract, useTokenContracts } from '../hooks/useContract';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useTransaction } from '../hooks/useTransaction';
import { usePoolId } from '../hooks/usePool';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { formatAmount } from '../utils/format';
import './LiquidityPage.css';

const PERCENTAGE_PRESETS = [25, 50, 75, 100];

// Mock distribution data for the chart
const generateDistributionData = () => {
  const data = [];
  for (let i = 0; i <= 40; i++) {
    const price = 0.5 + (i / 40) * 1.0;
    const liquidity = Math.exp(-Math.pow((price - 1.0) / 0.2, 2)) * 10000;
    data.push({
      price: price.toFixed(3),
      liquidity: Math.round(liquidity),
    });
  }
  return data;
};

export function LiquidityPage() {
  const { isConnected, isCorrectNetwork, address } = useWallet();
  const operator = useOperatorContract();
  const { tokenA, tokenB } = useTokenContracts();
  const balanceA = useTokenBalance(tokenA);
  const balanceB = useTokenBalance(tokenB);
  const { execute, status } = useTransaction();
  const { getDefaultPoolId } = usePoolId();

  const [poolId, setPoolId] = useState<string | null>(null);
  const [tab, setTab] = useState<'mint' | 'burn'>('mint');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [burnPercent, setBurnPercent] = useState(50);
  const [position, setPosition] = useState<{ liquidity: string; share0: string; share1: string } | null>(null);
  const [distributionData] = useState(generateDistributionData);

  useEffect(() => {
    getDefaultPoolId().then(setPoolId);
  }, [getDefaultPoolId]);

  // Fetch position
  useEffect(() => {
    const fetchPos = async () => {
      if (!operator || !poolId || !address) return;
      try {
        const pos = await operator.getPosition(poolId, address);
        setPosition({
          liquidity: formatEther(pos.liquidity),
          share0: formatEther(pos.token0Share),
          share1: formatEther(pos.token1Share),
        });
      } catch {
        setPosition({ liquidity: '0', share0: '0', share1: '0' });
      }
    };
    fetchPos();
  }, [operator, poolId, address]);

  const handleMint = async () => {
    if (!operator || !poolId || !tokenA || !tokenB) return;
    
    const amount0 = parseEther(amountA || '0');
    const amount1 = parseEther(amountB || '0');

    // Approve tokens
    if (amount0 > 0n) {
      await execute(
        tokenA.approve(CONTRACT_ADDRESSES.operator, amount0),
        { successMessage: 'NFSA approved' }
      );
    }
    if (amount1 > 0n) {
      await execute(
        tokenB.approve(CONTRACT_ADDRESSES.operator, amount1),
        { successMessage: 'NFSB approved' }
      );
    }

    const receipt = await execute(
      operator.mintLiquidity(poolId, amount0, amount1),
      { successMessage: `Added liquidity: ${amountA} NFSA + ${amountB} NFSB` }
    );

    if (receipt) {
      setAmountA('');
      setAmountB('');
      balanceA.refetch();
      balanceB.refetch();
    }
  };

  const handleBurn = async () => {
    if (!operator || !poolId || !position) return;
    
    const totalLiq = parseEther(position.liquidity);
    const burnAmount = (totalLiq * BigInt(burnPercent)) / 100n;

    const receipt = await execute(
      operator.burnLiquidity(poolId, burnAmount),
      { successMessage: `Removed ${burnPercent}% liquidity` }
    );

    if (receipt) {
      balanceA.refetch();
      balanceB.refetch();
    }
  };

  const isProcessing = status === 'pending' || status === 'confirming';

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">
          <span className="text-gradient">Liquidity</span>
        </h1>
        <p className="page-subtitle">
          Manage your liquidity positions — add or remove tokens from the pool
        </p>

        <div className="liquidity-grid">
          {/* Left: Position & Actions */}
          <div className="liquidity-main">
            {/* Position Card */}
            <div className="glass-card position-card">
              <h3 className="position-card-title">Your Position</h3>
              <div className="position-stats">
                <div className="position-stat">
                  <span className="position-stat-label">Liquidity</span>
                  <span className="position-stat-value">
                    {position ? formatAmount(position.liquidity) : '—'}
                  </span>
                </div>
                <div className="position-stat">
                  <span className="position-stat-label">🔷 NFSA Share</span>
                  <span className="position-stat-value">
                    {position ? formatAmount(position.share0) : '—'}
                  </span>
                </div>
                <div className="position-stat">
                  <span className="position-stat-label">🔶 NFSB Share</span>
                  <span className="position-stat-value">
                    {position ? formatAmount(position.share1) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mint/Burn Tabs */}
            <div className="glass-card action-card">
              <div className="tab-bar">
                <button
                  className={`tab-btn ${tab === 'mint' ? 'active' : ''}`}
                  onClick={() => setTab('mint')}
                >
                  Add Liquidity
                </button>
                <button
                  className={`tab-btn ${tab === 'burn' ? 'active' : ''}`}
                  onClick={() => setTab('burn')}
                >
                  Remove Liquidity
                </button>
              </div>

              {tab === 'mint' && (
                <motion.div
                  key="mint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="action-content"
                >
                  <div className="mint-input-group">
                    <div className="mint-input-card">
                      <div className="mint-input-header">
                        <span>🔷 NFSA</span>
                        <span className="mint-balance" onClick={() => setAmountA(balanceA.balance)}>
                          Balance: {formatAmount(balanceA.balance)}
                        </span>
                      </div>
                      <input
                        type="number"
                        className="swap-amount-input"
                        placeholder="0.0"
                        value={amountA}
                        onChange={(e) => {
                          setAmountA(e.target.value);
                          // Auto-fill other side (1:1 for simplicity)
                          if (e.target.value) setAmountB(e.target.value);
                        }}
                      />
                    </div>
                    <div className="mint-plus">+</div>
                    <div className="mint-input-card">
                      <div className="mint-input-header">
                        <span>🔶 NFSB</span>
                        <span className="mint-balance" onClick={() => setAmountB(balanceB.balance)}>
                          Balance: {formatAmount(balanceB.balance)}
                        </span>
                      </div>
                      <input
                        type="number"
                        className="swap-amount-input"
                        placeholder="0.0"
                        value={amountB}
                        onChange={(e) => setAmountB(e.target.value)}
                      />
                    </div>
                  </div>

                  <motion.button
                    className="btn btn-primary btn-full btn-lg"
                    disabled={!isConnected || !isCorrectNetwork || isProcessing || (!amountA && !amountB)}
                    onClick={handleMint}
                    whileHover={!isProcessing ? { scale: 1.01 } : {}}
                    whileTap={!isProcessing ? { scale: 0.99 } : {}}
                  >
                    {isProcessing ? <><span className="spinner" /> Processing...</> : 'Add Liquidity'}
                  </motion.button>
                </motion.div>
              )}

              {tab === 'burn' && (
                <motion.div
                  key="burn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="action-content"
                >
                  <div className="burn-section">
                    <div className="burn-amount-display">
                      <span className="burn-amount-value">{burnPercent}%</span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={burnPercent}
                      onChange={(e) => setBurnPercent(Number(e.target.value))}
                      className="burn-slider"
                    />

                    <div className="burn-presets">
                      {PERCENTAGE_PRESETS.map((p) => (
                        <button
                          key={p}
                          className={`burn-preset-btn ${burnPercent === p ? 'active' : ''}`}
                          onClick={() => setBurnPercent(p)}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>

                    {position && parseFloat(position.liquidity) > 0 && (
                      <div className="burn-preview">
                        <div className="burn-preview-row">
                          <span>🔷 NFSA to receive</span>
                          <span>{formatAmount(parseFloat(position.share0) * burnPercent / 100)}</span>
                        </div>
                        <div className="burn-preview-row">
                          <span>🔶 NFSB to receive</span>
                          <span>{formatAmount(parseFloat(position.share1) * burnPercent / 100)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <motion.button
                    className="btn btn-primary btn-full btn-lg"
                    disabled={!isConnected || !isCorrectNetwork || isProcessing || !position || parseFloat(position?.liquidity || '0') <= 0}
                    onClick={handleBurn}
                    whileHover={!isProcessing ? { scale: 1.01 } : {}}
                    whileTap={!isProcessing ? { scale: 0.99 } : {}}
                  >
                    {isProcessing ? <><span className="spinner" /> Processing...</> : `Remove ${burnPercent}% Liquidity`}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: Chart */}
          <div className="liquidity-chart-panel">
            <div className="glass-card chart-card">
              <h3 className="chart-title">Liquidity Distribution</h3>
              <p className="chart-subtitle">Current token distribution across price ranges</p>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={distributionData}>
                    <defs>
                      <linearGradient id="liqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="price"
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1A1B26',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '0.85rem',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="liquidity"
                      stroke="#6366F1"
                      fill="url(#liqGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card info-card">
              <h3>📌 Pool Info</h3>
              <div className="pool-info-rows">
                <div className="pool-info-row">
                  <span>Pool</span>
                  <span>NFSA / NFSB</span>
                </div>
                <div className="pool-info-row">
                  <span>Fee Tier</span>
                  <span>0.3%</span>
                </div>
                <div className="pool-info-row">
                  <span>Your Balance (NFSA)</span>
                  <span>{formatAmount(balanceA.balance)}</span>
                </div>
                <div className="pool-info-row">
                  <span>Your Balance (NFSB)</span>
                  <span>{formatAmount(balanceB.balance)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
