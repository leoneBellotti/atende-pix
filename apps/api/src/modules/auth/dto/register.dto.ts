import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Assistencia Tecnica Modelo' })
  @IsString()
  @MinLength(2)
  tenantName!: string;

  @ApiProperty({ example: '11999999999', required: false })
  @IsOptional()
  @IsString()
  tenantPhone?: string;

  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  userName!: string;

  @ApiProperty({ example: 'dono@empresa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-segura' })
  @IsString()
  @MinLength(6)
  password!: string;
}
