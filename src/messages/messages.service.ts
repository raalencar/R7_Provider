import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { SendMessageResult } from '../providers/provider.interface';

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

  private async logAndSend<T extends SendMessageResult>(
    tenantId: string,
    phone: string,
    type: string,
    fn: () => Promise<T>,
  ): Promise<{ success: true } & T> {
    let result: T | undefined;
    let errorMsg: string | undefined;
    try {
      result = await fn();
      return { success: true, ...result };
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      await this.prisma.messageLog.create({
        data: {
          tenantId,
          phone,
          type,
          messageId: result?.messageId,
          success: errorMsg === undefined,
          error: errorMsg,
        },
      });
    }
  }

  async sendText(tenantId: string, phone: string, message: string) {
    const provider = await this.getProvider(tenantId);
    return this.logAndSend(tenantId, phone, 'text', () =>
      provider.sendText(phone, message),
    );
  }

  async sendImage(tenantId: string, phone: string, url: string, caption?: string) {
    const provider = await this.getProvider(tenantId);
    return this.logAndSend(tenantId, phone, 'image', () =>
      provider.sendImage(phone, url, caption),
    );
  }

  async sendAudio(tenantId: string, phone: string, url: string) {
    const provider = await this.getProvider(tenantId);
    return this.logAndSend(tenantId, phone, 'audio', () =>
      provider.sendAudio(phone, url),
    );
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
    return this.logAndSend(tenantId, phone, 'location', () =>
      provider.sendLocation(phone, lat, lng, title, address),
    );
  }

  async sendTemplate(
    tenantId: string,
    phone: string,
    template: string,
    variables: string[],
  ) {
    const provider = await this.getProvider(tenantId);
    return this.logAndSend(tenantId, phone, 'template', () =>
      provider.sendTemplate(phone, template, variables),
    );
  }

  async sendButtons(
    tenantId: string,
    phone: string,
    text: string,
    buttons: { id: string; label: string }[],
  ) {
    const provider = await this.getProvider(tenantId);
    return this.logAndSend(tenantId, phone, 'buttons', () =>
      provider.sendButtons(phone, text, buttons),
    );
  }

  async sendLink(tenantId: string, phone: string, url: string, title?: string) {
    const provider = await this.getProvider(tenantId);
    return this.logAndSend(tenantId, phone, 'link', () =>
      provider.sendLink(phone, url, title),
    );
  }
}
