import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator';

class CreateQuoteItemDto {
  @IsString()
  @MinLength(2)
  description!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateQuoteDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  attendanceId?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items!: CreateQuoteItemDto[];
}
