/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TradingBot } from './components/TradingBot';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-white font-black text-xl leading-none">V</span>
            </div>
            <span className="font-bold text-zinc-900 tracking-tight">VisionTrade</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Network: Live</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      </nav>

      <main className="py-12">
        <TradingBot />
      </main>

      <footer className="py-12 border-t border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">VisionTrade AI v1.0</p>
          <p className="text-[10px] text-zinc-400 max-w-md mx-auto leading-relaxed">
            VisionTrade uses advanced multimodal AI to analyze visual market data. 
            Automated trading carries significant risk. Always trade responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}

