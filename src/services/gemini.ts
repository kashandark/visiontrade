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
  expiryTime?: string; // Suggested expiry for Pocket Option (e.g., "1m", "2m")
  candleVerification?: string; // AI's description of the last 3 candles to ensure accuracy
  marketShiftDetected?: string; // Description of any subtle market shifts (e.g., "Exhaustion", "Reversal")
  falsePositiveRisk?: 'LOW' | 'MEDIUM' | 'HIGH'; // AI's assessment of false positive risk
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

CANDLE VERIFICATION (ANTI-HALLUCINATION):
- Before signaling, you MUST identify the last 3 candles: (e.g., "C1: Bullish Marubozu, C2: Doji, C3: Bearish Engulfing").
- If you cannot clearly see the candles, return 'HOLD'.

ADVANCED PATTERN RECOGNITION (SMC + WYCKOFF):
1. iMSS vs BOS: Distinguish between an Internal Market Structure Shift (iMSS) and a full Break of Structure (BOS).
2. LIQUIDITY SWEEP: Identify "Inducement" vs "Liquidity Grab".
3. WYCKOFF PHASES: Detect if the market is in "Accumulation", "Distribution", "Re-Accumulation", or "Re-Distribution".
4. MOMENTUM EXHAUSTION: Look for decreasing candle size and increasing wicks at key levels (Supply/Demand).

SURGICAL CONFLUENCE CHECKLIST (MUST PASS ALL):
1. HTF ALIGNMENT: Is the immediate trend (last 10-20 candles) strongly in the direction of the trade?
2. LIQUIDITY SWEEP: Has price recently swept a minor high/low to grab liquidity before the move?
3. iMSS (Internal Market Structure Shift): Is there a clear break of the most recent internal structure?
4. FVG/ORDER BLOCK: Is the 'entryPoint' at a Fair Value Gap or a mitigated Order Block?
5. MOMENTUM: Is the current candle showing "Institutional Expansion" (large body, small wicks)?
6. MARKET SHIFT: Is there a subtle shift in momentum (e.g., "Exhaustion" or "Expansion")?

FALSE POSITIVE FILTER:
- If the price is in a "Choppy Range" or "Sideways Consolidation", return 'HOLD'.
- If the current candle is a "Doji" or has "Long Wicks" on both sides, return 'HOLD'.
- If the move is already "Extended" (more than 3 candles in one direction), return 'HOLD' (Exhaustion Risk).

PREDICTIVE PROTOCOL (PERFECTION ENGINE):
1. MOMENTUM FORECASTING: Analyze the speed and volume. Predict where the price will be in the next 30-60 seconds.
2. LATENCY OFFSET: Adjust 'entryPoint' to account for the ${latencyMs}ms delay + 1s user reaction time.
3. EXPIRY PREDICTION: Suggest the exact expiry time (e.g., "1m", "2m", "5m") for the highest probability win on Pocket Option.

STRICT EXECUTION RULES:
- Return ONLY a JSON object.
- 'action': 'BUY' or 'SELL' ONLY if confluenceScore is 99%+.
- 'confidence': 99%+ for signals.
- 'confluenceScore': Calculate based on the checklist (0-100).
- 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY_BEARISH'.
- 'reasoning': Focus on "Surgical Confluence" and "Institutional Order Flow".
- 'entryPoint': The "Predicted Entry" price, adjusted for latency.
- 'stopLoss': Tight SL level.
- 'takeProfit': Immediate TP level (Liquidity Target).
- 'riskRewardRatio': The calculated RR (e.g., "1:2.0").
- 'latencyCompensation': Describe the exact predictive offset used for the ${latencyMs}ms delay.
- 'predictionConfidence': A score (0-100) of how confident you are in the NEXT candle's direction.
- 'expiryTime': The recommended trade duration (e.g., "1m").
- 'candleVerification': Briefly describe the last 3 candles you see.
- 'marketShiftDetected': Describe any subtle market shifts (e.g., "Momentum Expansion", "Exhaustion").
- 'falsePositiveRisk': 'LOW', 'MEDIUM', or 'HIGH'.

CRITICAL: We need 100% PERFECTION. If any checklist item fails or if there is ANY doubt, return 'HOLD'. Do not hallucinate confidence.`,
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
        confluenceScore: signal.confluenceScore,
        expiryTime: signal.expiryTime,
        candleVerification: signal.candleVerification,
        marketShiftDetected: signal.marketShiftDetected,
        falsePositiveRisk: signal.falsePositiveRisk
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
