import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LinkConversationCustomerDto } from './dto/link-conversation-customer.dto';
import { SendWhatsAppMessageDto } from './dto/send-whatsapp-message.dto';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista conversas recentes do tenant autenticado.' })
  listConversations(@Req() request: AuthenticatedRequest) {
    return this.whatsAppService.listConversations(request.user.tenantId);
  }

  @Patch('conversations/:id/customer')
  @ApiOkResponse({ description: 'Vincula uma conversa a um cliente do tenant autenticado.' })
  linkConversationToCustomer(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: LinkConversationCustomerDto
  ) {
    return this.whatsAppService.linkConversationToCustomer(
      request.user.tenantId,
      id,
      input.customerId
    );
  }

  @Post('send')
  @ApiOkResponse({ description: 'Envia mensagem de texto permitida pela janela do WhatsApp.' })
  sendMessage(@Req() request: AuthenticatedRequest, @Body() input: SendWhatsAppMessageDto) {
    return this.whatsAppService.sendTextMessage(request.user.tenantId, input);
  }
}
