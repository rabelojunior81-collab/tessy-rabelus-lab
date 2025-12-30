
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Factor, AttachedFile, OptimizationResult, ConversationTurn, GroundingChunk } from "../types";
import * as githubService from "./githubService";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

interface GenerateResponse {
  text: string;
  groundingChunks?: GroundingChunk[];
}

/**
 * GitHub Function Declarations for Gemini Function Calling
 */
const GITHUB_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "read_github_file",
    description: "Lê o conteúdo completo de um arquivo específico do repositório GitHub conectado. Use para ler código-fonte, README, documentação, ou qualquer arquivo de texto.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        file_path: {
          type: Type.STRING,
          description: "Caminho completo do arquivo no repositório, ex: README.md, src/App.tsx, package.json"
        }
      },
      required: ["file_path"]
    }
  },
  {
    name: "list_github_directory",
    description: "Lista todos os arquivos e pastas de um diretório específico do repositório GitHub. Use para explorar a estrutura do projeto.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        directory_path: {
          type: Type.STRING,
          description: "Caminho do diretório, vazio para root, ex: src, components"
        }
      },
      required: ["directory_path"]
    }
  },
  {
    name: "search_github_code",
    description: "Busca por código ou texto específico dentro do repositório GitHub. Use para encontrar onde algo está implementado.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Termo de busca, ex: function handleSubmit, import React"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_github_readme",
    description: "Lê o arquivo README.md do repositório GitHub. Use como primeira ação para entender o projeto.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: "list_github_branches",
    description: "Lista todas as branches do repositório GitHub.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: "get_commit_details",
    description: "Obtém detalhes completos de um commit específico, incluindo arquivos modificados, adições e deleções.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        commit_sha: {
          type: Type.STRING,
          description: "SHA do commit, obtido de list_recent_commits"
        }
      },
      required: ["commit_sha"]
    }
  },
  {
    name: "get_repository_structure",
    description: "Obtém a estrutura completa de diretórios e arquivos do repositório até uma profundidade específica. Use para ter visão geral do projeto.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        max_depth: {
          type: Type.NUMBER,
          description: "Profundidade máxima, padrão 2, máximo 3"
        }
      }
    }
  }
];

const githubTools = {
  functionDeclarations: GITHUB_FUNCTION_DECLARATIONS
};

/**
 * Execute GitHub function calls from Gemini with structured success/error responses.
 */
