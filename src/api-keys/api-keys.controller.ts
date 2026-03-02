import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/auth.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('API Keys')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova API Key (requer master key)' })
  create(@Body() dto: CreateApiKeyDto, @Request() req: { isMaster: boolean }) {
    if (!req.isMaster) throw new ForbiddenException('Apenas master key pode criar API keys');
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar API Keys (requer master key)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filtrar por tenant' })
  findAll(
    @Request() req: { isMaster: boolean },
    @Query('tenantId') tenantId?: string,
  ) {
    if (!req.isMaster) throw new ForbiddenException('Apenas master key pode listar API keys');
    return this.service.findAll(tenantId);
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotacionar API Key — gera nova key, retorna em texto claro (única vez)' })
  rotate(@Param('id') id: string, @Request() req: { isMaster: boolean }) {
    if (!req.isMaster) throw new ForbiddenException('Apenas master key pode rotacionar API keys');
    return this.service.rotate(id);
  }

  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revogar API Key (desativa sem deletar)' })
  revoke(@Param('id') id: string, @Request() req: { isMaster: boolean }) {
    if (!req.isMaster) throw new ForbiddenException('Apenas master key pode revogar API keys');
    return this.service.revoke(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar API Key permanentemente' })
  remove(@Param('id') id: string, @Request() req: { isMaster: boolean }) {
    if (!req.isMaster) throw new ForbiddenException('Apenas master key pode deletar API keys');
    return this.service.remove(id);
  }
}
