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
- LATENCY ALERT: The image you are seeing was captured ${latencyMs}ms ago. 
- OBJECTIVE: You must perform "Predictive Price Action Analysis". Do not just analyze what you see; analyze what is LIKELY to happen in the NEXT 60 seconds, accounting for the fact that the market has already moved since this capture.

SMC TRADING PROTOCOL:
1. LIQUIDITY ANALYSIS: Identify 'Equal Highs/Lows' (Liquidity Pools). Look for 'Liquidity Sweeps' before a move.
2. MARKET STRUCTURE SHIFT (MSS): Only issue a BUY/SELL if a clear MSS has occurred (Break of Structure - BOS).
3. FAIR VALUE GAPS (FVG): Identify imbalances. Price often returns to fill these gaps.
4. ORDER BLOCKS: Identify the last candle before a strong impulsive move.
5. LATENCY COMPENSATION: If the current candle in the image is already at a major resistance/support, the trade might be too late. Only signal if the move is in its EARLY stages or if a RE-TEST is expected.

STRICT EXECUTION RULES:
- Return ONLY a JSON object.
- 'action': ONLY 'BUY' or 'SELL' if there is a 95%+ confluence of SMC factors AND the latency does not invalidate the entry. Otherwise, return 'HOLD'.
- 'confidence': Be brutally honest. 
- 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY BEARISH'.
- 'reasoning': Deep technical breakdown.
- 'entryPoint': The exact price level for entry.
- 'latencyCompensation': Explain how you adjusted your decision based on the ${latencyMs}ms delay.

CRITICAL: You are analyzing a 'po.trade' (Pocket Option) chart. Focus ONLY on the price action candles.`,
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
