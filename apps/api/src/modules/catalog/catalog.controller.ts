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
import { ProductServiceType } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';

@ApiTags('catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalog/items')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista produtos e servicos do tenant autenticado.' })
  list(
    @Req() request: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('type') type?: ProductServiceType,
    @Query('active') active?: string
  ) {
    return this.catalogService.list(request.user.tenantId, {
      search,
      type,
      active: active === undefined ? undefined : active === 'true'
    });
  }

  @Post()
  @ApiCreatedResponse({ description: 'Item de catalogo criado.' })
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateCatalogItemDto) {
    return this.catalogService.create(request.user.tenantId, input);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhe do item de catalogo.' })
  getById(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.catalogService.getById(request.user.tenantId, id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Item de catalogo atualizado.' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateCatalogItemDto
  ) {
    return this.catalogService.update(request.user.tenantId, id, input);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Item de catalogo desativado.' })
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.catalogService.remove(request.user.tenantId, id);
  }
}
