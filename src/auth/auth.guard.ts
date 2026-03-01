import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key ausente');
    }

    // Master key tem acesso total (para gerenciar tenants e api keys)
    const masterKey = this.config.get<string>('MASTER_API_KEY');
    if (masterKey && apiKey === masterKey) {
      request.tenantId = null;
      request.isMaster = true;
      return true;
    }

    const record = await this.prisma.apiKey.findUnique({
      where: { key: apiKey },
    });

    if (!record || !record.active) {
      throw new UnauthorizedException('API key inválida ou inativa');
    }

    request.tenantId = record.tenantId;
    request.isMaster = false;
    return true;
  }
}
