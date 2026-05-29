import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Matriz' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: '(11) 99999-0000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Rua Principal, 100', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
