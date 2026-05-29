import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista pedidos do tenant autenticado.' })
  list(@Req() request: AuthenticatedRequest, @Query('status') status?: OrderStatus) {
    return this.ordersService.list(request.user.tenantId, status);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Pedido criado.' })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateOrderDto) {
    return this.ordersService.create(request.user.tenantId, input);
  }

  @Post('from-quote/:quoteId')
  @ApiCreatedResponse({ description: 'Pedido criado a partir de orçamento.' })
  convertQuoteToOrder(@Req() request: AuthenticatedRequest, @Param('quoteId') quoteId: string) {
    return this.ordersService.convertQuoteToOrder(request.user.tenantId, quoteId);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe do pedido.' })
  getById(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.getById(request.user.tenantId, id);
  }

  @Patch(':id/status')
  @ApiOkResponse({ description: 'Status do pedido atualizado.' })
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateStatus(request.user.tenantId, id, input.status);
  }
}
