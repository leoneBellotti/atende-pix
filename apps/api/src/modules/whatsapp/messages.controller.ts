import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LinkConversationCustomerDto } from './dto/link-conversation-customer.dto';
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
}
