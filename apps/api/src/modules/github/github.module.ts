import { Module } from '@nestjs/common';
import { GithubApiClient } from './clients/github-api.client';
import { GithubNormalizerService } from './services/github-normalizer.service';

@Module({
  providers: [GithubApiClient, GithubNormalizerService],
  exports: [GithubApiClient, GithubNormalizerService],
})
export class GithubModule {}
