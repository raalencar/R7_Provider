import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/auth.guard';
import { MessagesService } from './messages.service';
import { SendTextDto } from './dto/send-text.dto';
import { SendImageDto } from './dto/send-image.dto';
import { SendAudioDto } from './dto/send-audio.dto';
import { SendLocationDto } from './dto/send-location.dto';
import { SendTemplateDto } from './dto/send-template.dto';
import { SendButtonsDto } from './dto/send-buttons.dto';
import { SendLinkDto } from './dto/send-link.dto';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Messages')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Post('text')
  @ApiOperation({ summary: 'Enviar mensagem de texto' })
  sendText(@Body() dto: SendTextDto, @Request() req: { tenantId: string }) {
    return this.service.sendText(req.tenantId, dto.phone, dto.message);
  }

  @Post('image')
  @ApiOperation({ summary: 'Enviar imagem' })
  sendImage(@Body() dto: SendImageDto, @Request() req: { tenantId: string }) {
    return this.service.sendImage(req.tenantId, dto.phone, dto.url, dto.caption);
  }

  @Post('audio')
  @ApiOperation({ summary: 'Enviar áudio' })
  sendAudio(@Body() dto: SendAudioDto, @Request() req: { tenantId: string }) {
    return this.service.sendAudio(req.tenantId, dto.phone, dto.url);
  }

  @Post('location')
  @ApiOperation({ summary: 'Enviar localização' })
  sendLocation(@Body() dto: SendLocationDto, @Request() req: { tenantId: string }) {
    return this.service.sendLocation(
      req.tenantId,
      dto.phone,
      dto.lat,
      dto.lng,
      dto.title,
      dto.address,
    );
  }

  @Post('template')
  @ApiOperation({ summary: 'Enviar template com variáveis' })
  sendTemplate(@Body() dto: SendTemplateDto, @Request() req: { tenantId: string }) {
    return this.service.sendTemplate(
      req.tenantId,
      dto.phone,
      dto.template,
      dto.variables,
    );
  }

  @Post('buttons')
  @ApiOperation({ summary: 'Enviar mensagem com botões' })
  sendButtons(@Body() dto: SendButtonsDto, @Request() req: { tenantId: string }) {
    return this.service.sendButtons(
      req.tenantId,
      dto.phone,
      dto.text,
      dto.buttons,
    );
  }

  @Post('link')
  @ApiOperation({ summary: 'Enviar link' })
  sendLink(@Body() dto: SendLinkDto, @Request() req: { tenantId: string }) {
    return this.service.sendLink(req.tenantId, dto.phone, dto.url, dto.title);
  }
}
