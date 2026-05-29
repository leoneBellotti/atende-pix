import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista unidades da empresa.' })
  list(@Req() request: AuthenticatedRequest) {
    return this.locationsService.list(request.user.tenantId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Unidade criada.' })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateLocationDto) {
    return this.locationsService.create(request.user.tenantId, input);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Unidade atualizada.' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateLocationDto
  ) {
    return this.locationsService.update(request.user.tenantId, id, input);
  }
}
