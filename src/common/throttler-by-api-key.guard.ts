import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerByApiKeyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // Usa o tenantId (inferido da API Key) como chave de rate limit.
    // Fallback para IP se não houver tenantId (ex: rota de health).
    return (req.tenantId as string) ?? (req.ip as string) ?? 'anonymous';
  }
}
