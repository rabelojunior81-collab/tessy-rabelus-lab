
import { GitHubRepo, GitHubCommit, GitHubIssue, GitHubFile } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
  }
}

const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Tessy-App'
});

async function handleResponse(response: Response) {
  if (!response.ok) {
    let message = 'Erro na comunicação com o GitHub.';
    if (response.status === 401) message = 'Token inválido ou expirado.';
    if (response.status === 403) message = 'Limite de taxa excedido ou acesso negado.';
    if (response.status === 404) message = 'Recurso não encontrado no GitHub.';
    throw new GitHubError(message, response.status);
  }
  return response.json();
}

export const fetchRepo = async (token: string, repoPath: string): Promise<GitHubRepo> => {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoPath}`, {
    headers: getHeaders(token)
  });
  return handleResponse(response);
};

export const fetchCommits = async (token: string, repoPath: string, perPage = 5): Promise<GitHubCommit[]> => {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoPath}/commits?per_page=${perPage}`, {
    headers: getHeaders(token)
  });
  const data = await handleResponse(response);
  return data.map((item: any) => ({
    sha: item.sha,
    message: item.commit.message,
    author: item.commit.author.name,
    date: item.commit.author.date,
    url: item.html_url
  }));
};

export const createIssue = async (token: string, repoPath: string, title: string, body: string): Promise<GitHubIssue> => {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoPath}/issues`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ title, body })
  });
  const data = await handleResponse(response);
  return {
    number: data.number,
    title: data.title,
    body: data.body,
    state: data.state,
    url: data.html_url
  };
};

export const formatRelativeDate = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `há ${diffInSeconds} segundos`;
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 2592000) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
  
  return date.toLocaleDateString('pt-BR');
};
