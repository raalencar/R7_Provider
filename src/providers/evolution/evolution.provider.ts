import { HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  WhatsappGatewayProvider,
  SendMessageResult,
  ProviderStatus,
} from '../provider.interface';

interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

export class EvolutionProvider implements WhatsappGatewayProvider {
  private readonly client: AxiosInstance;
  private readonly instance: string;

  constructor(config: EvolutionConfig) {
    this.instance = config.instance;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: { apikey: config.apiKey },
    });
  }

  async sendText(phone: string, message: string): Promise<SendMessageResult> {
    const { data } = await this.client.post(
      `/message/sendText/${this.instance}`,
      { number: phone, text: message },
    );
    return { messageId: data.key?.id ?? data.id ?? 'unknown' };
  }

  async sendImage(
    phone: string,
    url: string,
    caption?: string,
  ): Promise<SendMessageResult> {
    const { data } = await this.client.post(
      `/message/sendMedia/${this.instance}`,
      { number: phone, mediatype: 'image', media: url, caption },
    );
    return { messageId: data.key?.id ?? data.id ?? 'unknown' };
  }

  async sendAudio(phone: string, url: string): Promise<SendMessageResult> {
    const { data } = await this.client.post(
      `/message/sendMedia/${this.instance}`,
      { number: phone, mediatype: 'audio', media: url },
    );
    return { messageId: data.key?.id ?? data.id ?? 'unknown' };
  }

  async sendLocation(
    phone: string,
    lat: number,
    lng: number,
    title?: string,
    address?: string,
  ): Promise<SendMessageResult> {
    const { data } = await this.client.post(
      `/message/sendLocation/${this.instance}`,
      { number: phone, latitude: lat, longitude: lng, name: title, address },
    );
    return { messageId: data.key?.id ?? data.id ?? 'unknown' };
  }

  async sendTemplate(
    phone: string,
    template: string,
    variables: string[],
  ): Promise<SendMessageResult> {
    // Evolution API não tem template nativo — envia como texto formatado
    const message = variables.reduce(
      (msg, val, i) => msg.replace(`{{${i + 1}}}`, val),
      template,
    );
    return this.sendText(phone, message);
  }

  async sendButtons(
    phone: string,
    text: string,
    buttons: { id: string; label: string }[],
  ): Promise<SendMessageResult> {
    const { data } = await this.client.post(
      `/message/sendButtons/${this.instance}`,
      {
        number: phone,
        title: text,
        buttons: buttons.map((b) => ({
          buttonId: b.id,
          buttonText: { displayText: b.label },
        })),
      },
    );
    return { messageId: data.key?.id ?? data.id ?? 'unknown' };
  }

  async sendLink(
    phone: string,
    url: string,
    title?: string,
  ): Promise<SendMessageResult> {
    const { data } = await this.client.post(
      `/message/sendText/${this.instance}`,
      { number: phone, text: title ? `${title}\n${url}` : url },
    );
    return { messageId: data.key?.id ?? data.id ?? 'unknown' };
  }

  async checkStatus(): Promise<ProviderStatus> {
    try {
      const { data } = await this.client.get(
        `/instance/connectionState/${this.instance}`,
      );
      const state = data?.instance?.state;
      return {
        connected: state === 'open',
        phone: data?.instance?.profileName,
      };
    } catch {
      return { connected: false };
    }
  }
}
