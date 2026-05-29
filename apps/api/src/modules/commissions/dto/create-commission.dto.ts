import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCommissionDto {
  @ApiProperty({ example: 'order-id' })
  @IsString()
  orderId!: string;

  @ApiProperty({ example: 'Ana Vendedora' })
  @IsString()
  @MinLength(2)
  salespersonName!: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  rate!: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;
}
