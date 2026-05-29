import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  getRateLimitPolicy,
  getRateLimitTracker,
  getRequestFromContext,
  isRateLimitingEnabled
} from './rate-limiting.config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        errorMessage: 'Muitas requisicoes recebidas. Tente novamente em alguns instantes.',
        skipIf: () => !isRateLimitingEnabled(configService),
        throttlers: [
          {
            name: 'default',
            ttl: (context) => getRateLimitPolicy(configService, getRequestFromContext(context)).ttl,
            limit: (context) =>
              getRateLimitPolicy(configService, getRequestFromContext(context)).limit,
            getTracker: (request) => getRateLimitTracker(configService, request)
          }
        ]
      })
    })
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class RateLimitingModule {}
