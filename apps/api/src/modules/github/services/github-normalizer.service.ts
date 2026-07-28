import { Injectable } from '@nestjs/common';
import {
  GithubCommit,
  GithubContributor,
  GithubIssueOrPullRequest,
  GithubRepository,
  GithubUser,
} from '../interfaces/github-types';

@Injectable()
export class GithubNormalizerService {
  repository(repo: GithubRepository) {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      owner: this.userSummary(repo.owner),
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      openIssues: repo.open_issues_count,
      primaryLanguage: repo.language,
      topics: repo.topics ?? [],
      license: repo.license ? { name: repo.license.name, spdxId: repo.license.spdx_id } : null,
      size: repo.size,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      url: repo.html_url,
    };
  }

  user(user: GithubUser) {
    return {
      username: user.login,
      name: user.name,
      bio: user.bio,
      company: user.company,
      blog: user.blog,
      location: user.location,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  userSummary(user: { login: string; avatar_url: string; html_url: string; type?: string }) {
    return {
      username: user.login,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      type: user.type,
    };
  }

  commit(commit: GithubCommit) {
    return {
      sha: commit.sha,
      message: commit.commit.message,
      authorName: commit.commit.author.name,
      authorEmail: commit.commit.author.email,
      authoredAt: commit.commit.author.date,
      url: commit.html_url,
      author: commit.author ? this.userSummary(commit.author) : null,
    };
  }

  contributor(contributor: GithubContributor) {
    return {
      ...this.userSummary(contributor),
      contributions: contributor.contributions,
    };
  }

  issue(issue: GithubIssueOrPullRequest) {
    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      author: this.userSummary(issue.user),
    };
  }
}
