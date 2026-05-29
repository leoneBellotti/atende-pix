import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateAutomationRuleDto {
  @ApiProperty({ example: 'Follow-up de orçamento' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'QUOTE_SENT' })
  @IsString()
  trigger!: string;

  @ApiProperty({ example: 24 })
  @IsInt()
  @Min(1)
  delayHours!: number;

  @ApiProperty({ example: 'Olá! Passando para saber se ficou alguma dúvida sobre o orçamento.' })
  @IsString()
  @MinLength(1)
  messageBody!: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
