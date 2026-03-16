import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  trend: string;
}

export async function analyzeChart(base64Image: string): Promise<TradeSignal> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `You are a Professional Senior Quantitative Trader and Technical Analyst specializing in 1-minute (M1) binary options trading. 
              
              Your task is to analyze the provided chart image with extreme precision. 
              
              Follow this professional protocol:
              1. CANDLESTICK ANALYSIS: Identify patterns (Engulfing, Pin Bars, Dojis, Marubozu). Look at the last 5-10 candles for momentum.
              2. TREND IDENTIFICATION: Determine the micro-trend (Higher Highs/Lower Lows) and macro-trend.
              3. SUPPORT & RESISTANCE: Identify immediate zones where price might bounce or break.
              4. INDICATOR ESTIMATION: If visible, analyze RSI (overbought/oversold), MACD (crossovers), and Moving Averages.
              5. VOLUME/VOLATILITY: Assess the size of candles relative to previous ones.

              OUTPUT REQUIREMENTS:
              - Return ONLY a JSON object.
              - 'action': Must be 'BUY', 'SELL', or 'HOLD'. Be conservative; only suggest BUY/SELL if confidence > 75%.
              - 'confidence': A realistic percentage (0-100) based on signal strength.
              - 'trend': 'STRONGLY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', or 'STRONGLY BEARISH'.
              - 'reasoning': A professional, concise technical summary (e.g., "Bearish engulfing at resistance zone with RSI divergence").
              
              Focus on high-probability setups for the next 1-3 minutes.`,
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
      reasoning: "Failed to analyze chart. Please ensure the chart is clearly visible.",
      trend: 'NEUTRAL'
    };
  }
}
