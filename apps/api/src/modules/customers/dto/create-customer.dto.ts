import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ana Clara' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: '11988887777', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'ana@email.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '12345678900', required: false })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({ example: 'Prefere atendimento por WhatsApp.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
