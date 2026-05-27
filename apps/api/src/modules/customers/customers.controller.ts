import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista clientes do tenant autenticado.' })
  list(@Req() request: AuthenticatedRequest, @Query('search') search?: string) {
    return this.customersService.list(request.user.tenantId, search);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Cliente criado.' })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateCustomerDto) {
    return this.customersService.create(request.user.tenantId, input);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe do cliente.' })
  getById(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.customersService.getById(request.user.tenantId, id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Cliente atualizado.' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateCustomerDto
  ) {
    return this.customersService.update(request.user.tenantId, id, input);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Cliente removido.' })
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.customersService.remove(request.user.tenantId, id);
  }
}
