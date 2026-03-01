import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { normalizeEvolution, NormalizedWebhook } from './normalizers/evolution.normalizer';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleEvolution(tenantId: string, payload: Record<string, unknown>) {
    const normalized = normalizeEvolution(tenantId, payload);
    if (!normalized) {
      this.logger.debug(`Evento Evolution ignorado para tenant ${tenantId}: ${payload.event}`);
      return { received: true };
    }

    await this.forwardToWebhookUrl(tenantId, normalized);
    return { received: true };
  }

  async handleZapi(tenantId: string, payload: Record<string, unknown>) {
    // Fase 3 — Z-API normalizer
    this.logger.debug(`Z-API webhook recebido para tenant ${tenantId}`);
    await this.forwardToWebhookUrl(tenantId, { event: 'MESSAGE_RECEIVED', tenantId, raw: payload });
    return { received: true };
  }

  async handleSendpulse(tenantId: string, payload: Record<string, unknown>) {
    // Fase 3 — SendPulse normalizer
    this.logger.debug(`SendPulse webhook recebido para tenant ${tenantId}`);
    await this.forwardToWebhookUrl(tenantId, { event: 'MESSAGE_RECEIVED', tenantId, raw: payload });
    return { received: true };
  }

  private async forwardToWebhookUrl(tenantId: string, body: unknown) {
    const tenant = await this.prisma.tenantProvider.findUnique({
      where: { tenantId },
      select: { webhookUrl: true },
    });

    if (!tenant?.webhookUrl) {
      this.logger.debug(`Tenant ${tenantId} sem webhookUrl configurada`);
      return;
    }

    await this.postWithRetry(tenant.webhookUrl, body, 3);
  }

  private async postWithRetry(url: string, body: unknown, maxAttempts: number) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await axios.post(url, body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });
        return;
      } catch (err) {
        const isLast = attempt === maxAttempts;
        if (isLast) {
          this.logger.error(`Falha ao encaminhar webhook para ${url} após ${maxAttempts} tentativas`);
          return;
        }
        this.logger.warn(`Tentativa ${attempt}/${maxAttempts} falhou para ${url}. Aguardando 1s...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}
