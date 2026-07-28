import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { DevelopersModule } from './modules/developers/developers.module';
import { GithubModule } from './modules/github/github.module';
import { HealthModule } from './modules/health/health.module';
import { RepositoriesModule } from './modules/repositories/repositories.module';
import { SearchHistoryModule } from './modules/search-history/search-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL_SECONDS', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 120),
        },
      ],
    }),
    DatabaseModule,
    CacheModule,
    GithubModule,
    RepositoriesModule,
    DevelopersModule,
    SearchHistoryModule,
    HealthModule,
  ],
})
export class AppModule {}
