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
- PLATFORM: 'po.trade' (Pocket Option).
- LATENCY ALERT: The image was captured ${latencyMs}ms ago.
- OBJECTIVE: 100% precision. Only signal if a clear SMC setup exists.

SMC TRADING PROTOCOL (VISUAL IDENTIFICATION):
1. LIQUIDITY SWEEPS: Look for long wicks that take out previous swing highs/lows. This is the "Fuel" for the move.
2. MARKET STRUCTURE SHIFT (MSS): A candle MUST close above/below the previous swing high/low (Break of Structure).
3. FAIR VALUE GAPS (FVG): Identify 3-candle sequences where the 1st and 3rd candle wicks do not overlap.
4. ORDER BLOCKS: The last opposite-colored candle before a strong impulsive move that breaks structure.
5. NOISE FILTERING: IGNORE social trading icons (small profile pictures), trade history dots, and UI buttons. Focus ONLY on the candles and the price axis.

STRICT EXECUTION RULES:
- Return ONLY a JSON object.
- 'action': ONLY 'BUY' or 'SELL' if there is a 95%+ confluence of SMC factors AND the latency does not invalidate the entry. Otherwise, return 'HOLD'.
- 'confidence': Be brutally honest. 
- 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY BEARISH'.
- 'reasoning': Explain the specific SMC setup (e.g., "Liquidity sweep of internal range liquidity followed by MSS and FVG fill").
- 'entryPoint': The exact price level for entry.
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
