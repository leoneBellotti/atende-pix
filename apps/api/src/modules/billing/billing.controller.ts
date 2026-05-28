import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { SelectPlanDto } from './dto/select-plan.dto';

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

  @Post('subscription')
  @ApiOkResponse({ description: 'Seleciona plano para o tenant autenticado.' })
  selectPlan(@Req() request: AuthenticatedRequest, @Body() input: SelectPlanDto) {
    return this.billingService.selectPlan(request.user.tenantId, input.planCode);
  }
}
