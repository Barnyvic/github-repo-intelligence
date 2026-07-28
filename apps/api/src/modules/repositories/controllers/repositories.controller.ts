import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchRepositoriesDto } from '../dto/search-repositories.dto';
import { RepositoriesService } from '../services/repositories.service';

@ApiTags('Repositories')
@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositories: RepositoriesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search GitHub repositories with filters, sorting, and pagination' })
  search(@Query() query: SearchRepositoriesDto) {
    return this.repositories.search(query);
  }

  @Get(':owner/:repo')
  @ApiOperation({ summary: 'Return normalized repository details' })
  details(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.repositories.details(owner, repo);
  }

  @Get(':owner/:repo/commits')
  commits(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.repositories.commits(owner, repo);
  }

  @Get(':owner/:repo/contributors')
  contributors(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.repositories.contributors(owner, repo);
  }

  @Get(':owner/:repo/issues')
  issues(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.repositories.issues(owner, repo);
  }

  @Get(':owner/:repo/pull-requests')
  pullRequests(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.repositories.pullRequests(owner, repo);
  }
}
