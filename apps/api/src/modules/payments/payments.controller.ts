import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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

  @Post('orders/:orderId/payments/manual-confirm')
  @ApiCreatedResponse({ description: 'Pagamento manual confirmado.' })
  manualConfirm(
    @Req() request: AuthenticatedRequest,
    @Param('orderId') orderId: string,
    @Body() input: ManualConfirmPaymentDto
  ) {
    return this.paymentsService.manualConfirm(request.user.tenantId, orderId, input);
  }

  @Post('orders/:orderId/payments/pix')
  @ApiCreatedResponse({ description: 'Cobranca Pix gerada.' })
  createPix(@Req() request: AuthenticatedRequest, @Param('orderId') orderId: string) {
    return this.paymentsService.createPix(request.user.tenantId, orderId);
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
