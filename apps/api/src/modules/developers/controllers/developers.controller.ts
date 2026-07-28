import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchDevelopersDto } from '../dto/search-developers.dto';
import { DevelopersService } from '../services/developers.service';

@ApiTags('Developers')
@Controller('developers')
export class DevelopersController {
  constructor(private readonly developers: DevelopersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search GitHub developers' })
  search(@Query() query: SearchDevelopersDto) {
    return this.developers.search(query);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Return developer profile and public activity summary' })
  profile(@Param('username') username: string) {
    return this.developers.profile(username);
  }

  @Get(':username/repositories')
  repositories(@Param('username') username: string) {
    return this.developers.repositories(username);
  }
}