async function executeFunctionCall(fc: { name: string; args: any }, githubToken: string, repoPath: string): Promise<any> {
  try {
    switch (fc.name) {
      case 'read_github_file': {
        const filePath = fc.args.file_path as string;
        const result = await githubService.fetchFileContent(githubToken, repoPath, filePath);
        return { success: true, content: result.content, file_path: filePath };
      }
      case 'list_github_directory': {
        const dirPath = (fc.args.directory_path as string) || '';
        const files = await githubService.fetchDirectoryContents(githubToken, repoPath, dirPath);
        return { success: true, files, directory_path: dirPath };
      }
      case 'search_github_code': {
        const query = fc.args.query as string;
        const results = await githubService.searchCode(githubToken, repoPath, query);
        return { success: true, results, query };
      }
      case 'get_github_readme': {
        const content = await githubService.fetchReadme(githubToken, repoPath);
        return { success: true, content };
      }
      case 'list_github_branches': {
        const branches = await githubService.fetchBranches(githubToken, repoPath);
        return { success: true, branches };
      }
      case 'get_commit_details': {
        const sha = fc.args.commit_sha as string;
        const commit = await githubService.fetchCommitDetails(githubToken, repoPath, sha);
        return { success: true, commit };
      }
      case 'get_repository_structure': {
        const maxDepth = (fc.args.max_depth as number) || 2;
        const structure = await githubService.fetchRepositoryStructure(githubToken, repoPath, maxDepth);
        return { success: true, structure };
      }
      default:
        return { success: false, error: "Função desconhecida" };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Erro na execução da ferramenta GitHub" };
  }
}

/**
 * Step 1: Interpret the user's raw text into a structured JSON intent, considering context.
 */
export const interpretIntent = async (
  text: string, 
  files: AttachedFile[] = [], 
  history: ConversationTurn[] = []
): Promise<any> => {
  if (!text.trim() && files.length === 0) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let contextStr = "";
    if (history.length > 0) {
      const lastTurns = history.slice(-3);
      contextStr = "CONTEXTO DA CONVERSA:\n" + lastTurns.map(t => 
        `Usuário: ${t.userMessage}\nTessy: ${t.tessyResponse.slice(0, 200)}...`
      ).join("\n\n") + "\n\n";
    }

    const parts: any[] = [{ 
      text: `${contextStr}Analise a seguinte nova entrada do usuário e extraia a intenção estruturada: "${text}"` 
    }];
    
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
 * Step 2: Generate the final response based on structured interpretation, active factors, and history.
 */
export const applyFactorsAndGenerate = async (
  interpretation: any, 
  factors: Factor[], 
  files: AttachedFile[] = [],
  history: ConversationTurn[] = [],
  groundingEnabled: boolean = true,
  repoPath?: string,
  githubToken?: string | null
): Promise<GenerateResponse> => {
  if (!interpretation) return { text: "Interpretação inválida." };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });

    let systemInstruction = `Você é Tessy, uma assistente avançada do Rabelus Lab.

**DATA E HORA ATUAL**: ${currentDate} (Horário de Brasília, GMT-3)

IMPORTANTE: Ao responder sobre eventos, notícias, lançamentos ou qualquer informação temporal, SEMPRE considere que AGORA é ${currentDate}. Se a pergunta envolver informações recentes ou eventos após esta data, você DEVE usar grounding (busca em tempo real) para obter dados atualizados. `;
    
    if (groundingEnabled) {
      systemInstruction += "Use busca em tempo real do Google (grounding) para fornecer informações ATUALIZADAS sobre tecnologias, modelos LLM e melhores práticas. Sempre cite fontes quando usar dados externos. ";
    }
    
    if (repoPath) {
      systemInstruction += `Você tem acesso às ferramentas do GitHub para o repositório "${repoPath}". Use-as para ler código, listar diretórios ou buscar informações no projeto se o usuário solicitar algo relacionado ao desenvolvimento deste repositório. `;
    }

    const isProfessional = factors.find(f => f.id === 'prof' && f.enabled);
    const wantsCode = factors.find(f => f.id === 'code' && f.enabled);
    const detailLevel = factors.find(f => f.id === 'detail_level')?.value || 3;
    const audience = factors.find(f => f.id === 'audience')?.value || 'intermediario';
    const additionalContext = factors.find(f => f.id === 'context')?.value || '';

    if (isProfessional) {
      systemInstruction += "Mantenha um tom estritamente profissional, executivo e conciso. ";
    } else {
      systemInstruction += "Mantenha um tom amigável, prestativo e acessível. ";
    }

    if (detailLevel === 1) systemInstruction += "Seja extremamente conciso. ";
    else if (detailLevel === 2) systemInstruction += "Seja breve e direto. ";
    else if (detailLevel === 4) systemInstruction += "Forneça detalhes e exemplos. ";
    else if (detailLevel === 5) systemInstruction += "Forneça uma análise profunda e abrangente em várias seções. ";

    if (audience === 'iniciante') systemInstruction += "Use linguagem simples. ";
    else if (audience === 'especialista') systemInstruction += "Use terminologia técnica avançada. ";

    if (wantsCode) systemInstruction += "Inclua blocos de código bem comentados. ";

    const contextSection = additionalContext ? `\nCONTEXTO ADICIONAL: ${additionalContext}` : '';

    const contents: any[] = [];
    
    // Add history context (last 3 turns)
    if (history.length > 0) {
      history.slice(-3).forEach(turn => {
        contents.push({ role: 'user', parts: [{ text: `Usuário: ${turn.userMessage}` }] });
        contents.push({ role: 'model', parts: [{ text: `Tessy: ${turn.tessyResponse}` }] });
      });
    }

    const currentDateShort = new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Add current request
    const parts: any[] = [{
      text: `**CONTEXTO TEMPORAL**: Hoje é ${currentDateShort}.

Execute a seguinte tarefa:
TAREFA: ${interpretation.task}
ASSUNTO: ${interpretation.subject}
DETALHES: ${interpretation.details || 'Nenhum detalhe'}
LINGUAGEM: ${interpretation.language || 'Não especificado'}${contextSection}

NOTA: Se esta tarefa envolver informações temporais (notícias, eventos recentes, tecnologias lançadas recentemente), você DEVE usar grounding para buscar dados atualizados considerando que hoje é ${currentDateShort}.`
    }];

    for (const file of files) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    }

    contents.push({ role: 'user', parts });

    // Build tools array
    const tools: any[] = [];
    // Fix: Prioritize tools based on context. Only googleSearch is allowed when used, it cannot be combined with functionDeclarations.
    if (repoPath) {
      // Use repository specific tools if available
      tools.push(githubTools);
    } else if (groundingEnabled) {
      // Fallback to search grounding for general information
      tools.push({ googleSearch: {} });
    }

    let response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        tools: tools
      },
    });

    // Handle Function Calling loop
    let iteration = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && iteration < 5) {
      iteration++;
      const modelTurn = response.candidates[0].content;
      contents.push(modelTurn);

      const functionResponses: any[] = [];

      for (const fc of response.functionCalls) {
        let result: any;
        if (!githubToken || !repoPath) {
          result = { success: false, error: "Token do GitHub ou Repositório não configurado." };
        } else {
          result = await executeFunctionCall(fc, githubToken, repoPath);
        }

        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: result
        });
      }

      contents.push({
        parts: functionResponses.map(fr => ({
          functionResponse: fr
        }))
      });

      response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          tools: tools
        },
      });
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return {
      text: response.text || "Sem resposta do modelo.",
      groundingChunks: groundingChunks
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return { text: "Ocorreu um erro ao gerar a resposta final." };
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
