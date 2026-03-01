import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ButtonDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  label: string;
}

export class SendButtonsDto {
  @ApiProperty({ example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Escolha uma opção:' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: [{ id: 'btn1', label: 'Confirmar' }, { id: 'btn2', label: 'Cancelar' }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ButtonDto)
  buttons: ButtonDto[];
}
