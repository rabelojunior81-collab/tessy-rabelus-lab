
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
