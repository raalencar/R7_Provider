import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
  ) {}

  private async getProvider(tenantId: string) {
    const tenant = await this.prisma.tenantProvider.findUnique({
      where: { tenantId },
    });
    if (!tenant) throw new NotFoundException(`Tenant '${tenantId}' não encontrado`);

    const config = this.tenants.getDecryptedConfig(tenant);
    return this.tenants.instantiateProvider(tenant.providerType, config);
  }

  async sendText(tenantId: string, phone: string, message: string) {
    const provider = await this.getProvider(tenantId);
    const result = await provider.sendText(phone, message);
    return { success: true, ...result, provider: 'resolved' };
  }

  async sendImage(tenantId: string, phone: string, url: string, caption?: string) {
    const provider = await this.getProvider(tenantId);
    const result = await provider.sendImage(phone, url, caption);
    return { success: true, ...result };
  }

  async sendAudio(tenantId: string, phone: string, url: string) {
    const provider = await this.getProvider(tenantId);
    const result = await provider.sendAudio(phone, url);
    return { success: true, ...result };
  }

  async sendLocation(
    tenantId: string,
    phone: string,
    lat: number,
    lng: number,
    title?: string,
    address?: string,
  ) {
    const provider = await this.getProvider(tenantId);
    const result = await provider.sendLocation(phone, lat, lng, title, address);
    return { success: true, ...result };
  }

  async sendTemplate(
    tenantId: string,
    phone: string,
    template: string,
    variables: string[],
  ) {
    const provider = await this.getProvider(tenantId);
    const result = await provider.sendTemplate(phone, template, variables);
    return { success: true, ...result };
  }

  async sendButtons(
    tenantId: string,
    phone: string,
    text: string,
    buttons: { id: string; label: string }[],
  ) {
    const provider = await this.getProvider(tenantId);
    const result = await provider.sendButtons(phone, text, buttons);
    return { success: true, ...result };
  }

  async sendLink(tenantId: string, phone: string, url: string, title?: string) {
    const provider = await this.getProvider(tenantId);
    const result = await provider.sendLink(phone, url, title);
    return { success: true, ...result };
  }
}
