import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateWhatsAppConfigDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: '123456789012345' })
  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @ApiPropertyOptional({ example: '123456789012345' })
  @IsOptional()
  @IsString()
  businessAccountId?: string;

  @ApiPropertyOptional({ example: 'EAAB...' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ example: 'atende-pix-webhook-token' })
  @IsOptional()
  @IsString()
  verifyToken?: string;

  @ApiPropertyOptional({ example: 'app-secret' })
  @IsOptional()
  @IsString()
  appSecret?: string;
}
