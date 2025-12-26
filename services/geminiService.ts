
import { GoogleGenAI } from "@google/genai";

export const interpretIntent = async (text: string): Promise<string> => {
  if (!text.trim()) return "Por favor, insira um texto para interpretação.";

  try {
    // Note: process.env.API_KEY is pre-configured in this environment.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Interprete a seguinte intenção do usuário e forneça uma resposta útil, estruturada e detalhada: "${text}"`,
    });

    return response.text || "Sem resposta do modelo.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao processar sua solicitação via Gemini API.";
  }
};
