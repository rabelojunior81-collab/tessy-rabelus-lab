
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
        const [owner, repo] = repoPath.split('/');
        
        let searchResult: any;
        try {
          const items = await githubService.searchCode(githubToken, repoPath, query);
          searchResult = { success: true, items: items };
        } catch (e) {
          searchResult = { success: false };
        }

        if (searchResult.success && searchResult.items && searchResult.items.length > 0) {
          return searchResult;
        }

        const structure = await githubService.fetchRepositoryStructure(githubToken, repoPath, 2);
        const structureResult = { success: !!structure, tree: structure };

        if (structureResult.success === false) {
          return structureResult;
        }

        const matchingFiles: any[] = [];
        const searchInStructure = async (items: any[]) => {
          for (const item of items) {
            if (item.type === 'file') {
              if (item.path.endsWith('.ts') || item.path.endsWith('.tsx') || item.path.endsWith('.js') || item.path.endsWith('.jsx')) {
                const fileData = await githubService.fetchFileContent(githubToken, repoPath, item.path);
                const fileResult = { success: true, content: fileData.content };

                if (fileResult.success && fileResult.content) {
                  const lines = fileResult.content.split('\n');
                  const lineMatches: any[] = [];
                  lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                      lineMatches.push({
                        line: line.trim(),
                        lineNumber: index + 1
                      });
                    }
                  });

                  if (lineMatches.length > 0) {
                    matchingFiles.push({
                      path: item.path,
                      name: item.name,
                      matches: lineMatches
                    });
                  }
                }
              }
            } else if (item.type === 'dir' && item.items) {
              await searchInStructure(item.items);
            }
          }
        };

        if (structureResult.tree && structureResult.tree.items) {
          await searchInStructure(structureResult.tree.items);
        }

        if (matchingFiles.length === 0) {
          return {
            success: false,
            error: "Nenhum arquivo encontrado contendo a query especificada",
            fallbackUsed: true
          };
        }

        return {
          success: true,
          items: matchingFiles,
          message: "Resultados encontrados via busca manual (GitHub Code Search indisponível)",
          fallbackUsed: true,
          totalCount: matchingFiles.length
        };
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
      contents: [{ parts }],
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
          required: ["task", "subject", "details", "language"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro na interpretação de intenção:", error);
    return {
      task: "conversa_geral",
      subject: text.slice(0, 50),
      details: text,
      language: "Português"
    };
  }
};

/**
 * Step 2: Generate response using factors, context, and optional tools (GitHub/Search).
 */
export const applyFactorsAndGenerate = async (
  intent: any,
  factors: Factor[],
  files: AttachedFile[],
  history: ConversationTurn[],
  groundingEnabled: boolean,
  repoPath?: string,
  githubToken?: string
): Promise<GenerateResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Determine Model
  const useFlash = factors.find(f => f.id === 'flash')?.enabled ?? true;
  const model = useFlash ? MODEL_FLASH : MODEL_PRO;

  // 2. Build System Instruction from Factors
  const isProf = factors.find(f => f.id === 'prof')?.enabled;
  const detailLevel = factors.find(f => f.id === 'detail_level')?.value || 3;
  const audience = factors.find(f => f.id === 'audience')?.value || 'intermediario';
  const additionalContext = factors.find(f => f.id === 'context')?.value || '';
  
  let systemInstruction = `Você é Tessy, uma IA avançada desenvolvida pelo Rabelus Lab.
  Tarefa Atual: ${intent.task} sobre ${intent.subject}.
  Idioma: ${intent.language || 'Português'}.
  Detalhes detectados: ${intent.details || 'Nenhum'}.
  
  DIRETRIZES:
  - Tom: ${isProf ? 'Rigorosamente profissional e técnico.' : 'Prestativo e amigável.'}
  - Nível de Detalhe: ${detailLevel}/5 (onde 1 é muito conciso e 5 é exaustivo).
  - Público-alvo: ${audience.toUpperCase()}.
  ${additionalContext ? `- Contexto Adicional: ${additionalContext}` : ''}
  
  Se houver arquivos anexados, analise-os com prioridade.`;

  // 3. Configure Tools
  let tools: any[] = [];
  // Per guidelines, googleSearch cannot be used with other tools.
  if (groundingEnabled) {
    tools.push({ googleSearch: {} });
  } else if (repoPath && githubToken) {
    tools.push(githubTools);
  }

  // 4. Build Contents (History + Current Message)
  const contents: any[] = [];
  
  // Add history (last 10 turns to keep context manageable)
  history.slice(-10).forEach(turn => {
    contents.push({ role: 'user', parts: [{ text: turn.userMessage }] });
    contents.push({ role: 'model', parts: [{ text: turn.tessyResponse }] });
  });

  // Current message parts
  const currentParts: any[] = [{ text: intent.details || intent.subject || "Processar solicitação" }];
  files.forEach(file => {
    currentParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });
  contents.push({ role: 'user', parts: currentParts });

  // 5. Generate Content
  let response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      tools: tools.length > 0 ? tools : undefined,
    },
  });

  // 6. Handle Function Calls (for GitHub tools)
  if (!groundingEnabled && response.functionCalls && repoPath && githubToken) {
    const functionResponses: any[] = [];
    for (const fc of response.functionCalls) {
      const result = await executeFunctionCall(fc, githubToken, repoPath);
      functionResponses.push({
        id: fc.id,
        name: fc.name,
        response: result
      });
    }

    // Send tool responses back
    if (functionResponses.length > 0) {
      // Add the model's turn with function calls
      contents.push(response.candidates[0].content);
      // Add the tool response turn
      contents.push({
        role: 'user',
        parts: functionResponses.map(fr => ({
          functionResponse: fr
        }))
      });

      // Final generation
      response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction },
      });
    }
  }

  return {
    text: response.text || "Desculpe, não consegui gerar uma resposta.",
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

/**
 * Step 3: Optimize a prompt based on previous interaction context.
 */
export const optimizePrompt = async (
  userMessage: string,
  interpretation: any,
  lastResponse: string
): Promise<OptimizationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `Você é um engenheiro de prompts especialista. 
  Sua tarefa é analisar um prompt do usuário e a resposta da IA para sugerir melhorias.
  Retorne um JSON seguindo estritamente o schema fornecido.`;

  const prompt = `Analise a seguinte interação:
  USUÁRIO: "${userMessage}"
  INTENÇÃO DETECTADA: ${JSON.stringify(interpretation)}
  RESPOSTA DA IA: "${lastResponse.slice(0, 500)}..."
  
  Otimize o prompt do usuário para obter resultados ainda melhores (mais precisos e completos).`;

  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
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
                recommendation: { type: Type.STRING }
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

  try {
    return JSON.parse(response.text);
  } catch (e) {
    throw new Error("Falha ao processar otimização do prompt.");
  }
};
