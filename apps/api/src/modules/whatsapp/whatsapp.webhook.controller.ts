import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('webhooks')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get()
  @ApiOkResponse({ description: 'Verificacao do webhook do WhatsApp Cloud API.' })
  verify(@Query() query: Record<string, string>) {
    return this.whatsAppService.verifyWebhook({
      mode: query['hub.mode'],
      token: query['hub.verify_token'],
      challenge: query['hub.challenge']
    });
  }

  @Post()
  @ApiOkResponse({ description: 'Webhook de mensagens do WhatsApp recebido.' })
  handle(
    @Body() body: Record<string, unknown>,
    @Headers('x-hub-signature-256') signature?: string
  ) {
    return this.whatsAppService.handleWebhook({ body, signature });
  }
}
