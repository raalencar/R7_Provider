import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Post('evolution/:tenantId')
  @ApiOperation({ summary: 'Recebe evento da Evolution API e encaminha normalizado' })
  handleEvolution(
    @Param('tenantId') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.service.handleEvolution(tenantId, payload);
  }

  @Post('zapi/:tenantId')
  @ApiOperation({ summary: 'Recebe evento do Z-API e encaminha normalizado' })
  handleZapi(
    @Param('tenantId') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.service.handleZapi(tenantId, payload);
  }

  @Post('sendpulse/:tenantId')
  @ApiOperation({ summary: 'Recebe evento do SendPulse e encaminha normalizado' })
  handleSendpulse(
    @Param('tenantId') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.service.handleSendpulse(tenantId, payload);
  }
}
