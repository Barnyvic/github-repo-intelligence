import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchDevelopersDto {
  @IsString()
  q: string;

  @ApiPropertyOptional({ enum: ['followers', 'repositories', 'joined', 'best-match'] })
  @IsOptional()
  @IsIn(['followers', 'repositories', 'joined', 'best-match'])
  sort?: 'followers' | 'repositories' | 'joined' | 'best-match';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;
}
