import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class SendLinkDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'https://exemplo.com' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: 'Acesse nosso site' })
  @IsOptional()
  @IsString()
  title?: string;
}
