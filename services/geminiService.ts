
import { GoogleGenAI, Type } from "@google/genai";
import { Factor, AttachedFile, OptimizationResult } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

/**
 * Step 1: Interpret the user's raw text into a structured JSON intent.
 */
export const interpretIntent = async (text: string, files: AttachedFile[] = []): Promise<any> => {
  if (!text.trim() && files.length === 0) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [{ text: `Analise a seguinte entrada do usuário e extraia a intenção estruturada: "${text}"` }];
    
    // Add files to context for interpretation
    for (const file of files) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            task: {
              type: Type.STRING,
              description: "A tarefa principal (ex: gerar_codigo, explicar_conceito, criar_resumo, descrever_imagem, etc.)",
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
export const applyFactorsAndGenerate = async (interpretation: any, factors: Factor[], files: AttachedFile[] = []): Promise<string> => {
  if (!interpretation) return "Interpretação inválida.";

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let systemInstruction = "Você é Tessy, uma assistente avançada do Rabelus Lab. ";
    
    const isProfessional = factors.find(f => f.id === 'prof' && f.enabled);
    const wantsCode = factors.find(f => f.id === 'code' && f.enabled);
    const detailLevel = factors.find(f => f.id === 'detail_level')?.value || 3;
    const audience = factors.find(f => f.id === 'audience')?.value || 'intermediario';
    const additionalContext = factors.find(f => f.id === 'context')?.value || '';

    if (isProfessional) {
      systemInstruction += "Mantenha um tom estritamente profissional, executivo e conciso. Evite gírias. ";
    } else {
      systemInstruction += "Mantenha um tom amigável, prestativo e acessível. ";
    }

    // Refactored Gradual Detail Levels
    if (detailLevel === 1) {
      systemInstruction += "Seja extremamente conciso. Responda em 1 ou 2 parágrafos curtos. ";
    } else if (detailLevel === 2) {
      systemInstruction += "Seja conciso mas forneça uma resposta completa. Responda em 2 ou 3 parágrafos. ";
    } else if (detailLevel === 3) {
      systemInstruction += "Forneça uma resposta balanceada com os detalhes mais relevantes. ";
    } else if (detailLevel === 4) {
      systemInstruction += "Forneça uma resposta detalhada, incluindo exemplos práticos e contexto adicional. ";
    } else if (detailLevel === 5) {
      systemInstruction += "Forneça uma análise profunda e abrangente. Organize a resposta em múltiplas seções, inclua exemplos práticos, considere casos de borda e faça comparações se necessário. ";
    }

    if (audience === 'iniciante') {
      systemInstruction += "Use linguagem simples. ";
    } else if (audience === 'especialista') {
      systemInstruction += "Use terminologia técnica avançada. ";
    }

    if (wantsCode) {
      systemInstruction += "Inclua blocos de código bem comentados. ";
    }

    const contextSection = additionalContext ? `\nCONTEXTO ADICIONAL: ${additionalContext}` : '';

    const parts: any[] = [{
      text: `Execute a seguinte tarefa:
      TAREFA: ${interpretation.task}
      ASSUNTO: ${interpretation.subject}
      DETALHES: ${interpretation.details || 'Nenhum detalhe'}
      LINGUAGEM: ${interpretation.language || 'Não especificado'}${contextSection}`
    }];

    // Add files
    for (const file of files) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Sem resposta do modelo.";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return "Ocorreu um erro ao gerar a resposta final.";
  }
};

/**
 * Advanced Feature: Optimize Prompt using Gemini Pro
 */
export const optimizePrompt = async (userInput: string, interpretation: any, generatedResponse: string): Promise<OptimizationResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Você é um especialista em engenharia de prompts. Analise o seguinte prompt e resposta:

PROMPT ORIGINAL: ${userInput}
INTERPRETAÇÃO: ${JSON.stringify(interpretation)}
RESPOSTA GERADA (Resumo): ${generatedResponse.slice(0, 500)}

Analise a qualidade do prompt original e forneça:
1. Score de clareza (1-10)
2. Score de completude (1-10)
3. 3-5 sugestões concretas de melhoria (categoria, problema, recomendação)
4. Versão otimizada do prompt (reescrita melhorada)

Retorne em formato JSON estruturado.`;

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clarity_score: { type: Type.NUMBER },
            completeness_score: { type: Type.NUMBER },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ["category", "issue", "recommendation"]
              }
            },
            optimized_prompt: { type: Type.STRING }
          },
          required: ["clarity_score", "completeness_score", "suggestions", "optimized_prompt"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as OptimizationResult;
  } catch (error) {
    console.error("Optimization Error:", error);
    throw new Error("Erro ao otimizar prompt.");
  }
};
