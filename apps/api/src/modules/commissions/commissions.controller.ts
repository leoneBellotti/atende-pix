import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommissionsService } from './commissions.service';
import { CreateCommissionDto } from './dto/create-commission.dto';

@ApiTags('commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista comissões da empresa.' })
  list(@Req() request: AuthenticatedRequest) {
    return this.commissionsService.list(request.user.tenantId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Comissão registrada.' })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateCommissionDto) {
    return this.commissionsService.create(request.user.tenantId, input);
  }

  @Patch(':id/paid')
  @ApiOkResponse({ description: 'Comissão marcada como paga.' })
  markPaid(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.commissionsService.markPaid(request.user.tenantId, id);
  }
}
