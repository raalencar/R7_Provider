import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TenantsService } from '../tenants/tenants.service';
import { PrismaService } from '../prisma/prisma.service';

export interface MessageJob {
  tenantId: string;
  phone: string;
  type: string;
  payload: Record<string, unknown>;
}

@Processor('messages')
export class MessagesProcessor extends WorkerHost {
  constructor(
    private readonly tenants: TenantsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<MessageJob>) {
    const { tenantId, phone, type, payload } = job.data;
    const provider = await this.tenants.getProviderForTenant(tenantId);

    let messageId: string | undefined;
    try {
      let result: { messageId: string };
      switch (type) {
        case 'text':
          result = await provider.sendText(phone, payload.message as string);
          break;
        case 'image':
          result = await provider.sendImage(phone, payload.url as string, payload.caption as string | undefined);
          break;
        case 'audio':
          result = await provider.sendAudio(phone, payload.url as string);
          break;
        case 'location':
          result = await provider.sendLocation(
            phone,
            payload.lat as number,
            payload.lng as number,
            payload.title as string | undefined,
            payload.address as string | undefined,
          );
          break;
        case 'template':
          result = await provider.sendTemplate(phone, payload.template as string, payload.variables as string[]);
          break;
        case 'buttons':
          result = await provider.sendButtons(phone, payload.text as string, payload.buttons as { id: string; label: string }[]);
          break;
        case 'link':
          result = await provider.sendLink(phone, payload.url as string, payload.title as string | undefined);
          break;
        default:
          throw new Error(`Tipo de mensagem desconhecido: ${type}`);
      }
      messageId = result.messageId;
      await this.prisma.messageLog.create({
        data: { tenantId, phone, type, messageId, success: true },
      });
      return { messageId };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.prisma.messageLog.create({
        data: { tenantId, phone, type, messageId, success: false, error },
      });
      throw err; // BullMQ faz retry automático
    }
  }
}
