import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ example: 'Não estou usando o sistema neste momento.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
