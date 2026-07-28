export interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  license?: { name: string; spdx_id: string } | null;
  size: number;
  created_at: string;
  updated_at: string;
  owner: GithubUserSummary;
}

export interface GithubUserSummary {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type?: string;
}

export interface GithubUser extends GithubUserSummary {
  name: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GithubSearchResponse<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface GithubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
  };
  author: GithubUserSummary | null;
}

export interface GithubContributor extends GithubUserSummary {
  contributions: number;
}

export interface GithubIssueOrPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: GithubUserSummary;
  pull_request?: unknown;
}
