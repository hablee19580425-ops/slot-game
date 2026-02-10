
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getDeepSeaAdvice = async (credit: number, lastWin: number) => {
  try {
    const prompt = `You are the Deep Sea Oracle. A gambler is playing your slots. 
    Current Credits: ${credit}. 
    Last Win: ${lastWin}. 
    Give a cryptic, deep-sea themed short fortune or advice (max 20 words). 
    Use oceanic metaphors like currents, trenches, bioluminescence, or sea monsters.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a mystical deep sea entity. Be concise, atmospheric, and slightly ominous but encouraging.",
        temperature: 0.8,
      }
    });

    return response.text || "The tides are silent today...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The currents shift unpredictably...";
  }
};
