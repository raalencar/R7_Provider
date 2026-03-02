import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { EvolutionProvider } from '../providers/evolution/evolution.provider';
import * as crypto from 'crypto';

@Injectable()
export class TenantsService {
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get encryptionKey(): Buffer {
    const key = this.config.get<string>('ENCRYPTION_KEY');
    return Buffer.from(key!, 'hex');
  }

  private encrypt(data: Record<string, unknown>): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    const json = JSON.stringify(data);
    const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(encrypted: string): Record<string, unknown> {
    const [ivHex, encHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedData = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as Record<string, unknown>;
  }

  async create(dto: CreateTenantDto) {
    const exists = await this.prisma.tenantProvider.findUnique({
      where: { tenantId: dto.tenantId },
    });
    if (exists) {
      throw new ConflictException(`Tenant '${dto.tenantId}' já está configurado`);
    }

    const encryptedConfig = this.encrypt(dto.config);

    const tenant = await this.prisma.tenantProvider.create({
      data: {
        tenantId: dto.tenantId,
        providerType: dto.providerType,
        webhookUrl: dto.webhookUrl,
        config: encryptedConfig,
      },
    });

    // Auto-criar instância no provider (melhor esforço — não bloqueia em caso de falha)
    let qrcode: string | undefined;
    try {
      const config = this.decrypt(encryptedConfig);
      const provider = this.instantiateProvider(dto.providerType, config);
      if (provider.createInstance) {
        const result = await provider.createInstance();
        qrcode = result.qrcode;
      }
    } catch {
      // falha silenciosa — instância pode ser criada manualmente depois
    }

    return { ...tenant, ...(qrcode ? { qrcode } : {}) };
  }

  async findOne(tenantId: string) {
    const tenant = await this.prisma.tenantProvider.findUnique({
      where: { tenantId },
    });
    if (!tenant) throw new NotFoundException(`Tenant '${tenantId}' não encontrado`);
    return tenant;
  }

  async update(tenantId: string, dto: UpdateTenantDto) {
    await this.findOne(tenantId);

    const data: Record<string, unknown> = {};
    if (dto.providerType) data.providerType = dto.providerType;
    if (dto.webhookUrl !== undefined) data.webhookUrl = dto.webhookUrl;
    if (dto.config) data.config = this.encrypt(dto.config);

    return this.prisma.tenantProvider.update({
      where: { tenantId },
      data,
    });
  }

  async remove(tenantId: string) {
    await this.findOne(tenantId);
    return this.prisma.tenantProvider.delete({ where: { tenantId } });
  }

  async getStatus(tenantId: string) {
    const tenant = await this.findOne(tenantId);
    const config = this.decrypt(tenant.config as string);
    const provider = this.instantiateProvider(tenant.providerType, config);
    const status = await provider.checkStatus();
    return { tenantId, providerType: tenant.providerType, ...status };
  }

  getDecryptedConfig(tenant: { providerType: string; config: unknown }) {
    return this.decrypt(tenant.config as string);
  }

  instantiateProvider(providerType: string, config: Record<string, unknown>) {
    switch (providerType) {
      case 'EVOLUTION':
        return new EvolutionProvider(config as never);
      default:
        throw new Error(`Provider '${providerType}' não implementado`);
    }
  }
}
