import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TenantsService } from '../tenants/tenants.service';
import { MessageJob } from './messages.processor';

@Injectable()
export class MessagesService {
  constructor(
    private readonly tenants: TenantsService,
    @InjectQueue('messages') private readonly queue: Queue<MessageJob>,
  ) {}

  private async enqueue(tenantId: string, phone: string, type: string, payload: Record<string, unknown>) {
    const job = await this.queue.add(type, { tenantId, phone, type, payload }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
    return { jobId: job.id, status: 'queued' };
  }

  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return { jobId, status: 'not_found' };
    const state = await job.getState();
    return {
      jobId,
      status: state,
      result: job.returnvalue ?? undefined,
      failedReason: job.failedReason ?? undefined,
      attemptsMade: job.attemptsMade,
    };
  }

  async sendText(tenantId: string, phone: string, message: string) {
    return this.enqueue(tenantId, phone, 'text', { message });
  }

  async sendImage(tenantId: string, phone: string, url: string, caption?: string) {
    return this.enqueue(tenantId, phone, 'image', { url, caption });
  }

  async sendAudio(tenantId: string, phone: string, url: string) {
    return this.enqueue(tenantId, phone, 'audio', { url });
  }

  async sendLocation(
    tenantId: string,
    phone: string,
    lat: number,
    lng: number,
    title?: string,
    address?: string,
  ) {
    return this.enqueue(tenantId, phone, 'location', { lat, lng, title, address });
  }

  async sendTemplate(tenantId: string, phone: string, template: string, variables: string[]) {
    return this.enqueue(tenantId, phone, 'template', { template, variables });
  }

  async sendButtons(tenantId: string, phone: string, text: string, buttons: { id: string; label: string }[]) {
    return this.enqueue(tenantId, phone, 'buttons', { text, buttons });
  }

  async sendLink(tenantId: string, phone: string, url: string, title?: string) {
    return this.enqueue(tenantId, phone, 'link', { url, title });
  }
}
