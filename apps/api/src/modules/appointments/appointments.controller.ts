import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista agenda da empresa.' })
  list(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: AppointmentStatus,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.appointmentsService.list(request.user.tenantId, { status, from, to });
  }

  @Post()
  @ApiCreatedResponse({ description: 'Agendamento criado.' })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateAppointmentDto) {
    return this.appointmentsService.create(request.user.tenantId, input);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Agendamento atualizado.' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateAppointmentDto
  ) {
    return this.appointmentsService.update(request.user.tenantId, id, input);
  }
}
