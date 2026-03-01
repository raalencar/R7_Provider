import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';
import { ProviderType } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty({ example: 'tenant-abc' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ enum: ProviderType })
  @IsEnum(ProviderType)
  providerType: ProviderType;

  @ApiPropertyOptional({ example: 'https://meuapp.com/webhook' })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiProperty({
    description: 'Credenciais do provider (serão criptografadas)',
    example: { baseUrl: 'http://vps:8080', apiKey: 'xxx', instance: 'minha-instancia' },
  })
  @IsObject()
  config: Record<string, unknown>;
}
