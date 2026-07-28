import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GithubApiClient } from './github-api.client';

jest.mock('axios');

describe('GithubApiClient', () => {
  const get = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (axios.create as jest.Mock).mockReturnValue({ get });
  });

  it('retries transient failures before returning data', async () => {
    get
      .mockRejectedValueOnce({ response: { status: 502, headers: {} }, message: 'bad gateway' })
      .mockResolvedValueOnce({ data: { ok: true }, headers: { 'x-ratelimit-remaining': '58' } });
    const client = new GithubApiClient({
      get: (key: string, fallback?: unknown) => (key === 'GITHUB_RETRY_ATTEMPTS' ? 1 : fallback),
    } as ConfigService);

    await expect(client.get('/x')).resolves.toEqual({
      data: { ok: true },
      rateLimit: { limit: '', remaining: '58', reset: '' },
    });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('converts GitHub rate limit responses into a 429 error', async () => {
    get.mockRejectedValueOnce({
      response: { status: 403, headers: { 'x-ratelimit-remaining': '0' } },
      message: 'rate limited',
    });
    const client = new GithubApiClient({ get: (_key: string, fallback?: unknown) => fallback } as ConfigService);

    await expect(client.get('/x')).rejects.toMatchObject({ status: 429 });
  });
});
