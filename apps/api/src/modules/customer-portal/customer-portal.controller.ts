import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CustomerPortalService } from './customer-portal.service';

@ApiTags('customer-portal')
@Controller('public/customer-portal')
export class CustomerPortalController {
  constructor(private readonly customerPortalService: CustomerPortalService) {}

  @Get()
  @ApiOkResponse({ description: 'Consulta pública do portal do cliente por telefone ou documento.' })
  lookup(
    @Query('tenantSlug') tenantSlug?: string,
    @Query('document') document?: string,
    @Query('phone') phone?: string
  ) {
    return this.customerPortalService.lookup({ tenantSlug, document, phone });
  }
}
