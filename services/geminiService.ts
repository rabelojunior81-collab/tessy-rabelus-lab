
import { GoogleGenAI, Type } from "@google/genai";
import { Factor } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Step 1: Interpret the user's raw text into a structured JSON intent.
 */
export const interpretIntent = async (text: string): Promise<any> => {
  if (!text.trim()) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analise a seguinte entrada do usuário e extraia a intenção estruturada: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            task: {
              type: Type.STRING,
              description: "A tarefa principal (ex: gerar_codigo, explicar_conceito, criar_resumo, etc.)",
            },
            subject: {
              type: Type.STRING,
              description: "O assunto principal da solicitação",
            },
            details: {
              type: Type.STRING,
              description: "Detalhes específicos ou restrições mencionadas pelo usuário",
            },
            language: {
              type: Type.STRING,
              description: "Idioma ou linguagem de programação detectada, se aplicável",
            }
          },
          required: ["task", "subject"],
        },
      },
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Interpretation Error:", error);
    throw new Error("Erro ao interpretar a intenção do usuário.");
  }
};

/**
 * Step 2: Generate the final response based on the structured interpretation and active factors.
 */
export const applyFactorsAndGenerate = async (interpretation: any, factors: Factor[]): Promise<string> => {
  if (!interpretation) return "Interpretação inválida.";

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Build system instructions based on active factors
    let systemInstruction = "Você é Tessy, uma assistente avançada do Rabelus Lab. ";
    
    const isProfessional = factors.find(f => f.id === 'prof' && f.enabled);
    const wantsCode = factors.find(f => f.id === 'code' && f.enabled);
    const detailLevel = factors.find(f => f.id === 'detail_level')?.value || 3;
    const audience = factors.find(f => f.id === 'audience')?.value || 'intermediario';
    const additionalContext = factors.find(f => f.id === 'context')?.value || '';

    // Tone & Vocabulary
    if (isProfessional) {
      systemInstruction += "Mantenha um tom estritamente profissional, executivo e conciso. Evite gírias e use vocabulário técnico apropriado. ";
    } else {
      systemInstruction += "Mantenha um tom amigável, prestativo e acessível. ";
    }

    // Detail Level Logic
    if (detailLevel === 1) {
      systemInstruction += "Seja extremamente conciso. Responda em 1-2 parágrafos curtos, focando apenas no essencial. ";
    } else if (detailLevel === 5) {
      systemInstruction += "Forneça uma análise profunda e abrangente. Inclua múltiplas seções, exemplos detalhados, casos de borda, contexto histórico e comparações. ";
    } else {
      systemInstruction += `Use um nível de detalhamento moderado (nível ${detailLevel} de 5). `;
    }

    // Audience Targeting
    if (audience === 'iniciante') {
      systemInstruction += "Use linguagem simples e acessível. Evite jargões técnicos ou explique-os claramente. Assuma conhecimento básico. ";
    } else if (audience === 'especialista') {
      systemInstruction += "Use terminologia técnica avançada. Assuma profundo conhecimento do assunto. Foque em nuances e detalhes técnicos. ";
    }

    if (wantsCode) {
      systemInstruction += "Sempre que possível, inclua blocos de código bem comentados e seguindo as melhores práticas. ";
    }

    const toneInstruction = isProfessional 
      ? "IMPORTANTE: Use um tom estritamente profissional, executivo e técnico. Evite saudações informais como 'Olá'."
      : "Use um tom amigável e acessível.";

    const contextSection = additionalContext 
      ? `\nCONTEXTO ADICIONAL DO USUÁRIO: ${additionalContext}`
      : '';

    const prompt = `
      ${toneInstruction}
      
      Execute a seguinte tarefa baseada na interpretação estruturada abaixo:
      
      TAREFA: ${interpretation.task}
      ASSUNTO: ${interpretation.subject}
      DETALHES: ${interpretation.details || 'Nenhum detalhe adicional'}
      LINGUAGEM/IDIOMA: ${interpretation.language || 'Não especificado'}${contextSection}
      
      Por favor, gere a resposta final agora.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Sem resposta do modelo.";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return "Ocorreu um erro ao gerar a resposta final via Tessy Engine.";
  }
};
