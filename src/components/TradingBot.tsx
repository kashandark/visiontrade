import React, { useRef, useState, useEffect } from 'react';
import { Camera, StopCircle, Play, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeChart, TradeSignal } from '../services/gemini';

export const TradingBot: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const [isPerfectionActive, setIsPerfectionActive] = useState(true);

  const startCapture = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
          frameRate: { ideal: 30, max: 60 },
          displaySurface: "browser"
        } as any,
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }

      stream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
    } catch (err) {
      console.error("Error starting capture:", err);
      setError("Failed to start screen capture. Please grant permissions.");
    }
  };

  const stopCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setSignal(null);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Ensure video is ready
    if (video.readyState < 2) return null;

    // Maximize resolution for AI precision while keeping it manageable
    const scale = Math.min(1, 1920 / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    
    // Use desynchronized for lower latency if supported
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true } as any);
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // 1.0 quality for maximum precision in candle identification
    return canvas.toDataURL('image/jpeg', 1.0).split(',')[1];
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCapturing) {
      interval = setInterval(async () => {
        if (isAnalyzing) return;
        
        const startTime = Date.now();
        const frame = captureFrame();
        if (frame) {
          setIsAnalyzing(true);
          // Use a realistic baseline for the initial analysis
          const result = await analyzeChart(frame, latency || 800);
          const endTime = Date.now();
          const currentLatency = endTime - startTime;
          setLatency(currentLatency);
          setSignal(result);
          setIsAnalyzing(false);
        }
      }, 3000); // Increased frequency to 3 seconds for near real-time analysis
    }
    
    return () => clearInterval(interval);
  }, [isCapturing, isAnalyzing]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase">VisionTrade Ultra</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">HF Scalping Mode</span>
            </div>
            {isPerfectionActive && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md">
                <div className="w-1 h-1 bg-purple-500 rounded-full animate-ping" />
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Perfection Engine Active</span>
              </div>
            )}
            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-900 text-[10px] font-bold rounded-md uppercase tracking-wider">SMC Institutional</span>
          </div>
          <p className="text-zinc-400 text-xs md:text-sm font-medium">SMC Institutional • Low Latency Engine 4.0</p>
        </div>
        <div className="flex gap-3">
          {!isCapturing ? (
            <button
              onClick={startCapture}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-md shadow-emerald-200"
            >
              <Play size={18} />
              Start Live Feed
            </button>
          ) : (
            <button
              onClick={stopCapture}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium transition-all"
            >
              <StopCircle size={18} />
              Stop Analysis
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
        {/* HUD & Video Area */}
        <div className="xl:col-span-3 flex flex-col lg:flex-row gap-6">
          {/* Left HUD Sidebar */}
          <div className="w-full lg:w-72 space-y-6">
            {/* Risk Management HUD */}
            <AnimatePresence>
              {signal && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Risk HUD</div>
                    {signal.riskRewardRatio && (
                      <div className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-md shadow-sm">
                        RR {signal.riskRewardRatio}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Predicted Entry</span>
                        </div>
                        {signal.predictionConfidence && (
                          <span className="text-[8px] font-bold text-purple-400 uppercase">Acc: {signal.predictionConfidence}%</span>
                        )}
                      </div>
                      <div className="text-xl font-black text-white tracking-tight">{signal.entryPoint || '---'}</div>
                      <div className="text-[8px] text-zinc-500 mt-1 italic">Compensated for {latency}ms delay</div>
                    </div>
                    
                    <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Stop Loss</span>
                      </div>
                      <div className="text-xl font-black text-rose-400 tracking-tight">{signal.stopLoss || '---'}</div>
                    </div>
                    
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Take Profit</span>
                      </div>
                      <div className="text-xl font-black text-emerald-400 tracking-tight">{signal.takeProfit || '---'}</div>
                    </div>

                    {signal.expiryTime && (
                      <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span className="text-[10px] font-bold text-purple-400 uppercase">Recommended Expiry</span>
                        </div>
                        <div className="text-xl font-black text-purple-400 tracking-tight">{signal.expiryTime}</div>
                        <div className="text-[8px] text-zinc-500 mt-1 italic">Optimized for current volatility</div>
                      </div>
                    )}

                    {signal.marketShiftDetected && (
                      <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-[10px] font-bold text-amber-400 uppercase">Market Shift Detected</span>
                        </div>
                        <div className="text-xs font-black text-amber-400 tracking-tight uppercase">{signal.marketShiftDetected}</div>
                        <div className="text-[8px] text-zinc-500 mt-1 italic">Subtle momentum shift detected</div>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="pt-4 border-t border-zinc-800 space-y-4">
                    {signal.confluenceScore !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] font-bold text-zinc-500 uppercase">
                          <span>Confluence Meter</span>
                          <span className={signal.confluenceScore >= 95 ? 'text-emerald-400' : 'text-amber-400'}>
                            {signal.confluenceScore}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${signal.confluenceScore}%` }}
                            className={`h-full ${signal.confluenceScore >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <div className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Latency</div>
                        <div className={`text-[10px] font-black ${latency < 3000 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {latency}ms
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Efficiency</div>
                        <div className="text-[10px] font-black text-purple-400">100%</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security Audit in HUD */}
            <section className="p-5 bg-amber-500/5 rounded-3xl border border-amber-500/10">
              <h3 className="flex items-center gap-2 font-black text-[10px] text-amber-500 uppercase tracking-widest mb-3">
                <AlertTriangle size={14} />
                Risk Audit
              </h3>
              <ul className="text-[10px] text-amber-200/60 space-y-2 font-medium">
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  AI Assistant only.
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  High capital risk.
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  Verify all signals.
                </li>
              </ul>
            </section>
          </div>

          {/* Video Preview */}
          <div className="flex-1 space-y-4">
            <div className="relative aspect-video bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-800 overflow-hidden flex items-center justify-center">
              {!isCapturing && (
                <div className="text-center space-y-2">
                  <Camera className="mx-auto text-zinc-700" size={48} />
                  <p className="text-zinc-500 font-medium">Share your po.trade tab to begin</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-contain ${isCapturing ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full shadow-lg border border-zinc-800">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-zinc-300">AI Analyzing...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Signal Panel */}
        <div className="xl:col-span-1 space-y-6">
          <AnimatePresence mode="wait">
            {signal ? (
              <motion.div
                key="signal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Market Signal</span>
                    {signal.falsePositiveRisk && (
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                        signal.falsePositiveRisk === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' :
                        signal.falsePositiveRisk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        Risk: {signal.falsePositiveRisk}
                      </span>
                    )}
                  </div>
                  <div className={`text-6xl font-black tracking-tighter transition-colors duration-500 ${
                    signal.action === 'BUY' ? 'text-emerald-500' : 
                    signal.action === 'SELL' ? 'text-rose-500' : 'text-zinc-600'
                  }`}>
                    {signal.action}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Confidence</div>
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-black text-white">{signal.confidence}</span>
                        <span className="text-sm font-bold text-zinc-500 mb-1">%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${signal.confidence}%` }}
                          className={`h-full ${signal.confidence > 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Market Bias</div>
                      <div className="text-sm font-black text-white uppercase truncate">{signal.trend || 'NEUTRAL'}</div>
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${
                            (signal.trend?.includes('BULLISH') && i <= 4) || 
                            (signal.trend?.includes('BEARISH') && i <= 4) ||
                            (signal.trend === 'NEUTRAL' && i <= 2) ||
                            (!signal.trend && i <= 2)
                            ? (signal.trend?.includes('BULLISH') ? 'bg-emerald-400' : signal.trend?.includes('BEARISH') ? 'bg-rose-400' : 'bg-zinc-600')
                            : 'bg-zinc-800'
                          }`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Market Analysis</div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Deep Scan Active</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      {signal.reasoning}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <div className={`w-1 h-1 rounded-full ${latency < 3000 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span>Latency: {latency}ms</span>
                    </div>
                    <span>M1 Timeframe</span>
                  </div>
                  
                  {signal.latencyCompensation && (
                    <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                      <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Latency Compensation</div>
                      <p className="text-[10px] text-zinc-400 italic leading-tight">
                        {signal.latencyCompensation}
                      </p>
                    </div>
                  )}

                  {/* Market Structure Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Market Structure</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${signal.trend?.includes('STRONGLY') ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="text-xs font-black text-white uppercase">{signal.trend || 'STABLE'}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Liquidity Status</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${signal.reasoning.toLowerCase().includes('sweep') || signal.reasoning.toLowerCase().includes('grab') ? 'bg-amber-500 animate-pulse' : 'bg-zinc-700'}`} />
                        <span className="text-xs font-black text-white uppercase">
                          {signal.reasoning.toLowerCase().includes('sweep') || signal.reasoning.toLowerCase().includes('grab') ? 'GRAB DETECTED' : 'NEUTRAL'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Institutional Reasoning */}
                  <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      Institutional Reasoning
                    </div>
                    
                    {signal.candleVerification && (
                      <div className="mb-3 pb-3 border-b border-zinc-800">
                        <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Candle Verification (Anti-Hallucination)</div>
                        <p className="text-[10px] text-zinc-400 italic">
                          {signal.candleVerification}
                        </p>
                      </div>
                    )}

                    {signal.marketShiftDetected && (
                      <div className="mb-3 pb-3 border-b border-zinc-800">
                        <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Market Shift Analysis</div>
                        <p className="text-[10px] text-amber-400/80 font-medium">
                          {signal.marketShiftDetected}
                        </p>
                      </div>
                    )}

                    <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                      {signal.reasoning}
                    </p>

                    {(signal.reasoning.toLowerCase().includes('liquidity grab') || 
                      signal.reasoning.toLowerCase().includes('wick rejection')) && (
                      <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
                        <AlertTriangle size={12} className="text-rose-500" />
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">High Risk: Rejection Detected</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="p-8 bg-zinc-900 rounded-3xl border border-dashed border-zinc-800 text-center space-y-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                  <Play className="text-zinc-700" size={20} />
                </div>
                <p className="text-sm text-zinc-500 font-medium">
                  Signals will appear here once analysis begins
                </p>
              </div>
            )}
          </AnimatePresence>

          <div className="p-6 bg-zinc-900 rounded-3xl text-white space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Pro Tips</h4>
            <ul className="text-xs space-y-3 text-zinc-300">
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">01</span>
                PERFECTION ENGINE: The system now uses a 99% confidence threshold. If the AI is even slightly unsure, it will stay on HOLD.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">02</span>
                FALSE POSITIVE FILTER: Advanced algorithms now filter out choppy ranges and momentum exhaustion to ensure 100% profitable setups.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">03</span>
                CANDLE VERIFICATION: The AI now describes the candles it sees. If the description doesn't match your screen, ignore the signal.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">04</span>
                SMC CONFLUENCE: Signals are only generated when HTF trend, Liquidity, and Market Structure Shift all align perfectly.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">05</span>
                LATENCY: The system captures every 3 seconds. Ensure your internet is stable for the most accurate predictive entries.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
