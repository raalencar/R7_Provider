import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Status do serviço e providers conectados' })
  async check() {
    // Ping no banco
    let dbStatus: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    const allTenants = await this.prisma.tenantProvider.findMany({
      select: { tenantId: true, providerType: true, config: true },
    });

    const providerStatuses = await Promise.all(
      allTenants.map(async (t) => {
        try {
          const config = this.tenants.getDecryptedConfig(t);
          const provider = this.tenants.instantiateProvider(t.providerType, config);
          const status = await provider.checkStatus();
          return { tenantId: t.tenantId, providerType: t.providerType, ...status };
        } catch {
          return { tenantId: t.tenantId, providerType: t.providerType, connected: false };
        }
      }),
    );

    const allConnected = providerStatuses.every((p) => p.connected);
    const overallOk = dbStatus === 'ok' && (allConnected || providerStatuses.length === 0);

    return {
      status: overallOk ? 'ok' : 'degraded',
      db: dbStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      providers: providerStatuses,
    };
  }
}
