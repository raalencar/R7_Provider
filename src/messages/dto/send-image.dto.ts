import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class SendImageDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'https://exemplo.com/imagem.jpg' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: 'Veja esta imagem!' })
  @IsOptional()
  @IsString()
  caption?: string;
}
