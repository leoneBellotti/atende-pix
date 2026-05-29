import { ApiProperty } from '@nestjs/swagger';
import { AttendanceOrigin } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @ApiProperty({ example: 'customer-id' })
  @IsString()
  customerId!: string;

  @ApiProperty({ enum: AttendanceOrigin, example: AttendanceOrigin.WHATSAPP })
  @IsEnum(AttendanceOrigin)
  origin!: AttendanceOrigin;

  @ApiProperty({ example: 'Cliente pediu orçamento para troca de tela.', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ example: 'Prioridade alta.', required: false })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiProperty({ example: 'Maria', required: false })
  @IsOptional()
  @IsString()
  responsibleName?: string;
}
