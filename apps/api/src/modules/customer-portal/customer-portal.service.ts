import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CustomerPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(input: { tenantSlug?: string; document?: string; phone?: string }) {
    const tenantSlug = input.tenantSlug?.trim();
    const document = input.document?.trim();
    const phone = input.phone?.trim();

    if (!tenantSlug) {
      throw new BadRequestException('Informe a empresa para consultar o portal.');
    }

    if (!document && !phone) {
      throw new BadRequestException('Informe documento ou telefone para consultar o portal.');
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        tenant: {
          slug: tenantSlug
        },
        OR: [{ document: document || undefined }, { phone: phone || undefined }]
      },
      include: {
        tenant: {
          select: {
            name: true,
            phone: true,
            logoUrl: true
          }
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        orders: {
          include: {
            payments: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        appointments: {
          where: {
            startsAt: {
              gte: new Date()
            }
          },
          orderBy: { startsAt: 'asc' },
          take: 10
        }
      }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return customer;
  }
}
