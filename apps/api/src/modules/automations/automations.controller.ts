import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AutomationsService } from './automations.service';
import { CreateAutomationRuleDto } from './dto/create-automation-rule.dto';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';

@ApiTags('automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automations/rules')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista regras de automacao do tenant autenticado.' })
  listRules(@Req() request: AuthenticatedRequest) {
    return this.automationsService.listRules(request.user.tenantId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Regra de automacao criada.' })
  createRule(@Req() request: AuthenticatedRequest, @Body() input: CreateAutomationRuleDto) {
    return this.automationsService.createRule(request.user.tenantId, input);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Regra de automacao atualizada.' })
  updateRule(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateAutomationRuleDto
  ) {
    return this.automationsService.updateRule(request.user.tenantId, id, input);
  }
}
