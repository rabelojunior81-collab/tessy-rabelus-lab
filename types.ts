
export interface RepositoryItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  factors?: Factor[];
  timestamp: number;
}

export interface Factor {
  id: string;
  label: string;
  enabled: boolean;
}

export interface GeminiResponse {
  text: string;
  error?: string;
}
