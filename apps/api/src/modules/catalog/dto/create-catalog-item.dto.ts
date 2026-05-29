import { ApiProperty } from '@nestjs/swagger';
import { ProductServiceType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCatalogItemDto {
  @ApiProperty({ enum: ProductServiceType, example: ProductServiceType.SERVICE })
  @IsEnum(ProductServiceType)
  type!: ProductServiceType;

  @ApiProperty({ example: 'Troca de tela' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'Serviço de troca de tela com garantia.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 249.9 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}
