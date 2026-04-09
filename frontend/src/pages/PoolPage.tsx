import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { useOperatorContract } from '../hooks/useContract';
import { useTransaction } from '../hooks/useTransaction';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { KernelEditor } from '../components/pool/KernelEditor';
import './PoolPage.css';

const FEE_TIERS = [
  { bps: 5, label: '0.05%', desc: 'Best for stable pairs' },
  { bps: 30, label: '0.3%', desc: 'Best for most pairs' },
  { bps: 100, label: '1.0%', desc: 'Best for exotic pairs' },
];

export function PoolPage() {
  const { isConnected, isCorrectNetwork } = useWallet();
  const operator = useOperatorContract();
  const { execute, status } = useTransaction();

  const [feeBps, setFeeBps] = useState(30);
  const [initialPrice, setInitialPrice] = useState('1.0');
  const [step, setStep] = useState<'config' | 'kernel' | 'confirm'>('config');

  // sqrtPriceX96 = sqrt(price) * 2^96
  const computeSqrtPriceX96 = (price: number): bigint => {
    const sqrtPrice = Math.sqrt(price);
    return BigInt(Math.floor(sqrtPrice * 2 ** 96));
  };

  const handleCreatePool = async () => {
    if (!operator) return;
    const priceX96 = computeSqrtPriceX96(parseFloat(initialPrice) || 1);

    await execute(
      operator.initializePool(
        CONTRACT_ADDRESSES.tokenA,
        CONTRACT_ADDRESSES.tokenB,
        feeBps,
        priceX96
      ),
      { successMessage: 'Pool initialized successfully!' }
    );
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">
          <span className="text-gradient">Create Pool</span>
        </h1>
        <p className="page-subtitle">
          Initialize a new liquidity pool with custom parameters and kernel configuration
        </p>

        <div className="pool-create-grid">
          {/* Left: Configuration  */}
          <div className="pool-config-panel glass-card">
            {/* Step Indicator */}
            <div className="step-indicator">
              {['Configure', 'Kernel', 'Confirm'].map((label, i) => {
                const stepKeys = ['config', 'kernel', 'confirm'] as const;
                const isActive = stepKeys.indexOf(step) >= i;
                return (
                  <div key={label} className={`step-item ${isActive ? 'active' : ''}`}>
                    <div className="step-dot">{i + 1}</div>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>

            {step === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Token Pair */}
                <div className="form-section">
                  <label className="label">Token Pair</label>
                  <div className="token-pair-display">
                    <div className="token-pill">🔷 NFSA</div>
                    <span className="pair-separator">⟷</span>
                    <div className="token-pill">🔶 NFSB</div>
                  </div>
                </div>

                {/* Fee Tier */}
                <div className="form-section">
                  <label className="label">Fee Tier</label>
                  <div className="fee-tier-grid">
                    {FEE_TIERS.map((tier) => (
                      <button
                        key={tier.bps}
                        className={`fee-tier-btn ${feeBps === tier.bps ? 'active' : ''}`}
                        onClick={() => setFeeBps(tier.bps)}
                      >
                        <span className="fee-tier-value">{tier.label}</span>
                        <span className="fee-tier-desc">{tier.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Initial Price */}
                <div className="form-section">
                  <label className="label">Initial Price (NFSB per NFSA)</label>
                  <input
                    type="number"
                    className="input"
                    value={initialPrice}
                    onChange={(e) => setInitialPrice(e.target.value)}
                    placeholder="1.0"
                    min="0.0001"
                    step="0.01"
                  />
                  <div className="input-hint">The starting exchange rate for this pool</div>
                </div>

                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={() => setStep('kernel')}
                >
                  Next: Configure Kernel →
                </button>
              </motion.div>
            )}

            {step === 'kernel' && (
              <motion.div
                key="kernel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="form-section">
                  <label className="label">Liquidity Distribution Kernel</label>
                  <p className="kernel-desc">
                    The kernel function shapes how liquidity is distributed across price intervals.
                    Choose a preset or drag the control points to create a custom shape.
                  </p>
                  <KernelEditor />
                </div>

                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setStep('config')}>
                    ← Back
                  </button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep('confirm')} style={{ flex: 1 }}>
                    Next: Confirm →
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="confirm-summary">
                  <h3 className="confirm-title">Pool Configuration Summary</h3>
                  <div className="confirm-row">
                    <span>Token Pair</span>
                    <span>NFSA / NFSB</span>
                  </div>
                  <div className="confirm-row">
                    <span>Fee Tier</span>
                    <span>{FEE_TIERS.find(t => t.bps === feeBps)?.label}</span>
                  </div>
                  <div className="confirm-row">
                    <span>Initial Price</span>
                    <span>{initialPrice} NFSB/NFSA</span>
                  </div>
                  <div className="confirm-row">
                    <span>Kernel</span>
                    <span>Linear (Default)</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setStep('kernel')}>
                    ← Back
                  </button>
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ flex: 1 }}
                    onClick={handleCreatePool}
                    disabled={!isConnected || !isCorrectNetwork || status === 'pending' || status === 'confirming'}
                  >
                    {status === 'pending' || status === 'confirming' ? (
                      <><span className="spinner" /> Creating Pool...</>
                    ) : (
                      'Create Pool'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Info Panel */}
          <div className="pool-info-panel">
            <div className="glass-card info-card">
              <h3>💡 About Kernel Functions</h3>
              <p>
                In the NoFeeSwap protocol, the kernel function <code>k: [0, qSpacing] → [0, 1]</code> determines 
                how liquidity is distributed across price intervals. It's a monotonically non-decreasing, 
                piece-wise linear function defined by breakpoints.
              </p>
              <div className="info-examples">
                <div className="info-example">
                  <strong>Linear</strong>: k(h) = h / qSpacing — uniform distribution
                </div>
                <div className="info-example">
                  <strong>Step</strong>: Concentrated at specific ranges — higher capital efficiency
                </div>
                <div className="info-example">
                  <strong>S-Curve</strong>: Balanced distribution — blend of concentrated and uniform
                </div>
              </div>
            </div>

            <div className="glass-card info-card">
              <h3>📊 Fee Tier Guide</h3>
              <p>
                Lower fees attract more volume but earn less per trade. Higher fees are better 
                for volatile or exotic token pairs where impermanent loss risk is higher.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
