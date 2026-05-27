import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'dono@empresa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-segura' })
  @IsString()
  @MinLength(6)
  password!: string;
}
