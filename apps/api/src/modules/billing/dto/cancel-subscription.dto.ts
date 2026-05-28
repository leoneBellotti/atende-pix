import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ example: 'Nao estou usando o sistema neste momento.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
