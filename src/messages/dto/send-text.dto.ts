import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendTextDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Olá, tudo bem?' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
