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
}

export async function analyzeChart(base64Image: string): Promise<TradeSignal> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            {
              text: `SYSTEM ROLE: You are a Tier-1 Institutional Quantitative Strategist and Smart Money Concepts (SMC) Expert. Your objective is 100% precision in identifying high-probability reversals and continuations on M1 charts.

SMC TRADING PROTOCOL:
1. LIQUIDITY ANALYSIS: Identify 'Equal Highs/Lows' (Liquidity Pools). Look for 'Liquidity Sweeps' (wicks taking out previous highs/lows) before a move.
2. MARKET STRUCTURE SHIFT (MSS): Only issue a BUY/SELL if a clear MSS has occurred (Break of Structure - BOS).
3. FAIR VALUE GAPS (FVG): Identify imbalances in price delivery. Price often returns to fill these gaps.
4. ORDER BLOCKS: Identify the last candle before a strong impulsive move. This is your high-probability entry zone.
5. MULTI-TIMEFRAME CONTEXT: Even on M1, look for the 'Big Picture' trend visible in the zoom level.

STRICT EXECUTION RULES:
- Return ONLY a JSON object.
- 'action': ONLY 'BUY' or 'SELL' if there is a 90%+ confluence of SMC factors. Otherwise, return 'HOLD'.
- 'confidence': Be brutally honest. If the setup is 'B-grade', return 'HOLD'.
- 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY BEARISH'.
- 'reasoning': Use professional SMC terminology (e.g., "Liquidity sweep of internal range liquidity followed by MSS and FVG fill").
- 'entryPoint': Pinpoint the exact price level for entry.
- 'stopLoss': Suggested safety level.
- 'takeProfit': Target level for the 1-minute window.

CRITICAL: You are analyzing a 'po.trade' (Pocket Option) chart. Ignore UI elements, focus ONLY on the price action candles.`,
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
    
    return JSON.parse(text) as TradeSignal;
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
