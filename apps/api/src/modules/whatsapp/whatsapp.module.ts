import { Module } from '@nestjs/common';
import { WhatsAppWebhookController } from './whatsapp.webhook.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  controllers: [WhatsAppWebhookController],
  providers: [WhatsAppService]
})
export class WhatsAppModule {}
