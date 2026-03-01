import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SendTemplateDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Olá {{1}}, seu pedido {{2}} foi confirmado!' })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiProperty({ example: ['João', '#12345'] })
  @IsArray()
  @IsString({ each: true })
  variables: string[];
}
