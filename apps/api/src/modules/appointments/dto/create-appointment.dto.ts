import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'customer-id' })
  @IsString()
  customerId!: string;

  @ApiProperty({ example: 'location-id', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ example: 'order-id', required: false })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ example: 'Instalação do equipamento' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ example: 'Levar fonte reserva.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'Leone', required: false })
  @IsOptional()
  @IsString()
  responsibleName?: string;

  @ApiProperty({ example: '2026-06-01T13:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-06-01T14:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiProperty({ enum: AppointmentStatus, required: false })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
