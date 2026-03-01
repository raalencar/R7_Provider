import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/auth.guard';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Tenants')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar configuração de provider para um tenant' })
  create(@Body() dto: CreateTenantDto, @Request() req: { isMaster: boolean }) {
    if (!req.isMaster) throw new ForbiddenException('Apenas master key pode criar tenants');
    return this.service.create(dto);
  }

  @Get(':tenantId')
  @ApiOperation({ summary: 'Buscar configuração de um tenant' })
  findOne(@Param('tenantId') tenantId: string) {
    return this.service.findOne(tenantId);
  }

  @Put(':tenantId')
  @ApiOperation({ summary: 'Atualizar configuração de um tenant' })
  update(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
    @Request() req: { isMaster: boolean },
  ) {
    if (!req.isMaster) throw new ForbiddenException('Apenas master key pode atualizar tenants');
    return this.service.update(tenantId, dto);
  }

  @Delete(':tenantId')
  @ApiOperation({ summary: 'Remover configuração de um tenant' })
  remove(
    @Param('tenantId') tenantId: string,
    @Request() req: { isMaster: boolean },
  ) {
    if (!req.isMaster) throw new ForbiddenException('Apenas master key pode remover tenants');
    return this.service.remove(tenantId);
  }

  @Get(':tenantId/status')
  @ApiOperation({ summary: 'Verificar status da conexão WhatsApp do tenant' })
  getStatus(@Param('tenantId') tenantId: string) {
    return this.service.getStatus(tenantId);
  }
}
