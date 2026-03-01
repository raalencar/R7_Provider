import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { APP_GUARD } from '@nestjs/core';
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
