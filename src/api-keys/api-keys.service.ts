import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  private generateKey(): string {
    return 'wgw_' + crypto.randomBytes(24).toString('hex');
  }

  async create(dto: CreateApiKeyDto) {
    const key = this.generateKey();
    const record = await this.prisma.apiKey.create({
      data: { key, label: dto.label, tenantId: dto.tenantId },
    });
    // Retorna a key em texto claro apenas na criação
    return { id: record.id, key, label: record.label, tenantId: record.tenantId };
  }

  async findAll(tenantId?: string) {
    return this.prisma.apiKey.findMany({
      where: tenantId ? { tenantId } : undefined,
      select: { id: true, label: true, tenantId: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(id: string) {
    const record = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`API Key '${id}' não encontrada`);
    return this.prisma.apiKey.update({
      where: { id },
      data: { active: false },
      select: { id: true, label: true, tenantId: true, active: true },
    });
  }

  async remove(id: string) {
    const record = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`API Key '${id}' não encontrada`);
    await this.prisma.apiKey.delete({ where: { id } });
    return { deleted: true, id };
  }
}
