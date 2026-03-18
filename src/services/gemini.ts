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
- OBJECTIVE: 100% precision. Only signal if a clear SMC setup exists.

SMC TRADING PROTOCOL (VISUAL IDENTIFICATION):
1. LIQUIDITY SWEEPS: Look for long wicks that take out previous swing highs/lows. If a candle sweeps a high and then closes back inside the range with a long upper wick, this is a BEARISH signal (Liquidity Grab), NOT a buy signal.
2. MARKET STRUCTURE SHIFT (MSS): A candle MUST close with a solid body above/below the previous swing high/low. Wicks do not count as a break of structure.
3. WICK REJECTIONS: Large upper wicks at resistance or lower wicks at support indicate institutional rejection. Do not trade against these wicks.
4. FAIR VALUE GAPS (FVG): Identify imbalances. Price often returns to fill these gaps.
5. NOISE FILTERING: IGNORE all UI elements, trade markers (e.g., "$10" labels, red/green dots), and social icons. Focus ONLY on the raw candle price action.

RISK MANAGEMENT PROTOCOL:
- STOP LOSS (SL): Place SL strictly at the previous swing high/low or the far side of the Order Block.
- TAKE PROFIT (TP): Target the next major liquidity pool (Equal Highs/Lows) or the next Fair Value Gap.
- RISK/REWARD (RR): Aim for a minimum of 1:3. If the RR is less than 1:2, return 'HOLD'.

STRICT EXECUTION RULES:
- Return ONLY a JSON object.
- 'action': ONLY 'BUY' or 'SELL' if there is a 95%+ confluence. If you see a long wick rejection at the top of a move, even if the trend is bullish, return 'HOLD' or 'SELL' (if it's a sweep).
- 'confidence': Be brutally honest. If the setup is ambiguous, confidence must be < 50%.
- 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY BEARISH'.
- 'reasoning': Explain the specific SMC setup. Mention if a "Liquidity Grab" or "Wick Rejection" was detected.
- 'entryPoint': The exact price level for entry.
- 'stopLoss': The price level for SL.
- 'takeProfit': The price level for TP.
- 'riskRewardRatio': The calculated RR (e.g., "1:3.5").
- 'latencyCompensation': Explain how you adjusted your decision based on the ${latencyMs}ms delay.

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
