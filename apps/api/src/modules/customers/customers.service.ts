import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, search?: string) {
    const term = search?.trim();

    return this.prisma.customer.findMany({
      where: {
        tenantId,
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { phone: { contains: term } },
                { document: { contains: term } }
              ]
            }
          : {})
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async create(tenantId: string, input: CreateCustomerDto) {
    await this.ensureNoDuplicate(tenantId, input);

    return this.prisma.customer.create({
      data: {
        tenantId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        document: input.document,
        notes: input.notes
      }
    });
  }

  async getById(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }

    return customer;
  }

  async update(tenantId: string, id: string, input: UpdateCustomerDto) {
    await this.getById(tenantId, id);
    await this.ensureNoDuplicate(tenantId, input, id);

    return this.prisma.customer.update({
      where: {
        id
      },
      data: input
    });
  }

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);

    await this.prisma.customer.delete({
      where: {
        id
      }
    });

    return { deleted: true };
  }

  private async ensureNoDuplicate(
    tenantId: string,
    input: Pick<CreateCustomerDto, 'phone' | 'document'>,
    ignoreId?: string
  ) {
    const conditions: Prisma.CustomerWhereInput[] = [];

    if (input.phone) {
      conditions.push({ phone: input.phone });
    }

    if (input.document) {
      conditions.push({ document: input.document });
    }

    if (!conditions.length) {
      return;
    }

    const existing = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        id: ignoreId ? { not: ignoreId } : undefined,
        OR: conditions
      }
    });

    if (existing) {
      throw new ConflictException('Ja existe cliente com esse telefone ou documento.');
    }
  }
}
