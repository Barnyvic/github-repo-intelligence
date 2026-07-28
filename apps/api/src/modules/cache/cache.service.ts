import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHash } from 'node:crypto';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    this.redis.on('error', (error) => this.logger.warn(`Redis unavailable: ${error.message}`));
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  buildKey(namespace: string, payload: Record<string, unknown>): string {
    const stablePayload = this.sortObject(payload);
    const digest = createHash('sha256').update(JSON.stringify(stablePayload)).digest('hex');
    return `${namespace}:${digest}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        this.logger.debug(`cache miss ${key}`);
        return null;
      }
      this.logger.debug(`cache hit ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Cache read failed for ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Cache write failed for ${key}: ${(error as Error).message}`);
    }
  }

  async getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }
    const fresh = await loader();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  async invalidateByPrefix(prefix: string): Promise<number> {
    const stream = this.redis.scanStream({ match: `${prefix}*`, count: 100 });
    const keys: string[] = [];
    for await (const batch of stream) {
      keys.push(...(batch as string[]));
    }
    return keys.length ? this.redis.del(...keys) : 0;
  }

  private sortObject(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.sortObject(entry));
    }
    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = this.sortObject((value as Record<string, unknown>)[key]);
          return acc;
        }, {});
    }
    return value;
  }
}
