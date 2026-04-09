import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { CHAIN_CONFIG, isCorrectChain } from '../config/chains';

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [balance, setBalance] = useState('0');

  const isConnected = !!address;
  const isCorrectNetwork = chainId !== null && isCorrectChain(chainId);

  const updateBalance = useCallback(async (prov: BrowserProvider, addr: string) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance((Number(bal) / 1e18).toFixed(4));
    } catch {
      setBalance('0');
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this dApp');
      return;
    }
    setIsConnecting(true);
    try {
      const prov = new BrowserProvider(window.ethereum);
      const accounts = await prov.send('eth_requestAccounts', []);
      const s = await prov.getSigner();
      const network = await prov.getNetwork();
      
      setProvider(prov);
      setSigner(s);
      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
      await updateBalance(prov, accounts[0]);
    } catch (err) {
      console.error('Failed to connect:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [updateBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setSigner(null);
    setProvider(null);
    setBalance('0');
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_CONFIG.chainIdHex }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: CHAIN_CONFIG.chainIdHex,
            chainName: CHAIN_CONFIG.chainName,
            rpcUrls: [CHAIN_CONFIG.rpcUrl],
            nativeCurrency: CHAIN_CONFIG.nativeCurrency,
          }],
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        if (provider) updateBalance(provider, accounts[0]);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainIdHex = args[0] as string;
      setChainId(parseInt(chainIdHex, 16));
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Auto-connect if previously connected
    window.ethereum.request({ method: 'eth_accounts' }).then((result: unknown) => {
      const accounts = result as string[];
      if (accounts.length > 0) connect();
    });

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [connect, disconnect, provider, updateBalance]);

  const value: WalletState = {
    isConnected,
    isConnecting,
    address,
    chainId,
    isCorrectNetwork,
    signer,
    provider,
    balance,
    connect,
    disconnect,
    switchNetwork,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWallet(): WalletState {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
