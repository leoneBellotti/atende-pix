import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

type AppointmentFilters = {
  status?: AppointmentStatus;
  from?: string;
  to?: string;
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, filters: AppointmentFilters = {}) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: filters.status,
        startsAt: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined
        }
      },
      include: {
        customer: true,
        location: true,
        order: true
      },
      orderBy: { startsAt: 'asc' }
    });
  }

  create(tenantId: string, input: CreateAppointmentDto) {
    return this.prisma.appointment.create({
      data: {
        tenantId,
        customerId: input.customerId,
        locationId: input.locationId || null,
        orderId: input.orderId || null,
        title: input.title,
        notes: input.notes,
        responsibleName: input.responsibleName,
        status: input.status ?? 'SCHEDULED',
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null
      },
      include: {
        customer: true,
        location: true,
        order: true
      }
    });
  }

  async update(tenantId: string, id: string, input: UpdateAppointmentDto) {
    await this.getById(tenantId, id);

    return this.prisma.appointment.update({
      where: { id },
      data: {
        customerId: input.customerId,
        locationId: input.locationId,
        orderId: input.orderId,
        title: input.title,
        notes: input.notes,
        responsibleName: input.responsibleName,
        status: input.status,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined
      },
      include: {
        customer: true,
        location: true,
        order: true
      }
    });
  }

  async getById(tenantId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id, tenantId } });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    return appointment;
  }
}
