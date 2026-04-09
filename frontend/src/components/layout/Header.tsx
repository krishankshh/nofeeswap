import { NavLink } from 'react-router-dom';
import { ConnectButton } from '../wallet/ConnectButton';
import { NetworkBadge } from '../wallet/NetworkBadge';
import { useWallet } from '../../hooks/useWallet';
import './Header.css';

export function Header() {
  const { isConnected } = useWallet();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <NavLink to="/" className="header-logo">
            <span className="logo-icon">◆</span>
            <span className="logo-text">NoFeeSwap</span>
          </NavLink>
          <nav className="header-nav">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink to="/swap" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Swap
            </NavLink>
            <NavLink to="/pool" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Pool
            </NavLink>
            <NavLink to="/liquidity" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Liquidity
            </NavLink>
          </nav>
        </div>
        <div className="header-right">
          {isConnected && <NetworkBadge />}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
