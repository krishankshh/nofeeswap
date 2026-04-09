import { useWallet } from '../../hooks/useWallet';
import './NetworkBadge.css';

export function NetworkBadge() {
  const { chainId, isCorrectNetwork, switchNetwork } = useWallet();

  if (isCorrectNetwork) {
    return (
      <div className="network-badge network-badge--connected">
        <span className="network-dot network-dot--success" />
        <span>Localhost</span>
      </div>
    );
  }

  return (
    <button className="network-badge network-badge--wrong" onClick={switchNetwork}>
      <span className="network-dot network-dot--error" />
      <span>Wrong Network{chainId ? ` (${chainId})` : ''}</span>
    </button>
  );
}
