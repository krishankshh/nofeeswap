import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoFeeSwap | The Zero-Fee Yield Protocol",
  description: "Next-generation decentralized exchange with a zero-fee, yield-generating model.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-indigo-500/30">
        <Providers>
          <header className="fixed top-0 left-0 right-0 z-50 glass border-b-0">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 glow group-hover:scale-110 transition-transform"></div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="gradient-text">NoFee</span>Swap
                </h1>
              </div>
              
              <div className="flex items-center gap-6">
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
                  <a href="#" className="hover:text-white transition-colors">Swap</a>
                  <a href="#" className="hover:text-white transition-colors">Liquidity</a>
                  <a href="#" className="hover:text-white transition-colors">Governance</a>
                </nav>
                <div id="wallet-button">
                  {/* RainbowKit Connect Button will be mounted here in the client page */}
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 pt-24 pb-12">
            {children}
          </main>
          
          <footer className="py-8 text-center text-gray-500 text-sm border-t border-white/5">
            <p>© 2026 NoFeeSwap Protocol. Built for efficiency.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
