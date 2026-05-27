import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentProviderConfigDto {
  @ApiPropertyOptional({ enum: PaymentProvider, example: PaymentProvider.MERCADO_PAGO })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @ApiPropertyOptional({
    example: 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000'
  })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ example: 'TEST-00000000-0000-0000-0000-000000000000' })
  @IsOptional()
  @IsString()
  publicKey?: string;

  @ApiPropertyOptional({ example: 'webhook-secret' })
  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
