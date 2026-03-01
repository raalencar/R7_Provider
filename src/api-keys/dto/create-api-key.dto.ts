import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'zaproutev2-prod', description: 'Identificador legível da API key' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'tenant-abc', description: 'Tenant que essa key pode usar' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
