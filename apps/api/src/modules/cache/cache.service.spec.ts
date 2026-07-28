import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
    scanStream: jest.fn(),
  }));
  return { __esModule: true, default: RedisMock };
});

describe('CacheService', () => {
  it('generates deterministic cache keys regardless of object key order', () => {
    const service = new CacheService({ get: () => 'redis://localhost:6379' } as unknown as ConfigService);

    expect(service.buildKey('scope', { b: 1, a: { d: 2, c: 3 } })).toBe(
      service.buildKey('scope', { a: { c: 3, d: 2 }, b: 1 }),
    );
  });
});
