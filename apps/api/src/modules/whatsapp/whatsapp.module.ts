import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { WhatsAppWebhookController } from './whatsapp.webhook.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  controllers: [MessagesController, WhatsAppWebhookController],
  providers: [WhatsAppService]
})
export class WhatsAppModule {}
