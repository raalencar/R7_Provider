export interface SendMessageResult {
  messageId: string;
}

export interface ProviderStatus {
  connected: boolean;
  phone?: string;
}

export interface WhatsappGatewayProvider {
  sendText(phone: string, message: string): Promise<SendMessageResult>;
  sendImage(phone: string, url: string, caption?: string): Promise<SendMessageResult>;
  sendAudio(phone: string, url: string): Promise<SendMessageResult>;
  sendLocation(
    phone: string,
    lat: number,
    lng: number,
    title?: string,
    address?: string,
  ): Promise<SendMessageResult>;
  sendTemplate(
    phone: string,
    template: string,
    variables: string[],
  ): Promise<SendMessageResult>;
  sendButtons(
    phone: string,
    text: string,
    buttons: { id: string; label: string }[],
  ): Promise<SendMessageResult>;
  sendLink(phone: string, url: string, title?: string): Promise<SendMessageResult>;
  checkStatus(): Promise<ProviderStatus>;
  createInstance?(): Promise<{ qrcode?: string }>;
}
