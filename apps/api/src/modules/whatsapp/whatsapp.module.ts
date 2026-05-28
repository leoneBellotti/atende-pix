import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessageTemplatesController } from './message-templates.controller';
import { MessagesController } from './messages.controller';
import { WhatsAppWebhookController } from './whatsapp.webhook.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [AuthModule],
  controllers: [MessageTemplatesController, MessagesController, WhatsAppWebhookController],
  providers: [WhatsAppService]
})
export class WhatsAppModule {}
