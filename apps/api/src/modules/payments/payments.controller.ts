import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ManualConfirmPaymentDto } from './dto/manual-confirm-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payments')
  @ApiOkResponse({ description: 'Lista pagamentos do tenant autenticado.' })
  list(@Req() request: AuthenticatedRequest) {
    return this.paymentsService.list(request.user.tenantId);
  }

  @Get('payments/webhook-events')
  @ApiOkResponse({ description: 'Lista eventos de webhook de pagamento do tenant autenticado.' })
  listWebhookEvents(@Req() request: AuthenticatedRequest) {
    return this.paymentsService.listWebhookEvents(request.user.tenantId);
  }

  @Post('orders/:orderId/payments/manual-confirm')
  @ApiCreatedResponse({ description: 'Pagamento manual confirmado.' })
  manualConfirm(
    @Req() request: AuthenticatedRequest,
    @Param('orderId') orderId: string,
    @Body() input: ManualConfirmPaymentDto
  ) {
    return this.paymentsService.manualConfirm(
      request.user.tenantId,
      request.user.userId,
      orderId,
      input
    );
  }

  @Post('orders/:orderId/payments/pix')
  @ApiCreatedResponse({ description: 'Cobrança Pix gerada.' })
  createPix(@Req() request: AuthenticatedRequest, @Param('orderId') orderId: string) {
    return this.paymentsService.createPix(request.user.tenantId, request.user.userId, orderId);
  }
}

@ApiTags('public')
@Controller('public/payments')
export class PublicPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get(':token')
  @ApiOkResponse({ description: 'Visualizacao publica do pagamento.' })
  getPublicByToken(@Param('token') token: string) {
    return this.paymentsService.getPublicByToken(token);
  }
}

@ApiTags('webhooks')
@Controller('webhooks/mercado-pago')
export class MercadoPagoWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOkResponse({ description: 'Webhook do Mercado Pago recebido.' })
  handle(
    @Body() body: Record<string, unknown>,
    @Query() query: Record<string, string>,
    @Headers('x-request-id') requestId?: string,
    @Headers('x-signature') signature?: string
  ) {
    return this.paymentsService.handleMercadoPagoWebhook({
      body,
      query,
      requestId,
      signature
    });
  }
}
