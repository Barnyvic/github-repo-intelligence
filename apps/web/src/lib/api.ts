function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }

  if (typeof window === 'undefined' && process.env.API_ORIGIN) {
    return `${process.env.API_ORIGIN.replace(/\/$/, '')}/api/v1`;
  }

  if (typeof window !== 'undefined') {
    return '/api/v1';
  }

  return 'http://localhost:3000/api/v1';
}

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
  const base = getApiBaseUrl();
  const url = base.startsWith('http')
    ? new URL(`${base}${path}`)
    : new URL(`${base}${path}`, typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1');

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
