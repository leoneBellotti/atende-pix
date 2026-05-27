import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: this.tenantSelect()
    });

    if (!tenant) {
      throw new NotFoundException('Empresa nao encontrada.');
    }

    return tenant;
  }

  updateTenantSettings(tenantId: string, input: UpdateTenantSettingsDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: input.name,
        document: this.nullable(input.document),
        phone: this.nullable(input.phone),
        logoUrl: this.nullable(input.logoUrl)
      },
      select: this.tenantSelect()
    });
  }

  private nullable(value?: string) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  private tenantSelect() {
    return {
      id: true,
      name: true,
      slug: true,
      document: true,
      phone: true,
      logoUrl: true,
      updatedAt: true
    };
  }
}
