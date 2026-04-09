import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {
  return (
    <>
      <div className="bg-mesh" />
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="footer-inner">
          <span>NoFeeSwap Protocol — Local Dev Environment</span>
          <span className="footer-chain">Chain ID: 31337</span>
        </div>
      </footer>
    </>
  );
}
