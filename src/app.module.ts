import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { redisStore } from 'cache-manager-ioredis-yet';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { MessagesModule } from './messages/messages.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { HealthModule } from './health/health.module';
import { ThrottlerByApiKeyGuard } from './common/throttler-by-api-key.guard';
import { winstonConfig } from './common/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(winstonConfig),
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 60_000, limit: 120 }, // 120 req/min por API Key
      ],
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CacheModule.registerAsync<any>({
      isGlobal: true,
      useFactory: () => {
        const url = process.env.REDIS_URL;
        const tls = url?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined;
        return {
          store: redisStore,
          ...(url ? { url, ...(tls ? { tls } : {}) } : { host: 'localhost', port: 6379 }),
          ttl: 5 * 60 * 1000, // 5 minutos em ms
        };
      },
    }),
    BullModule.forRoot({
      connection: (() => {
        const url = process.env.REDIS_URL;
        if (!url) return { host: 'localhost', port: 6379 };
        const tls = url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined;
        return { url, ...(tls ? { tls } : {}) };
      })(),
    }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    MessagesModule,
    WebhooksModule,
    ApiKeysModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerByApiKeyGuard },
  ],
})
export class AppModule {}
