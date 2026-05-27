import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista orcamentos do tenant autenticado.' })
  list(@Req() request: AuthenticatedRequest) {
    return this.quotesService.list(request.user.tenantId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Orcamento criado.' })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateQuoteDto) {
    return this.quotesService.create(request.user.tenantId, input);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe do orcamento.' })
  getById(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.quotesService.getById(request.user.tenantId, id);
  }

  @Patch(':id/status')
  @ApiOkResponse({ description: 'Status do orcamento atualizado.' })
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateQuoteStatusDto
  ) {
    return this.quotesService.updateStatus(request.user.tenantId, id, input.status);
  }
}

@ApiTags('public')
@Controller('public/quotes')
export class PublicQuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get(':token')
  @ApiOkResponse({ description: 'Visualizacao publica do orcamento.' })
  getPublicByToken(@Param('token') token: string) {
    return this.quotesService.getPublicByToken(token);
  }
}
