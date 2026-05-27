import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenant/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOkResponse({ description: 'Configuracoes da empresa autenticada.' })
  getTenantSettings(@Req() request: AuthenticatedRequest) {
    return this.settingsService.getTenantSettings(request.user.tenantId);
  }

  @Patch()
  @ApiOkResponse({ description: 'Configuracoes da empresa atualizadas.' })
  updateTenantSettings(
    @Req() request: AuthenticatedRequest,
    @Body() input: UpdateTenantSettingsDto
  ) {
    return this.settingsService.updateTenantSettings(request.user.tenantId, input);
  }
}
