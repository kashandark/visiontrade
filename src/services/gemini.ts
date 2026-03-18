import { GoogleGenAI, GenerateContentResponse, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  trend: string;
  entryPoint?: string;
  stopLoss?: string;
  takeProfit?: string;
  riskRewardRatio?: string;
  latencyCompensation?: string;
}

export async function analyzeChart(base64Image: string, latencyMs: number): Promise<TradeSignal> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            {
              text: `SYSTEM ROLE: You are a Tier-1 Institutional Quantitative Strategist and Smart Money Concepts (SMC) Expert. 

CRITICAL CONTEXT:
- PLATFORM: 'po.trade' (Pocket Option).
- LATENCY ALERT: The image was captured ${latencyMs}ms ago.
- OBJECTIVE: High-Frequency Profitability. Identify "Scalp-Grade" institutional setups that resolve quickly.

SMC SCALPING PROTOCOL (HIGH-FREQUENCY):
1. INTERNAL STRUCTURE SHIFTS (iMSS): Do not wait for major swing breaks. Look for minor internal structure breaks on the M1 timeframe.
2. MOMENTUM ENTRIES: If a candle closes strongly above/below a minor high/low with high volume (large body), signal IMMEDIATELY.
3. WICK REJECTIONS (SNIPER ENTRY): If price touches a recent Order Block or FVG and immediately leaves a long wick, signal the reversal.
4. ORDER FLOW: Follow the immediate trend. If the last 3 candles are strongly bullish, look for minor pullbacks to buy, rather than waiting for a full sweep.
5. FAST EXITS: Target the very next minor liquidity level. We want to be in and out of the trade in 1-3 minutes.

RISK MANAGEMENT (SCALP-GRADE):
- STOP LOSS (SL): Tight SL just below the entry candle or the minor FVG.
- TAKE PROFIT (TP): Target the nearest internal liquidity pool (minor high/low).
- RISK/REWARD (RR): Minimum 1:1.5. Fast profits are prioritized over high RR.

STRICT EXECUTION RULES:
- Return ONLY a JSON object.
- 'action': 'BUY' or 'SELL' if there is a 85%+ confluence of Momentum + Structure.
- 'confidence': 85% for signals.
- 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY_BEARISH'.
- 'reasoning': Focus on "Internal Structure" and "Immediate Momentum".
- 'entryPoint': The current price or the immediate pullback level.
- 'stopLoss': Tight SL level.
- 'takeProfit': Immediate TP level.
- 'riskRewardRatio': The calculated RR (e.g., "1:1.8").
- 'latencyCompensation': Explain how you adjusted for the ${latencyMs}ms delay.

CRITICAL: If the chart is too zoomed out or blurry, return 'HOLD' and ask for a better view.`,
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Extract JSON from potential markdown blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    
    try {
      const signal = JSON.parse(cleanJson) as TradeSignal;
      // Ensure all required fields exist
      return {
        action: signal.action || 'HOLD',
        confidence: signal.confidence || 0,
        reasoning: signal.reasoning || "Analysis incomplete.",
        trend: signal.trend || 'NEUTRAL',
        entryPoint: signal.entryPoint,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        riskRewardRatio: signal.riskRewardRatio,
        latencyCompensation: signal.latencyCompensation
      };
    } catch (e) {
      console.error("JSON Parse Error:", e, "Raw Text:", text);
      throw new Error("Invalid AI response format");
    }
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      action: 'HOLD',
      confidence: 0,
      reasoning: "System recalibrating. Ensure the chart is stable and high-resolution.",
      trend: 'NEUTRAL'
    };
  }
}
