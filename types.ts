
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
  id: string; // UUID v4 format
  userMessage: string;
  tessyResponse: string;
  timestamp: number; // ms since epoch
  attachedFiles?: AttachedFile[];
  groundingChunks?: GroundingChunk[];
}

export interface Conversation {
  id: string; // UUID v4 format
  title: string;
  turns: ConversationTurn[];
  createdAt: number;
  updatedAt: number;
}

export interface RepositoryItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  factors?: Factor[];
  timestamp: number;
  tags?: string[];
}

export interface AttachedFile {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64
  size: number;
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
  category: 'Código' | 'Escrita' | 'Análise' | 'Ensino' | 'Criativo';
  label: string;
  content: string;
}

export interface AppPersistedState {
  lastConversationId: string | null;
  factors: Factor[];
}
