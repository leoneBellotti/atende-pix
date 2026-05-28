import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SelectPlanDto {
  @ApiProperty({ example: 'pro' })
  @IsString()
  planCode!: string;
}
