const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  owner: { username: string; avatarUrl: string; profileUrl: string };
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  primaryLanguage: string | null;
  topics: string[];
  license: { name: string; spdxId: string } | null;
  size: number;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface Developer {
  username: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  recentRepositories?: Repository[];
  activitySummary?: {
    recentRepositoryCount: number;
    totalStarsInRecentRepos: number;
    languages: Record<string, number>;
  };
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? 'Request failed');
  }
  return response.json() as Promise<T>;
}
