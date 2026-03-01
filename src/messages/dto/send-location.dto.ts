import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SendLocationDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: -23.5505 })
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @ApiProperty({ example: -46.6333 })
  @IsNumber()
  @Type(() => Number)
  lng: number;

  @ApiPropertyOptional({ example: 'Escritório' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Av. Paulista, 1000, São Paulo' })
  @IsOptional()
  @IsString()
  address?: string;
}
