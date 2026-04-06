'use client';

import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowDownUp, Settings2, Wallet, Plus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'swap' | 'pool' | 'liquidity'>('swap');
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-4">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Next-Gen <span className="gradient-text">Zero-Fee</span> Trading
          </h2>
          <p className="max-w-2xl mx-auto mt-4 text-gray-400 text-lg">
            NoFeeSwap is a revolutionary DEX protocol that eliminates trading fees by using a yield-generating model for liquidity providers.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-center"
        >
          <ConnectButton />
        </motion.div>
      </div>

      <div className="flex flex-col items-center">
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-white/5 rounded-2xl mb-8 border border-white/10 glass w-full max-w-md">
          {(['swap', 'pool', 'liquidity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all capitalize ${
                activeTab === tab 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'pool' ? 'Initialize' : tab}
            </button>
          ))}
        </div>

        {/* Main Interaction Area */}
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {activeTab === 'swap' && <SwapComponent key="swap" />}
            {activeTab === 'pool' && <PoolComponent key="pool" />}
            {activeTab === 'liquidity' && <LiquidityComponent key="liquidity" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SwapComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass p-6 rounded-3xl space-y-4 relative w-full glow border-white/10"
    >
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="font-bold text-lg text-white">Swap Tokens</h3>
        <button className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10">
          <Settings2 size={20} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 transition-all hover:border-white/10 group">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
            <span>You sell</span>
            <span className="flex items-center gap-1"><Wallet size={12}/> Balance: 1,234.56</span>
          </div>
          <div className="flex justify-between items-center">
            <input 
              type="text" 
              placeholder="0.0" 
              className="bg-transparent text-3xl font-bold focus:outline-none w-full placeholder:text-gray-600"
            />
            <button className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold py-2 px-4 rounded-2xl transition-all h-fit whitespace-nowrap">
              <span>ETH</span>
              <ArrowDownUp size={16} />
            </button>
          </div>
        </div>

        <div className="relative flex justify-center -my-3 z-10">
          <button className="p-3 bg-indigo-500 rounded-2xl border-4 border-[#0a0a0c] shadow-xl hover:scale-110 transition-transform text-white">
            <ArrowDownUp size={20} />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 transition-all hover:border-white/10">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
            <span>You buy</span>
            <span className="flex items-center gap-1"><Wallet size={12}/> Balance: 0.00</span>
          </div>
          <div className="flex justify-between items-center">
            <input 
              type="text" 
              placeholder="0.0" 
              readOnly
              className="bg-transparent text-3xl font-bold focus:outline-none w-full placeholder:text-gray-700"
            />
            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 px-4 rounded-2xl transition-all h-fit whitespace-nowrap">
              <span>NFS</span>
              <ArrowDownUp size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Slippage Tolerance</span>
          <span>0.5%</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Minimum Received</span>
          <span>1.23 NFS</span>
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-300">
          <span>Network Cost</span>
          <span className="text-gray-500">~ $4.20</span>
        </div>
      </div>

      <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-xl mt-4">
        Connect Wallet
      </button>
    </motion.div>
  );
}

function PoolComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass p-8 rounded-3xl space-y-6 glow border-white/10 shadow-2xl"
    >
      <div className="space-y-2">
        <h3 className="font-bold text-2xl text-white">Initialize New Pool</h3>
        <p className="text-gray-400 text-sm">Configure the initial parameters and kernel for your decentralized trading environment.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-400 ml-1">Asset Configuration</label>
          <div className="grid grid-cols-2 gap-3">
             <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-1">
               <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Token 0</span>
               <span className="text-lg font-bold">ETH</span>
             </div>
             <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-1">
               <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Token 1</span>
               <span className="text-lg font-bold">NFS</span>
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-400 ml-1">Kernel Type</label>
          <div className="flex gap-2">
            {['Linear', 'Sigmoid', 'Gamma'].map(type => (
              <button key={type} className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border transition-all ${type === 'Linear' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-400'}`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-4 items-center">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Info className="text-indigo-400" size={18} />
            </div>
            <p className="text-xs text-indigo-300 leading-relaxed font-medium">
                Pool initialization requires an initial deposit of both tokens to set the first price point on the kernel curve.
            </p>
        </div>
      </div>

      <button className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20">
        Initialize Pool
      </button>
    </motion.div>
  );
}

function LiquidityComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass p-8 rounded-3xl space-y-6 glow border-white/10"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xl text-white">Your Liquidity</h3>
        <button className="p-2 bg-indigo-500 rounded-xl text-white hover:bg-indigo-400 transition-colors">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Placeholder for actual liquidity positions */}
        <div className="bg-black/40 border border-white/5 p-8 rounded-2xl text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 bg-white/5 rounded-full">
               <Wallet className="text-gray-600" size={32} />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold">No active positions</h4>
            <p className="text-xs text-gray-500">Your liquidity positions will appear here once you've contributed to a pool.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer group">
          <div className="flex justify-between items-center">
             <div className="flex flex-col gap-1">
                <span className="text-sm font-bold group-hover:text-indigo-400 transition-colors">ETH / NFS Pool</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Kernel: Linear</span>
             </div>
             <div className="text-right">
                <span className="text-xs font-bold text-indigo-400">Add Liquidity</span>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
