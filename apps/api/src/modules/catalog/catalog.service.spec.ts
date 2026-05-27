import { ConflictException } from '@nestjs/common';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  it('rejects duplicated item names inside the tenant', async () => {
    const prisma = {
      productService: {
        findFirst: vi.fn().mockResolvedValue({ id: 'item-1' })
      }
    };
    const service = new CatalogService(prisma as never);

    await expect(
      service.create('tenant-1', {
        type: 'SERVICE',
        name: 'Troca de tela',
        price: 249.9
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
