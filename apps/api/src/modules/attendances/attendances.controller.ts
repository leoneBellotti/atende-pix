import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AttendanceOrigin, AttendanceStatus } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@ApiTags('attendances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista atendimentos do tenant autenticado.' })
  list(
    @Req() request: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('origin') origin?: AttendanceOrigin,
    @Query('status') status?: AttendanceStatus
  ) {
    return this.attendancesService.list(request.user.tenantId, {
      search,
      origin,
      status
    });
  }

  @Post()
  @ApiCreatedResponse({ description: 'Atendimento criado.' })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateAttendanceDto) {
    return this.attendancesService.create(request.user.tenantId, input);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe do atendimento.' })
  getById(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.attendancesService.getById(request.user.tenantId, id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Atendimento atualizado.' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateAttendanceDto
  ) {
    return this.attendancesService.update(request.user.tenantId, id, input);
  }

  @Post(':id/notes')
  @ApiOkResponse({ description: 'Nota adicionada ao atendimento.' })
  addNote(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('note') note: string
  ) {
    return this.attendancesService.addNote(request.user.tenantId, id, note);
  }
}
