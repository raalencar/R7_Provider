import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  controllers: [HealthController],
})
export class HealthModule {}
