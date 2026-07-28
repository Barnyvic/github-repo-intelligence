import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchRepositoriesDto {
  @IsString()
  q: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStars?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minForks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  updatedAfter?: string;

  @ApiPropertyOptional({ enum: ['stars', 'forks', 'updated', 'best-match'] })
  @IsOptional()
  @IsIn(['stars', 'forks', 'updated', 'best-match'])
  sort?: 'stars' | 'forks' | 'updated' | 'best-match';

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
