import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SearchHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    searchType: 'repository' | 'developer';
    query: string;
    filters: Prisma.InputJsonValue;
    resultCount: number;
  }) {
    return this.prisma.searchHistory.create({
      data: {
        searchType: input.searchType,
        query: input.query,
        filters: input.filters,
        resultCount: input.resultCount,
      },
    });
  }

  async recent(limit = 25) {
    return this.prisma.searchHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }
}
