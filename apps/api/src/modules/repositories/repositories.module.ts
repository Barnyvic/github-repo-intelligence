import { Module } from '@nestjs/common';
import { GithubModule } from '../github/github.module';
import { SearchHistoryModule } from '../search-history/search-history.module';
import { RepositoriesController } from './controllers/repositories.controller';
import { RepositoriesService } from './services/repositories.service';

@Module({
  imports: [GithubModule, SearchHistoryModule],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
})
export class RepositoriesModule {}
