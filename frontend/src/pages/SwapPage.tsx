import { useState, useEffect, useCallback } from 'react';
import { parseEther, formatEther } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { useOperatorContract } from '../hooks/useContract';
import { useTokenContracts } from '../hooks/useContract';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useTransaction } from '../hooks/useTransaction';
import { usePoolId, useQuoteSwap } from '../hooks/usePool';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { formatAmount, formatPercent } from '../utils/format';
import './SwapPage.css';

const SLIPPAGE_PRESETS = [10, 50, 100]; // in bps: 0.1%, 0.5%, 1.0%

export function SwapPage() {
  const { isConnected, isCorrectNetwork } = useWallet();
  const operator = useOperatorContract();
  const { tokenA, tokenB } = useTokenContracts();
  const balanceA = useTokenBalance(tokenA);
  const balanceB = useTokenBalance(tokenB);
  const { execute, status } = useTransaction();
  const { getDefaultPoolId } = usePoolId();

  const [fromToken, setFromToken] = useState<'A' | 'B'>('A');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState(50);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [poolId, setPoolId] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);
  const [needsApproval, setNeedsApproval] = useState(false);

  const zeroForOne = fromToken === 'A';
  const fromBalance = zeroForOne ? balanceA : balanceB;
  const toBalance = zeroForOne ? balanceB : balanceA;
  const fromSymbol = zeroForOne ? 'NFSA' : 'NFSB';
  const toSymbol = zeroForOne ? 'NFSB' : 'NFSA';
  const fromIcon = zeroForOne ? '🔷' : '🔶';
  const toIcon = zeroForOne ? '🔶' : '🔷';

  // Fetch pool ID on mount
  useEffect(() => {
    getDefaultPoolId().then(setPoolId);
  }, [getDefaultPoolId]);

  // Fetch quote when input changes
  const { getQuote } = useQuoteSwap(poolId);
  
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setOutputAmount('');
      setPriceImpact(0);
      return;
    }

    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const amountIn = parseEther(inputAmount);
        const quote = await getQuote(zeroForOne, amountIn);
        if (quote) {
          setOutputAmount(formatEther(quote.amountOut));
          setPriceImpact(Number(quote.priceImpactBps));
        }
      } catch {
        setOutputAmount('');
      }
      setQuoteLoading(false);
    };

    const debounce = setTimeout(fetchQuote, 300);
    return () => clearTimeout(debounce);
  }, [inputAmount, zeroForOne, getQuote]);

  // Check approval
  useEffect(() => {
    const checkApproval = async () => {
      if (!inputAmount || parseFloat(inputAmount) <= 0) {
        setNeedsApproval(false);
        return;
      }
      const tokenContract = zeroForOne ? tokenA : tokenB;
      if (!tokenContract) return;
      
      const allowance = await fromBalance.fetchAllowance(CONTRACT_ADDRESSES.operator);
      const amountNeeded = parseEther(inputAmount);
      setNeedsApproval(allowance < amountNeeded);
    };
    checkApproval();
  }, [inputAmount, zeroForOne, tokenA, tokenB, fromBalance]);

  const handleFlip = () => {
    setFromToken(fromToken === 'A' ? 'B' : 'A');
    setInputAmount('');
    setOutputAmount('');
  };

  const handleMax = () => {
    setInputAmount(fromBalance.balance);
  };

  const handleApprove = async () => {
    const tokenContract = zeroForOne ? tokenA : tokenB;
    if (!tokenContract) return;
    
    const amountToApprove = parseEther(inputAmount);
    await execute(
      tokenContract.approve(CONTRACT_ADDRESSES.operator, amountToApprove),
      { successMessage: `Approved ${fromSymbol}` }
    );
    setNeedsApproval(false);
  };

  const handleSwap = async () => {
    if (!operator || !poolId || !inputAmount) return;
    
    const amountIn = parseEther(inputAmount);
    const minOut = outputAmount
      ? (parseEther(outputAmount) * BigInt(10000 - slippageBps)) / 10000n
      : 0n;

    const receipt = await execute(
      operator.swap(poolId, zeroForOne, amountIn, minOut, slippageBps),
      { successMessage: `Swapped ${formatAmount(inputAmount)} ${fromSymbol} → ${toSymbol}` }
    );

    if (receipt) {
      setInputAmount('');
      setOutputAmount('');
      fromBalance.refetch();
      toBalance.refetch();
    }
  };

  const getButtonState = useCallback(() => {
    if (!isConnected) return { text: 'Connect Wallet', disabled: true };
    if (!isCorrectNetwork) return { text: 'Switch to Localhost', disabled: true };
    if (!inputAmount || parseFloat(inputAmount) <= 0) return { text: 'Enter Amount', disabled: true };
    if (parseFloat(inputAmount) > parseFloat(fromBalance.balance)) return { text: 'Insufficient Balance', disabled: true };
    if (status === 'pending' || status === 'confirming') return { text: 'Processing...', disabled: true };
    if (needsApproval) return { text: `Approve ${fromSymbol}`, disabled: false, action: 'approve' };
    return { text: 'Swap', disabled: false, action: 'swap' };
  }, [isConnected, isCorrectNetwork, inputAmount, fromBalance.balance, status, needsApproval, fromSymbol]);

  const buttonState = getButtonState();

  const priceImpactColor = priceImpact > 500 ? 'var(--color-error)' : priceImpact > 100 ? 'var(--color-warning)' : 'var(--color-accent)';

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <motion.div
        className="swap-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="swap-header">
          <h2 className="swap-title">Swap</h2>
          <button
            className="swap-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Slippage Settings"
          >
            ⚙️
          </button>
        </div>

        {/* Slippage Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="slippage-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="slippage-label">Slippage Tolerance</div>
              <div className="slippage-options">
                {SLIPPAGE_PRESETS.map((bps) => (
                  <button
                    key={bps}
                    className={`slippage-preset ${slippageBps === bps ? 'active' : ''}`}
                    onClick={() => { setSlippageBps(bps); setCustomSlippage(''); }}
                  >
                    {bps / 100}%
                  </button>
                ))}
                <div className="slippage-custom">
                  <input
                    type="number"
                    placeholder="Custom"
                    value={customSlippage}
                    onChange={(e) => {
                      setCustomSlippage(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (val > 0 && val <= 20) setSlippageBps(Math.round(val * 100));
                    }}
                    className="slippage-input"
                  />
                  <span className="slippage-percent">%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* From Input */}
        <div className="swap-input-card">
          <div className="swap-input-header">
            <span className="swap-input-label">From</span>
            <span className="swap-input-balance" onClick={handleMax}>
              Balance: {formatAmount(fromBalance.balance)} <span className="max-tag">MAX</span>
            </span>
          </div>
          <div className="swap-input-row">
            <input
              type="number"
              className="swap-amount-input"
              placeholder="0.0"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
            />
            <div className="swap-token-badge">
              <span>{fromIcon}</span>
              <span className="token-symbol">{fromSymbol}</span>
            </div>
          </div>
        </div>

        {/* Flip Button */}
        <div className="swap-flip-wrapper">
          <motion.button
            className="swap-flip-btn"
            onClick={handleFlip}
            whileHover={{ rotate: 180, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            ↕
          </motion.button>
        </div>

        {/* To Input */}
        <div className="swap-input-card">
          <div className="swap-input-header">
            <span className="swap-input-label">To (estimated)</span>
            <span className="swap-input-balance">
              Balance: {formatAmount(toBalance.balance)}
            </span>
          </div>
          <div className="swap-input-row">
            <input
              type="number"
              className="swap-amount-input"
              placeholder="0.0"
              value={outputAmount ? formatAmount(outputAmount, 6) : ''}
              readOnly
            />
            <div className="swap-token-badge">
              <span>{toIcon}</span>
              <span className="token-symbol">{toSymbol}</span>
              {quoteLoading && <span className="spinner" style={{ width: 14, height: 14 }} />}
            </div>
          </div>
        </div>

        {/* Swap Details */}
        {outputAmount && parseFloat(outputAmount) > 0 && (
          <motion.div
            className="swap-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="swap-detail-row">
              <span>Rate</span>
              <span>1 {fromSymbol} ≈ {formatAmount(parseFloat(outputAmount) / parseFloat(inputAmount), 4)} {toSymbol}</span>
            </div>
            <div className="swap-detail-row">
              <span>Price Impact</span>
              <span style={{ color: priceImpactColor }}>{formatPercent(priceImpact)}</span>
            </div>
            <div className="swap-detail-row">
              <span>Min Received</span>
              <span>{formatAmount(parseFloat(outputAmount) * (1 - slippageBps / 10000), 4)} {toSymbol}</span>
            </div>
            <div className="swap-detail-row">
              <span>Slippage Tolerance</span>
              <span>{slippageBps / 100}%</span>
            </div>
          </motion.div>
        )}

        {/* Price Impact Warning */}
        {priceImpact > 500 && (
          <div className="swap-warning">
            ⚠️ High price impact! You may receive significantly less tokens.
          </div>
        )}

        {/* Swap Button */}
        <motion.button
          className={`btn btn-lg btn-full ${buttonState.action === 'approve' ? 'btn-secondary' : 'btn-primary'}`}
          disabled={buttonState.disabled}
          onClick={buttonState.action === 'approve' ? handleApprove : handleSwap}
          whileHover={!buttonState.disabled ? { scale: 1.01 } : {}}
          whileTap={!buttonState.disabled ? { scale: 0.99 } : {}}
        >
          {(status === 'pending' || status === 'confirming') && <span className="spinner" />}
          {buttonState.text}
        </motion.button>
      </motion.div>
    </div>
  );
}
