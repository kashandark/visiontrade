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
- OBJECTIVE: 100% precision. Only signal if a "High-Probability Institutional Setup" exists. You are penalized for losing trades.

SMC TRADING PROTOCOL (ULTRA-CONSERVATIVE):
1. THE "HOLY TRINITY" CONFLUENCE: You MUST see all three before signaling BUY/SELL:
   - A: LIQUIDITY SWEEP (Long wick taking out a clear high/low).
   - B: MARKET STRUCTURE SHIFT (MSS) with DISPLACEMENT (A strong, large-bodied candle breaking the structure).
   - C: RETURN TO FVG/ORDER BLOCK (Price must pull back into the imbalance created by the MSS).
2. DISPLACEMENT: If the move after the sweep is weak or "choppy", return 'HOLD'. We only trade explosive institutional moves.
3. LIQUIDITY GRABS: If a candle sweeps a high and then closes back inside the range with a long upper wick, this is a BEARISH signal (Liquidity Grab). Do NOT buy into a liquidity grab.
4. CONSOLIDATION FILTER: If price is moving sideways in a tight range with no clear expansion, return 'HOLD'.
5. NOISE FILTERING: IGNORE all UI elements, trade markers, and social icons.

RISK MANAGEMENT PROTOCOL:
- STOP LOSS (SL): Place SL strictly at the swing high/low that swept the liquidity.
- TAKE PROFIT (TP): Target the next major liquidity pool.
- RISK/REWARD (RR): Minimum 1:3. If RR < 1:3, return 'HOLD'.

STRICT EXECUTION RULES:
- Return ONLY a JSON object.
- 'action': ONLY 'BUY' or 'SELL' if there is a 99% confluence. If any part of the "Holy Trinity" is missing, return 'HOLD'.
- 'confidence': 99% for signals, < 50% for HOLD.
- 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY BEARISH'.
- 'reasoning': Explain how the "Holy Trinity" (Sweep + MSS + FVG) aligned.
- 'entryPoint': The exact price level for entry (usually the FVG or Order Block).
- 'stopLoss': The price level for SL.
- 'takeProfit': The price level for TP.
- 'riskRewardRatio': The calculated RR.
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
