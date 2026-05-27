import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  MercadoPagoWebhookController,
  PaymentsController,
  PublicPaymentsController
} from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController, PublicPaymentsController, MercadoPagoWebhookController],
  providers: [PaymentsService]
})
export class PaymentsModule {}
