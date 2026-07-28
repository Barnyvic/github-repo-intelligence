import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchHistoryService } from '../services/search-history.service';

@ApiTags('Search history')
@Controller('search-history')
export class SearchHistoryController {
  constructor(private readonly searchHistory: SearchHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Return recent repository and developer searches' })
  recent(@Query('limit') limit?: string) {
    return this.searchHistory.recent(limit ? Number(limit) : 25);
  }
}
