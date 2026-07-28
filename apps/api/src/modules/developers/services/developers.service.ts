import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { GithubApiClient } from '../../github/clients/github-api.client';
import {
  GithubRepository,
  GithubSearchResponse,
  GithubUser,
} from '../../github/interfaces/github-types';
import { GithubNormalizerService } from '../../github/services/github-normalizer.service';
import { SearchHistoryService } from '../../search-history/services/search-history.service';
import { SearchDevelopersDto } from '../dto/search-developers.dto';

@Injectable()
export class DevelopersService {
  constructor(
    private readonly github: GithubApiClient,
    private readonly normalizer: GithubNormalizerService,
    private readonly cache: CacheService,
    private readonly searchHistory: SearchHistoryService,
    private readonly config: ConfigService,
  ) {}

  async search(dto: SearchDevelopersDto) {
    const params = {
      q: dto.q,
      sort: dto.sort === 'best-match' ? undefined : dto.sort,
      page: dto.page,
      per_page: dto.perPage,
    };
    const key = this.cache.buildKey('github:developers:search', params);
    const response = await this.cache.getOrSet(
      key,
      this.config.get<number>('CACHE_TTL_DEVELOPER_PROFILE_SECONDS', 900),
      async () => {
        const result = await this.github.get<GithubSearchResponse<GithubUser>>('/search/users', params);
        const detailedUsers = await Promise.all(
          result.data.items.map(async (item) => {
            const user = await this.profile(item.login);
            return {
              username: user.username,
              avatarUrl: user.avatarUrl,
              profileUrl: user.profileUrl,
              publicRepos: user.publicRepos,
              followers: user.followers,
              following: user.following,
              createdAt: user.createdAt,
            };
          }),
        );
        return {
          totalCount: result.data.total_count,
          incompleteResults: result.data.incomplete_results,
          page: dto.page,
          perPage: dto.perPage,
          rateLimit: result.rateLimit,
          items: detailedUsers,
        };
      },
    );

    await this.searchHistory.record({
      searchType: 'developer',
      query: dto.q,
      filters: { ...dto },
      resultCount: response.totalCount,
    });

    return response;
  }

  async profile(username: string) {
    const key = this.cache.buildKey('github:developers:profile', { username });
    return this.cache.getOrSet(
      key,
      this.config.get<number>('CACHE_TTL_DEVELOPER_PROFILE_SECONDS', 900),
      async () => {
        const [profile, repos] = await Promise.all([
          this.github.get<GithubUser>(`/users/${username}`),
          this.github.get<GithubRepository[]>(`/users/${username}/repos`, {
            sort: 'updated',
            direction: 'desc',
            per_page: 10,
          }),
        ]);
        const normalizedRepos = repos.data.map((repo) => this.normalizer.repository(repo));
        const languages = normalizedRepos.reduce<Record<string, number>>((acc, repo) => {
          if (repo.primaryLanguage) acc[repo.primaryLanguage] = (acc[repo.primaryLanguage] ?? 0) + 1;
          return acc;
        }, {});

        return {
          ...this.normalizer.user(profile.data),
          recentRepositories: normalizedRepos,
          activitySummary: {
            recentRepositoryCount: normalizedRepos.length,
            totalStarsInRecentRepos: normalizedRepos.reduce((sum, repo) => sum + repo.stars, 0),
            languages,
          },
          rateLimit: profile.rateLimit,
        };
      },
    );
  }

  async repositories(username: string) {
    const key = this.cache.buildKey('github:developers:repositories', { username });
    return this.cache.getOrSet(
      key,
      this.config.get<number>('CACHE_TTL_REPOSITORY_ACTIVITY_SECONDS', 300),
      async () => {
        const result = await this.github.get<GithubRepository[]>(`/users/${username}/repos`, {
          sort: 'updated',
          direction: 'desc',
          per_page: 30,
        });
        return {
          items: result.data.map((repo) => this.normalizer.repository(repo)),
          rateLimit: result.rateLimit,
        };
      },
    );
  }
}
