import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('conversations/:id/summary')
  @ApiOkResponse({ description: 'Gera resumo assistido da conversa.' })
  summarizeConversation(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.aiService.summarizeConversation(request.user.tenantId, id);
  }
}
