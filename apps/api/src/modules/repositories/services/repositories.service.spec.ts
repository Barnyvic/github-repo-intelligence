import { ConfigService } from '@nestjs/config';
import { RepositoriesService } from './repositories.service';

describe('RepositoriesService', () => {
  const github = { get: jest.fn() };
  const normalizer = { repository: jest.fn((repo) => ({ fullName: repo.full_name, stars: repo.stargazers_count })) };
  const cache = {
    buildKey: jest.fn(() => 'cache-key'),
    getOrSet: jest.fn((_key, _ttl, loader) => loader()),
  };
  const searchHistory = { record: jest.fn() };
  const config = { get: jest.fn((_key, fallback) => fallback) } as unknown as ConfigService;

  beforeEach(() => jest.clearAllMocks());

  it('builds filtered GitHub search queries and records history', async () => {
    github.get.mockResolvedValue({
      data: {
        total_count: 1,
        incomplete_results: false,
        items: [{ full_name: 'nestjs/nest', stargazers_count: 70000 }],
      },
      rateLimit: { remaining: '59' },
    });

    const service = new RepositoriesService(
      github as never,
      normalizer as never,
      cache as never,
      searchHistory as never,
      config,
    );
    const result = await service.search({
      q: 'api',
      language: 'TypeScript',
      minStars: 100,
      minForks: 10,
      createdAfter: '2020-01-01',
      updatedAfter: '2024-01-01',
      sort: 'stars',
      page: 1,
      perPage: 20,
    });

    expect(github.get).toHaveBeenCalledWith('/search/repositories', {
      q: 'api language:TypeScript stars:>=100 forks:>=10 created:>=2020-01-01 pushed:>=2024-01-01',
      sort: 'stars',
      page: 1,
      per_page: 20,
    });
    expect(result.items).toEqual([{ fullName: 'nestjs/nest', stars: 70000 }]);
    expect(searchHistory.record).toHaveBeenCalledWith(
      expect.objectContaining({ searchType: 'repository', resultCount: 1 }),
    );
  });
});
