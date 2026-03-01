export type NormalizedEvent =
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_READ'
  | 'CONNECTION_UPDATE';

export type NormalizedMessageType = 'text' | 'image' | 'audio' | 'location' | 'document';

export interface NormalizedWebhook {
  event: NormalizedEvent;
  tenantId: string;
  phone: string;
  message: {
    id: string;
    type: NormalizedMessageType;
    text: string | null;
    mediaUrl: string | null;
    timestamp: number;
  };
  raw: unknown;
}

export function normalizeEvolution(
  tenantId: string,
  payload: Record<string, unknown>,
): NormalizedWebhook | null {
  const eventType = payload.event as string;

  // Mensagem recebida
  if (eventType === 'messages.upsert' || eventType === 'messages.update') {
    const data = payload.data as Record<string, unknown>;
    const key = data?.key as Record<string, unknown>;
    const msg = data?.message as Record<string, unknown>;

    const text =
      (msg?.conversation as string) ||
      (msg?.extendedTextMessage as Record<string, unknown>)?.text as string ||
      null;

    const imageMsg = msg?.imageMessage as Record<string, unknown>;
    const audioMsg = msg?.audioMessage as Record<string, unknown>;
    const documentMsg = msg?.documentMessage as Record<string, unknown>;
    const locationMsg = msg?.locationMessage as Record<string, unknown>;

    let type: NormalizedMessageType = 'text';
    let mediaUrl: string | null = null;

    if (imageMsg) {
      type = 'image';
      mediaUrl = imageMsg.url as string ?? null;
    } else if (audioMsg) {
      type = 'audio';
      mediaUrl = audioMsg.url as string ?? null;
    } else if (documentMsg) {
      type = 'document';
      mediaUrl = documentMsg.url as string ?? null;
    } else if (locationMsg) {
      type = 'location';
    }

    return {
      event: 'MESSAGE_RECEIVED',
      tenantId,
      phone: (key?.remoteJid as string)?.replace('@s.whatsapp.net', '') ?? '',
      message: {
        id: key?.id as string ?? 'unknown',
        type,
        text,
        mediaUrl,
        timestamp: data?.messageTimestamp as number ?? Math.floor(Date.now() / 1000),
      },
      raw: payload,
    };
  }

  // Status de mensagem enviada
  if (eventType === 'messages.update') {
    const data = payload.data as Record<string, unknown>;
    const update = Array.isArray(data) ? data[0] : data;
    const status = (update as Record<string, unknown>)?.update as Record<string, unknown>;
    const statusValue = status?.status as number;

    let event: NormalizedEvent = 'MESSAGE_DELIVERED';
    if (statusValue === 4) event = 'MESSAGE_READ';

    return {
      event,
      tenantId,
      phone: '',
      message: {
        id: (update as Record<string, unknown>)?.key?.['id'] as string ?? 'unknown',
        type: 'text',
        text: null,
        mediaUrl: null,
        timestamp: Math.floor(Date.now() / 1000),
      },
      raw: payload,
    };
  }

  // Status de conexão
  if (eventType === 'connection.update') {
    const data = payload.data as Record<string, unknown>;
    return {
      event: 'CONNECTION_UPDATE',
      tenantId,
      phone: data?.wuid as string ?? '',
      message: {
        id: 'connection',
        type: 'text',
        text: data?.state as string ?? null,
        mediaUrl: null,
        timestamp: Math.floor(Date.now() / 1000),
      },
      raw: payload,
    };
  }

  return null;
}
