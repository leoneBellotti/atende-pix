import { ApiProperty } from '@nestjs/swagger';
import { ProductServiceType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCatalogItemDto {
  @ApiProperty({ enum: ProductServiceType, example: ProductServiceType.SERVICE })
  @IsEnum(ProductServiceType)
  type!: ProductServiceType;

  @ApiProperty({ example: 'Troca de tela' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'Servico de troca de tela com garantia.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 249.9 })
  @IsNumber()
  @Min(0)
  price!: number;
}
