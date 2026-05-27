import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class ManualConfirmPaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
