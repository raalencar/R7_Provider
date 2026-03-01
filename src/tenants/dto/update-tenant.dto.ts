import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsUrl } from 'class-validator';
import { ProviderType } from '@prisma/client';

export class UpdateTenantDto {
  @ApiPropertyOptional({ enum: ProviderType })
  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: ProviderType;

  @ApiPropertyOptional({ example: 'https://meuapp.com/webhook' })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Credenciais do provider (serão criptografadas)' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
