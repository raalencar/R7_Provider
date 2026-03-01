import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class SendAudioDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'https://exemplo.com/audio.mp3' })
  @IsUrl()
  url: string;
}
