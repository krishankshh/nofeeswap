import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './hooks/useWallet';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { SwapPage } from './pages/SwapPage';
import { PoolPage } from './pages/PoolPage';
import { LiquidityPage } from './pages/LiquidityPage';

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A1B26',
              color: '#F8FAFC',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontFamily: "'Inter', sans-serif",
            },
            success: {
              iconTheme: { primary: '#06D6A0', secondary: '#1A1B26' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#1A1B26' },
            },
          }}
        />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/pool" element={<PoolPage />} />
            <Route path="/liquidity" element={<LiquidityPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
