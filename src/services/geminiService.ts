import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface StockData {
  ticker: string;
  lpa: number;
  vpa: number;
  price: number;
  dividend: number;
  growth: number;
}

export async function fetchStockData(ticker: string): Promise<StockData | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Forneça os dados fundamentalistas mais recentes para a ação ${ticker}. 
      Preciso dos seguintes valores: 
      - LPA (Lucro por Ação)
      - VPA (Valor Patrimonial por Ação)
      - Preço Atual de Mercado
      - Dividendos Totais pagos nos últimos 12 meses (R$)
      - Taxa de Crescimento Anual Estimada para os próximos 5 anos (%)
      
      Seja o mais preciso possível de acordo com sua base de dados ou busca.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ticker: { type: Type.STRING },
            lpa: { type: Type.NUMBER },
            vpa: { type: Type.NUMBER },
            price: { type: Type.NUMBER },
            dividend: { type: Type.NUMBER },
            growth: { type: Type.NUMBER },
          },
          required: ["ticker", "lpa", "vpa", "price", "dividend", "growth"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as StockData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return null;
  }
}
