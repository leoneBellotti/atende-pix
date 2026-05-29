import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.location.findMany({
      where: { tenantId },
      orderBy: [{ active: 'desc' }, { name: 'asc' }]
    });
  }

  async create(tenantId: string, input: CreateLocationDto) {
    await this.ensureUniqueName(tenantId, input.name);

    return this.prisma.location.create({
      data: {
        tenantId,
        name: input.name,
        phone: input.phone,
        address: input.address,
        active: input.active ?? true
      }
    });
  }

  async update(tenantId: string, id: string, input: UpdateLocationDto) {
    await this.getById(tenantId, id);

    if (input.name) {
      await this.ensureUniqueName(tenantId, input.name, id);
    }

    return this.prisma.location.update({
      where: { id },
      data: input
    });
  }

  async getById(tenantId: string, id: string) {
    const location = await this.prisma.location.findFirst({ where: { id, tenantId } });

    if (!location) {
      throw new NotFoundException('Unidade não encontrada.');
    }

    return location;
  }

  private async ensureUniqueName(tenantId: string, name: string, ignoreId?: string) {
    const existing = await this.prisma.location.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
        id: ignoreId ? { not: ignoreId } : undefined
      }
    });

    if (existing) {
      throw new ConflictException('Já existe unidade com esse nome.');
    }
  }
}
