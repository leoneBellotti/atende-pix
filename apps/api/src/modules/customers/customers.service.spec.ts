import { ConflictException } from '@nestjs/common';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  it('rejects duplicate phone numbers inside the tenant', async () => {
    const prisma = {
      customer: {
        findFirst: vi.fn().mockResolvedValue({ id: 'customer-1' })
      }
    };
    const service = new CustomersService(prisma as never);

    await expect(
      service.create('tenant-1', { name: 'Ana', phone: '11999999999' })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
