
export interface RepositoryItem {
  id: string;
  title: string;
  description: string;
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
