import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SelectPlanDto } from './dto/select-plan.dto';
import { StartSubscriptionCheckoutDto } from './dto/start-subscription-checkout.dto';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOkResponse({ description: 'Lista planos disponiveis.' })
  listPlans() {
    return this.billingService.listPlans();
  }

  @Get('subscription')
  @ApiOkResponse({ description: 'Assinatura atual do tenant autenticado.' })
  getSubscription(@Req() request: AuthenticatedRequest) {
    return this.billingService.getCurrentSubscription(request.user.tenantId);
  }

  @Get('usage')
  @ApiOkResponse({ description: 'Uso atual e limites do plano.' })
  getUsage(@Req() request: AuthenticatedRequest) {
    return this.billingService.getUsage(request.user.tenantId);
  }

  @Post('subscription')
  @ApiOkResponse({ description: 'Seleciona plano para o tenant autenticado.' })
  selectPlan(@Req() request: AuthenticatedRequest, @Body() input: SelectPlanDto) {
    return this.billingService.selectPlan(
      request.user.tenantId,
      request.user.userId,
      input.planCode
    );
  }

  @Post('subscription/checkout')
  @ApiOkResponse({ description: 'Inicia checkout de assinatura do SaaS.' })
  startCheckout(@Req() request: AuthenticatedRequest, @Body() input: StartSubscriptionCheckoutDto) {
    return this.billingService.startCheckout(
      request.user.tenantId,
      request.user.userId,
      input.planCode
    );
  }

  @Post('subscription/checkout/:id/confirm')
  @ApiOkResponse({ description: 'Confirma pagamento local do checkout de assinatura.' })
  confirmCheckout(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.billingService.confirmCheckout(request.user.tenantId, request.user.userId, id);
  }

  @Post('subscription/cancel')
  @ApiOkResponse({ description: 'Agenda cancelamento da assinatura ao fim do período.' })
  cancelSubscription(@Req() request: AuthenticatedRequest, @Body() input: CancelSubscriptionDto) {
    return this.billingService.cancelSubscription(
      request.user.tenantId,
      request.user.userId,
      input.reason
    );
  }

  @Post('subscription/reactivate')
  @ApiOkResponse({ description: 'Reativa assinatura com cancelamento agendado.' })
  reactivateSubscription(@Req() request: AuthenticatedRequest) {
    return this.billingService.reactivateSubscription(request.user.tenantId, request.user.userId);
  }
}
