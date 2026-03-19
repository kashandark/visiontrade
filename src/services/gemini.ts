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
  confluenceScore?: number;
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
- OBJECTIVE: 100% Profitable Confluence. Zero-tolerance for "noise" or "low-probability" trades.

SURGICAL CONFLUENCE CHECKLIST (MUST PASS ALL):
1. HTF ALIGNMENT: Is the immediate trend (last 10-20 candles) strongly in the direction of the trade?
2. LIQUIDITY SWEEP: Has price recently swept a minor high/low to grab liquidity before the move?
3. iMSS (Internal Market Structure Shift): Is there a clear break of the most recent internal structure?
4. FVG/ORDER BLOCK: Is the 'entryPoint' at a Fair Value Gap or a mitigated Order Block?
5. MOMENTUM: Is the current candle showing "Institutional Expansion" (large body, small wicks)?

PREDICTIVE PROTOCOL (PERFECTION ENGINE):
1. MOMENTUM FORECASTING: Analyze the speed and volume. Predict where the price will be in the next 30-60 seconds.
2. LATENCY OFFSET: Adjust 'entryPoint' to account for the ${latencyMs}ms delay + 1s user reaction time.
3. ZERO-LAG SIGNALS: Signal ONLY at the start of an expansion, never at the end.

STRICT EXECUTION RULES:
- Return ONLY a JSON object.
- 'action': 'BUY' or 'SELL' ONLY if confluenceScore is 95%+.
- 'confidence': 95%+ for signals.
- 'confluenceScore': Calculate based on the checklist (0-100).
- 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY_BEARISH'.
- 'reasoning': Focus on "Surgical Confluence" and "Institutional Order Flow".
- 'entryPoint': The "Predicted Entry" price, adjusted for latency.
- 'stopLoss': Tight SL level.
- 'takeProfit': Immediate TP level (Liquidity Target).
- 'riskRewardRatio': The calculated RR (e.g., "1:2.0").
- 'latencyCompensation': Describe the exact predictive offset used for the ${latencyMs}ms delay.
- 'predictionConfidence': A score (0-100) of how confident you are in the NEXT candle's direction.

CRITICAL: We need 100% PERFECTION. If any checklist item fails, return 'HOLD'.`,
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
        latencyCompensation: signal.latencyCompensation,
        predictionConfidence: signal.predictionConfidence,
        confluenceScore: signal.confluenceScore
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
