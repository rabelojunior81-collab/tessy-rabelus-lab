
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

export interface ConversationTurn {
  id: string;
  userMessage: string;
  tessyResponse: string;
  timestamp: number;
  attachedFiles?: AttachedFile[];
}

export interface RepositoryItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  factors?: Factor[];
  timestamp: number;
}

export interface GeminiResponse {
  text: string;
  error?: string;
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