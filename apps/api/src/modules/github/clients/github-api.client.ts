import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  GithubApiException,
  GithubRateLimit,
  GithubRateLimitException,
} from '../../../common/exceptions/github-api.exception';

@Injectable()
export class GithubApiClient {
  private readonly logger = new Logger(GithubApiClient.name);
  private readonly http: AxiosInstance;
  private readonly retryAttempts: number;

  constructor(config: ConfigService) {
    const token = config.get<string>('GITHUB_TOKEN');
    this.retryAttempts = config.get<number>('GITHUB_RETRY_ATTEMPTS', 3);
    this.http = axios.create({
      baseURL: config.get<string>('GITHUB_API_BASE_URL', 'https://api.github.com'),
      timeout: config.get<number>('GITHUB_TIMEOUT_MS', 8000),
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<{ data: T; rateLimit: GithubRateLimit }> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.retryAttempts) {
      try {
        const response = await this.http.get<T>(path, { params });
        return {
          data: response.data,
          rateLimit: this.rateLimitFromHeaders(response.headers),
        };
      } catch (error) {
        lastError = error;
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const rateLimit = this.rateLimitFromHeaders(axiosError.response?.headers ?? {});

        if (status === 403 && rateLimit.remaining === '0') {
          throw new GithubRateLimitException(rateLimit);
        }

        if (!this.shouldRetry(status) || attempt === this.retryAttempts) {
          this.throwGithubError(axiosError, rateLimit);
        }

        attempt += 1;
        const delayMs = 150 * 2 ** (attempt - 1);
        this.logger.warn(`GitHub request retry ${attempt}/${this.retryAttempts} for ${path}`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }

  private shouldRetry(status?: number): boolean {
    return !status || status === 408 || status === 429 || status >= 500;
  }

  private throwGithubError(error: AxiosError, rateLimit: GithubRateLimit): never {
    const status = error.response?.status;
    const message =
      status === 404
        ? 'GitHub resource was not found.'
        : status && status < 500
          ? 'GitHub rejected the request. Check the supplied parameters.'
          : 'GitHub is temporarily unavailable.';

    this.logger.error(
      JSON.stringify({
        message: error.message,
        status,
        rateLimit,
      }),
    );
    throw new GithubApiException(message, status && status < 500 ? status : 502, rateLimit);
  }

  private rateLimitFromHeaders(headers: Record<string, unknown>): GithubRateLimit {
    return {
      limit: String(headers['x-ratelimit-limit'] ?? ''),
      remaining: String(headers['x-ratelimit-remaining'] ?? ''),
      reset: String(headers['x-ratelimit-reset'] ?? ''),
    };
  }
}
