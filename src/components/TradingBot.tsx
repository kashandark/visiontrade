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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Use desynchronized for lower latency if supported
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true } as any);
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // 0.9 quality is significantly faster than 1.0 for base64 encoding
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
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
          // Reduced baseline to 800ms for optimized stream
          const result = await analyzeChart(frame, 800);
          const endTime = Date.now();
          setLatency(endTime - startTime + 800);
          setSignal(result);
          setIsAnalyzing(false);
        }
      }, 5000); // Increased frequency to 5 seconds for lower perceived delay
    }
    
    return () => clearInterval(interval);
  }, [isCapturing, isAnalyzing]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">VisionTrade Ultra</h1>
            <span className="px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">SMC Institutional</span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">SMC Institutional • Low Latency Engine 4.0</p>
        </div>
        <div className="flex gap-3">
          {!isCapturing ? (
            <button
              onClick={startCapture}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-md shadow-emerald-200"
            >
              <Play size={18} />
              Start Live Feed
            </button>
          ) : (
            <button
              onClick={stopCapture}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium transition-all"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-zinc-100 rounded-2xl border-2 border-dashed border-zinc-200 overflow-hidden flex items-center justify-center">
            {!isCapturing && (
              <div className="text-center space-y-2">
                <Camera className="mx-auto text-zinc-300" size={48} />
                <p className="text-zinc-400 font-medium">Share your po.trade tab to begin</p>
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
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-zinc-100">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-zinc-700">AI Analyzing...</span>
                </div>
              </div>
            )}
          </div>

          <section className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
            <h3 className="flex items-center gap-2 font-bold text-amber-900 mb-2">
              <AlertTriangle size={18} />
              Security & Risk Audit
            </h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside opacity-90">
              <li>This AI is an assistant, not a financial advisor.</li>
              <li>Trading binary options involves high risk of capital loss.</li>
              <li>Latency in screen sharing can affect signal accuracy on M1.</li>
              <li>Always verify signals with your own technical analysis.</li>
            </ul>
          </section>
        </div>

        {/* Signal Panel */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {signal ? (
              <motion.div
                key="signal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Market Signal</span>
                  </div>
                  <div className={`text-6xl font-black tracking-tighter transition-colors duration-500 ${
                    signal.action === 'BUY' ? 'text-emerald-600' : 
                    signal.action === 'SELL' ? 'text-rose-600' : 'text-zinc-400'
                  }`}>
                    {signal.action}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Confidence</div>
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-black text-zinc-900">{signal.confidence}</span>
                        <span className="text-sm font-bold text-zinc-400 mb-1">%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-200 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${signal.confidence}%` }}
                          className={`h-full ${signal.confidence > 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Market Bias</div>
                      <div className="text-sm font-black text-zinc-900 uppercase truncate">{signal.trend || 'NEUTRAL'}</div>
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${
                            (signal.trend?.includes('BULLISH') && i <= 4) || 
                            (signal.trend?.includes('BEARISH') && i <= 4) ||
                            (signal.trend === 'NEUTRAL' && i <= 2) ||
                            (!signal.trend && i <= 2)
                            ? (signal.trend?.includes('BULLISH') ? 'bg-emerald-400' : signal.trend?.includes('BEARISH') ? 'bg-rose-400' : 'bg-zinc-300')
                            : 'bg-zinc-200'
                          }`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {signal.entryPoint && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                        <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Entry</div>
                        <div className="text-xs font-black text-emerald-900">{signal.entryPoint}</div>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                        <div className="text-[8px] font-bold text-rose-600 uppercase tracking-wider">Stop</div>
                        <div className="text-xs font-black text-rose-900">{signal.stopLoss}</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                        <div className="text-[8px] font-bold text-blue-600 uppercase tracking-wider">Target</div>
                        <div className="text-xs font-black text-blue-900">{signal.takeProfit}</div>
                      </div>
                    </div>
                  )}

                  <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Institutional Reasoning</div>
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

                <div className="pt-4 border-t border-zinc-50 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <div className={`w-1 h-1 rounded-full ${latency < 3000 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span>Latency: {latency}ms</span>
                    </div>
                    <span>M1 Timeframe</span>
                  </div>
                  {signal.latencyCompensation && (
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Latency Compensation</div>
                      <p className="text-[10px] text-zinc-500 italic leading-tight">
                        {signal.latencyCompensation}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="p-8 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 text-center space-y-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                  <Play className="text-zinc-300" size={20} />
                </div>
                <p className="text-sm text-zinc-400 font-medium">
                  Signals will appear here once analysis begins
                </p>
              </div>
            )}
          </AnimatePresence>

          <div className="p-6 bg-zinc-900 rounded-3xl text-white space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Pro Tips</h4>
            <ul className="text-xs space-y-3 text-zinc-300">
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">01</span>
                Keep the po.trade window active and clearly visible.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">02</span>
                Wait for confidence levels above 80% for better accuracy.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">03</span>
                Use the "Candle" view on po.trade for best AI recognition.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">04</span>
                The AI compensates for a ~1.5s-3s latency. If your internet is slow, wait for "Retest" signals.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
