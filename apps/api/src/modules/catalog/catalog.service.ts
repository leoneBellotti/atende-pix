import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductServiceType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';

type CatalogFilters = {
  search?: string;
  type?: ProductServiceType;
  active?: boolean;
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, filters: CatalogFilters = {}) {
    const term = filters.search?.trim();

    return this.prisma.productService.findMany({
      where: {
        tenantId,
        type: filters.type,
        active: filters.active,
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } }
              ]
            }
          : {})
      },
      orderBy: [{ active: 'desc' }, { name: 'asc' }]
    });
  }

  async create(tenantId: string, input: CreateCatalogItemDto) {
    await this.ensureUniqueName(tenantId, input.name);

    return this.prisma.productService.create({
      data: {
        tenantId,
        type: input.type,
        name: input.name,
        description: input.description,
        price: new Prisma.Decimal(input.price)
      }
    });
  }

  async getById(tenantId: string, id: string) {
    const item = await this.prisma.productService.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!item) {
      throw new NotFoundException('Item de catálogo não encontrado.');
    }

    return item;
  }

  async update(tenantId: string, id: string, input: UpdateCatalogItemDto) {
    await this.getById(tenantId, id);

    if (input.name) {
      await this.ensureUniqueName(tenantId, input.name, id);
    }

    return this.prisma.productService.update({
      where: { id },
      data: {
        ...input,
        price: input.price === undefined ? undefined : new Prisma.Decimal(input.price)
      }
    });
  }

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);

    await this.prisma.productService.update({
      where: { id },
      data: {
        active: false
      }
    });

    return { deleted: true };
  }

  private async ensureUniqueName(tenantId: string, name: string, ignoreId?: string) {
    const existing = await this.prisma.productService.findFirst({
      where: {
        tenantId,
        name: {
          equals: name,
          mode: 'insensitive'
        },
        id: ignoreId ? { not: ignoreId } : undefined
      }
    });

    if (existing) {
      throw new ConflictException('Já existe item de catálogo com esse nome.');
    }
  }
}
