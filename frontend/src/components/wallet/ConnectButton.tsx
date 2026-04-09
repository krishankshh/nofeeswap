import { useWallet } from '../../hooks/useWallet';
import { formatAddress } from '../../utils/format';
import { motion } from 'framer-motion';
import './ConnectButton.css';

export function ConnectButton() {
  const { isConnected, isConnecting, address, balance, connect, disconnect } = useWallet();

  if (isConnecting) {
    return (
      <button className="connect-btn connecting" disabled>
        <span className="spinner" />
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <motion.div
        className="wallet-info"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="wallet-balance">{balance} ETH</div>
        <button className="wallet-address-btn" onClick={disconnect} title="Disconnect">
          <span className="wallet-dot" />
          {formatAddress(address)}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.button
      className="connect-btn btn-primary"
      onClick={connect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      Connect Wallet
    </motion.button>
  );
}
