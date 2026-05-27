import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceOrigin, AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

type AttendanceFilters = {
  search?: string;
  origin?: AttendanceOrigin;
  status?: AttendanceStatus;
};

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, filters: AttendanceFilters = {}) {
    const term = filters.search?.trim();

    return this.prisma.attendance.findMany({
      where: {
        tenantId,
        origin: filters.origin,
        status: filters.status,
        ...(term
          ? {
              OR: [
                { summary: { contains: term, mode: 'insensitive' } },
                { internalNotes: { contains: term, mode: 'insensitive' } },
                { customer: { name: { contains: term, mode: 'insensitive' } } },
                { customer: { phone: { contains: term } } }
              ]
            }
          : {})
      },
      include: {
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async create(tenantId: string, input: CreateAttendanceDto) {
    await this.ensureCustomerBelongsToTenant(tenantId, input.customerId);

    return this.prisma.attendance.create({
      data: {
        tenantId,
        customerId: input.customerId,
        origin: input.origin,
        summary: input.summary,
        internalNotes: input.internalNotes,
        responsibleName: input.responsibleName
      },
      include: {
        customer: true
      }
    });
  }

  async getById(tenantId: string, id: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        customer: true
      }
    });

    if (!attendance) {
      throw new NotFoundException('Atendimento nao encontrado.');
    }

    return attendance;
  }

  async update(tenantId: string, id: string, input: UpdateAttendanceDto) {
    await this.getById(tenantId, id);

    if (input.customerId) {
      await this.ensureCustomerBelongsToTenant(tenantId, input.customerId);
    }

    return this.prisma.attendance.update({
      where: { id },
      data: input,
      include: {
        customer: true
      }
    });
  }

  async addNote(tenantId: string, id: string, note: string) {
    const attendance = await this.getById(tenantId, id);
    const nextNotes = [attendance.internalNotes, note].filter(Boolean).join('\n\n');

    return this.prisma.attendance.update({
      where: { id },
      data: {
        internalNotes: nextNotes
      },
      include: {
        customer: true
      }
    });
  }

  private async ensureCustomerBelongsToTenant(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId
      }
    });

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado para este atendimento.');
    }
  }
}
