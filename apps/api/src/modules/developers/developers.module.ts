import { Module } from '@nestjs/common';
import { GithubModule } from '../github/github.module';
import { SearchHistoryModule } from '../search-history/search-history.module';
import { DevelopersController } from './controllers/developers.controller';
import { DevelopersService } from './services/developers.service';

@Module({
  imports: [GithubModule, SearchHistoryModule],
  controllers: [DevelopersController],
  providers: [DevelopersService],
})
export class DevelopersModule {}
