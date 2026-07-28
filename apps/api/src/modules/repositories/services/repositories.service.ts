import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { GithubApiClient } from '../../github/clients/github-api.client';
import { GithubRepository, GithubSearchResponse } from '../../github/interfaces/github-types';
import { GithubNormalizerService } from '../../github/services/github-normalizer.service';
import { SearchHistoryService } from '../../search-history/services/search-history.service';
import { SearchRepositoriesDto } from '../dto/search-repositories.dto';

@Injectable()
export class RepositoriesService {
  constructor(
    private readonly github: GithubApiClient,
    private readonly normalizer: GithubNormalizerService,
    private readonly cache: CacheService,
    private readonly searchHistory: SearchHistoryService,
    private readonly config: ConfigService,
  ) {}

  async search(dto: SearchRepositoriesDto) {
    const query = this.buildSearchQuery(dto);
    const params = {
      q: query,
      sort: dto.sort === 'best-match' ? undefined : dto.sort,
      page: dto.page,
      per_page: dto.perPage,
    };
    const key = this.cache.buildKey('github:repositories:search', params);
    const ttl = this.config.get<number>('CACHE_TTL_REPOSITORY_SEARCH_SECONDS', 300);

    const response = await this.cache.getOrSet(key, ttl, async () => {
      const result = await this.github.get<GithubSearchResponse<GithubRepository>>('/search/repositories', params);
      return {
        totalCount: result.data.total_count,
        incompleteResults: result.data.incomplete_results,
        page: dto.page,
        perPage: dto.perPage,
        rateLimit: result.rateLimit,
        items: result.data.items.map((repo) => this.normalizer.repository(repo)),
      };
    });

    await this.searchHistory.record({
      searchType: 'repository',
      query: dto.q,
      filters: { ...dto, normalizedQuery: query },
      resultCount: response.totalCount,
    });

    return response;
  }

  async details(owner: string, repo: string) {
    const key = this.cache.buildKey('github:repositories:details', { owner, repo });
    const ttl = this.config.get<number>('CACHE_TTL_REPOSITORY_DETAILS_SECONDS', 900);
    return this.cache.getOrSet(key, ttl, async () => {
      const result = await this.github.get<GithubRepository>(`/repos/${owner}/${repo}`);
      return { ...this.normalizer.repository(result.data), rateLimit: result.rateLimit };
    });
  }

  async commits(owner: string, repo: string) {
    return this.activity(owner, repo, 'commits');
  }

  async contributors(owner: string, repo: string) {
    return this.activity(owner, repo, 'contributors');
  }

  async issues(owner: string, repo: string) {
    return this.activity(owner, repo, 'issues');
  }

  async pullRequests(owner: string, repo: string) {
    return this.activity(owner, repo, 'pulls');
  }

  private async activity(owner: string, repo: string, type: 'commits' | 'contributors' | 'issues' | 'pulls') {
    const key = this.cache.buildKey('github:repositories:activity', { owner, repo, type });
    const ttl = this.config.get<number>('CACHE_TTL_REPOSITORY_ACTIVITY_SECONDS', 300);
    return this.cache.getOrSet(key, ttl, async () => {
      const result = await this.github.get<unknown[]>(`/repos/${owner}/${repo}/${type}`, {
        per_page: 20,
        state: type === 'commits' || type === 'contributors' ? undefined : 'all',
      });
      const items = result.data.map((item) => {
        if (type === 'commits') return this.normalizer.commit(item as never);
        if (type === 'contributors') return this.normalizer.contributor(item as never);
        return this.normalizer.issue(item as never);
      });
      return { items, rateLimit: result.rateLimit };
    });
  }

  private buildSearchQuery(dto: SearchRepositoriesDto): string {
    const parts = [dto.q.trim()];
    if (dto.language) parts.push(`language:${dto.language}`);
    if (dto.minStars !== undefined) parts.push(`stars:>=${dto.minStars}`);
    if (dto.minForks !== undefined) parts.push(`forks:>=${dto.minForks}`);
    if (dto.createdAfter) parts.push(`created:>=${dto.createdAfter}`);
    if (dto.updatedAfter) parts.push(`pushed:>=${dto.updatedAfter}`);
    return parts.join(' ');
  }
}
