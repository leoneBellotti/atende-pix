import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GenerateQuoteItemsDto {
  @ApiProperty({ example: 'Troca de tela 1x 250\nPelícula 2x 30' })
  @IsString()
  @MinLength(2)
  text!: string;
}
