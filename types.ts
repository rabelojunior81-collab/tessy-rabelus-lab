export type FactorType = 'toggle' | 'slider' | 'dropdown' | 'text';

export interface Factor {
  id: string;
  type: FactorType;
  label: string;
  enabled: boolean;
  value?: any;
  options?: string[];
  min?: number;
  max?: number;
  description?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ConversationTurn {
  id: string;
  userMessage: string;
  tessyResponse: string;
  timestamp: number;
  attachedFiles?: AttachedFile[];
  groundingChunks?: GroundingChunk[];
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  turns: ConversationTurn[];
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface RepositoryItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  content?: string;
  factors?: Factor[];
  timestamp: number;
  tags?: string[];
}

export interface AttachedFile {
  id: string;
  projectId?: string;
  name: string;
  mimeType: string;
  data: string; // base64 or blob
  size: number;
  blob?: Blob;
}

export interface OptimizationSuggestion {
  category: string;
  issue: string;
  recommendation: string;
}

export interface OptimizationResult {
  clarity_score: number;
  completeness_score: number;
  suggestions: OptimizationSuggestion[];
  optimized_prompt: string;
}

export interface Template {
  id: string;
  category: 'Código' | 'Escrita' | 'Análise' | 'Ensino' | 'Criativo' | 'Personalizado';
  label: string;
  content: string;
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface AppPersistedState {
  lastConversationId: string | null;
  factors: Factor[];
}
