import { NotFoundException } from '@nestjs/common';
import { AttendancesService } from './attendances.service';

describe('AttendancesService', () => {
  it('rejects attendances for customers outside the tenant', async () => {
    const prisma = {
      customer: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };
    const service = new AttendancesService(prisma as never);

    await expect(
      service.create('tenant-1', {
        customerId: 'customer-1',
        origin: 'WHATSAPP'
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
