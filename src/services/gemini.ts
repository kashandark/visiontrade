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
  predictionConfidence?: number;
}

export async function analyzeChart(base64Image: string, latencyMs: number): Promise<TradeSignal> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            {
              text: `SYSTEM ROLE: You are a Tier-1 Institutional Quantitative Strategist, SMC Expert, and Predictive Perfectionist. 

CRITICAL CONTEXT:
- PLATFORM: 'po.trade' (Pocket Option).
- LATENCY ALERT: The image was captured ${latencyMs}ms ago. 
- PERFECTION ENGINE: You MUST compensate for this ${latencyMs}ms delay by predicting the NEXT candle's movement based on current momentum and institutional order flow. 
- OBJECTIVE: Constantly Perfect Signals. Zero-tolerance for "late" entries.

PREDICTIVE PROTOCOL (PERFECTION ENGINE):
1. MOMENTUM FORECASTING: Analyze the speed and volume of the current candle. Predict where the price will be in the next 30-60 seconds.
2. INSTITUTIONAL LIQUIDITY (IL): Identify "Magnet" zones (FVG, OB, Liquidity Pools) that price is being drawn to.
3. INTERNAL STRUCTURE SHIFTS (iMSS): Identify the exact micro-second a structure shift occurs to signal the "Sniper" entry.
4. LATENCY OFFSET: If price is moving fast, adjust your 'entryPoint' to a level that accounts for the ${latencyMs}ms delay + the user's reaction time (approx 1s).
5. ZERO-LAG SIGNALS: If you detect a "High-Probability Institutional Expansion", signal IMMEDIATELY.

STRICT EXECUTION RULES:
- Return ONLY a JSON object.
- 'action': 'BUY' or 'SELL' only if 90%+ confidence.
- 'confidence': 90%+ for signals.
- 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY_BEARISH'.
- 'reasoning': Focus on "Predictive Momentum" and "Liquidity Magnets".
- 'entryPoint': The "Predicted Entry" price, adjusted for latency.
- 'stopLoss': Tight SL level.
- 'takeProfit': Immediate TP level (Liquidity Target).
- 'riskRewardRatio': The calculated RR (e.g., "1:2.0").
- 'latencyCompensation': Describe the exact predictive offset used for the ${latencyMs}ms delay.
- 'predictionConfidence': A score (0-100) of how confident you are in the NEXT candle's direction.

CRITICAL: We need PERFECTION. If the signal is not 100% clear, return 'HOLD'.`,
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
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
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
