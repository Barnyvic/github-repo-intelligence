import { HttpException, HttpStatus } from '@nestjs/common';

export interface GithubRateLimit {
  limit?: string;
  remaining?: string;
  reset?: string;
}

export class GithubApiException extends HttpException {
  constructor(
    message: string,
    status: number = HttpStatus.BAD_GATEWAY,
    readonly rateLimit?: GithubRateLimit,
  ) {
    super({ message, code: 'GITHUB_API_ERROR', rateLimit }, status);
  }
}

export class GithubRateLimitException extends HttpException {
  constructor(readonly rateLimit?: GithubRateLimit) {
    super(
      {
        message: 'GitHub API rate limit exceeded. Try again after the reset time or configure a GitHub token.',
        code: 'GITHUB_RATE_LIMITED',
        rateLimit,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
