import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('message-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('message-templates')
export class MessageTemplatesController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista templates de utilidade do tenant autenticado.' })
  list(@Req() request: AuthenticatedRequest) {
    return this.whatsAppService.listMessageTemplates(request.user.tenantId);
  }
}
