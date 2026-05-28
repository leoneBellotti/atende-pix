import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
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
}
