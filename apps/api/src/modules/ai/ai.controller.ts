import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GenerateQuoteItemsDto } from './dto/generate-quote-items.dto';
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

  @Post('conversations/:id/reply-suggestion')
  @ApiOkResponse({ description: 'Gera sugestao editavel de resposta.' })
  suggestReply(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.aiService.suggestReply(request.user.tenantId, id);
  }

  @Post('quote-items')
  @ApiOkResponse({ description: 'Gera itens de orcamento a partir de texto livre.' })
  generateQuoteItems(@Body() input: GenerateQuoteItemsDto) {
    return this.aiService.generateQuoteItemsFromText(input.text);
  }
}
