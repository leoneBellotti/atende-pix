import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuotePdfService } from './quote-pdf.service';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly quotePdfService: QuotePdfService
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Lista orçamentos do tenant autenticado.' })
  list(@Req() request: AuthenticatedRequest) {
    return this.quotesService.list(request.user.tenantId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Orçamento criado.' })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateQuoteDto) {
    return this.quotesService.create(request.user.tenantId, input);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe do orçamento.' })
  getById(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.quotesService.getById(request.user.tenantId, id);
  }

  @Get(':id/pdf')
  @ApiOkResponse({ description: 'PDF do orçamento.' })
  async getPdf(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() response: Response
  ) {
    const quote = await this.quotesService.getById(request.user.tenantId, id);
    const pdf = await this.quotePdfService.generate(quote);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `inline; filename="orçamento-${quote.number}.pdf"`);
    response.send(pdf);
  }

  @Patch(':id/status')
  @ApiOkResponse({ description: 'Status do orçamento atualizado.' })
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
  constructor(
    private readonly quotesService: QuotesService,
    private readonly quotePdfService: QuotePdfService
  ) {}

  @Get(':token')
  @ApiOkResponse({ description: 'Visualizacao publica do orçamento.' })
  getPublicByToken(@Param('token') token: string) {
    return this.quotesService.getPublicByToken(token);
  }

  @Get(':token/pdf')
  @ApiOkResponse({ description: 'PDF público do orçamento.' })
  async getPublicPdf(@Param('token') token: string, @Res() response: Response) {
    const quote = await this.quotesService.getPublicByToken(token);
    const pdf = await this.quotePdfService.generate(quote);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `inline; filename="orçamento-${quote.number}.pdf"`);
    response.send(pdf);
  }
}
