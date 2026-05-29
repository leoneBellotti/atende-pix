import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('summary')
  @ApiOkResponse({ description: 'Resumo operacional interno do SaaS.' })
  summary(@Req() request: AuthenticatedRequest) {
    return this.adminService.summary(request.user.userId);
  }

  @Get('me')
  @ApiOkResponse({ description: 'Confirma se o usuário autenticado e administrador.' })
  me(@Req() request: AuthenticatedRequest) {
    return this.adminService.me(request.user.userId);
  }

  @Get('error-logs')
  @ApiOkResponse({ description: 'Eventos recentes do monitoramento de erros da API.' })
  errorLogs(@Req() request: AuthenticatedRequest, @Query('limit') limit?: string) {
    return this.adminService.errorLogs(request.user.userId, limit);
  }

  @Get('tenants')
  @ApiOkResponse({ description: 'Empresas cadastradas no SaaS.' })
  tenants(@Req() request: AuthenticatedRequest) {
    return this.adminService.tenants(request.user.userId);
  }

  @Get('tenants/:tenantId/audit-logs')
  @ApiOkResponse({ description: 'Eventos recentes de auditoria da empresa.' })
  auditLogs(
    @Req() request: AuthenticatedRequest,
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: string
  ) {
    return this.adminService.auditLogs(request.user.userId, tenantId, limit);
  }

  @Post('tenants/:tenantId/past-due')
  @ApiOkResponse({ description: 'Marca uma empresa como inadimplente para teste operacional.' })
  markTenantPastDue(@Req() request: AuthenticatedRequest, @Param('tenantId') tenantId: string) {
    return this.adminService.markTenantPastDue(request.user.userId, tenantId);
  }

  @Post('tenants/:tenantId/suspend')
  @ApiOkResponse({ description: 'Suspende uma empresa inadimplente.' })
  suspendTenant(@Req() request: AuthenticatedRequest, @Param('tenantId') tenantId: string) {
    return this.adminService.suspendTenant(request.user.userId, tenantId);
  }

  @Post('tenants/:tenantId/regularize')
  @ApiOkResponse({ description: 'Regulariza uma empresa e reativa a assinatura.' })
  regularizeTenant(@Req() request: AuthenticatedRequest, @Param('tenantId') tenantId: string) {
    return this.adminService.regularizeTenant(request.user.userId, tenantId);
  }
}
